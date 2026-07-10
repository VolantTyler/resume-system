import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderResumeVersionToDir } from "./generate-resume.js";
import {
  buildJudgeEvidence,
  buildJudgeReport,
  createStubJudgeClient,
  evaluateResumeWithJudge,
  type JudgeResult,
} from "./lib/judge.js";
import { createJudgeLlmClient, type LlmClient } from "./lib/llm.js";
import { DEBUG_OUTPUT_DIR, TAILORED_OUTPUT_DIR } from "./lib/paths.js";
import { applyJudgeRevision } from "./lib/revise.js";
import {
  buildMatchReport,
  readJobDescriptionTitle,
  tailorResumeForJobDescription,
  type JobDescription,
  type TailorOptions,
  type TailorResult,
} from "./lib/tailor.js";
import { assertValidResumeData } from "./lib/validate.js";
import type { ResumeData, ResumeVersion } from "./lib/schemas.js";

interface CliArgs {
  jobDescriptionPath: string;
  targetId?: string;
  label?: string;
  slug?: string;
  maxRounds: number;
  passScore: number;
  stub: boolean;
  model?: string;
}

export interface JudgeLoopOptions {
  maxRounds?: number;
  passScore?: number;
  client?: LlmClient;
  model?: string;
  stub?: boolean;
  outputDir?: string;
  writeDebug?: boolean;
}

export interface JudgeLoopRound {
  round: number;
  version: ResumeVersion;
  markdownPath: string;
  htmlPath: string;
  judgeReportPath: string;
  judgeResult: JudgeResult;
  revised: boolean;
}

export interface JudgeLoopResult {
  tailorResult: TailorResult;
  rounds: JudgeLoopRound[];
  finalVersion: ResumeVersion;
  finalMarkdownPath: string;
  finalHtmlPath: string;
  matchReportPath: string;
  passed: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const [jobDescriptionPath, ...rest] = argv;

  if (!jobDescriptionPath || jobDescriptionPath.startsWith("-")) {
    console.error(
      [
        "Usage: npm run judge -- <path-to-job-description.md> [options]",
        "",
        "Options:",
        "  --target <target-id>     Override recommended résumé target",
        "  --label \"Custom Label\"   Override tailored version label",
        "  --slug custom-slug       Override output slug",
        "  --max-rounds <n>         Judge/revise iterations (default: 2)",
        "  --pass-score <n>         Overall score needed to pass (default: 7)",
        "  --model <model>          OpenAI-compatible model id",
        "  --stub                   Use offline stub judge (no API key)",
      ].join("\n"),
    );
    process.exit(1);
  }

  const options: CliArgs = {
    jobDescriptionPath,
    maxRounds: 2,
    passScore: 7,
    stub: false,
  };

  for (let i = 0; i < rest.length; i += 1) {
    const flag = rest[i];
    const value = rest[i + 1];
    if (flag === "--target" && value) {
      options.targetId = value;
      i += 1;
    } else if (flag === "--label" && value) {
      options.label = value;
      i += 1;
    } else if (flag === "--slug" && value) {
      options.slug = value;
      i += 1;
    } else if (flag === "--max-rounds" && value) {
      options.maxRounds = Math.max(1, Number.parseInt(value, 10) || 2);
      i += 1;
    } else if (flag === "--pass-score" && value) {
      options.passScore = Math.min(10, Math.max(1, Number.parseFloat(value) || 7));
      i += 1;
    } else if (flag === "--model" && value) {
      options.model = value;
      i += 1;
    } else if (flag === "--stub") {
      options.stub = true;
    }
  }

  return options;
}

function loadJobDescription(path: string): JobDescription {
  const resolvedPath = isAbsolute(path) ? path : join(process.cwd(), path);
  if (!existsSync(resolvedPath)) {
    console.error(`✗ Job description file not found: ${path}`);
    process.exit(1);
  }

  const text = readFileSync(resolvedPath, "utf8");
  const title = readJobDescriptionTitle(resolvedPath, text);
  return { sourcePath: path, title, text };
}

function writeOutput(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, "utf8");
}

function resolveClient(data: ResumeData, options: JudgeLoopOptions): LlmClient {
  if (options.client) {
    return options.client;
  }
  if (options.stub) {
    return createStubJudgeClient(data);
  }
  return createJudgeLlmClient();
}

/**
 * Tailor → render → judge → revise loop.
 * Revisions are claim-safe (reorder/emphasis/application_fit only).
 */
export async function runJudgeLoop(
  data: ResumeData,
  jobDescription: JobDescription,
  tailorOptions: TailorOptions = {},
  loopOptions: JudgeLoopOptions = {},
): Promise<JudgeLoopResult> {
  const maxRounds = loopOptions.maxRounds ?? 2;
  const passScore = loopOptions.passScore ?? 7;
  const outputDir = loopOptions.outputDir ?? TAILORED_OUTPUT_DIR;
  const writeDebug = loopOptions.writeDebug ?? true;
  const client = resolveClient(data, loopOptions);

  const tailorResult = tailorResumeForJobDescription(data, jobDescription, tailorOptions);
  let version = tailorResult.version;
  const rounds: JudgeLoopRound[] = [];
  let passed = false;

  const matchReportPath = `${outputDir}/${version.output_slug}-match-report.md`;
  writeOutput(matchReportPath, buildMatchReport(tailorResult));

  for (let round = 1; round <= maxRounds; round += 1) {
    const { markdownPath, htmlPath } = renderResumeVersionToDir(data, version, outputDir);
    const resumeMarkdown = readFileSync(markdownPath, "utf8");
    const evidence = buildJudgeEvidence(data, { ...tailorResult, version }, resumeMarkdown);

    const judgeResult = await evaluateResumeWithJudge(evidence, {
      client,
      model: loopOptions.stub && !loopOptions.model ? "stub" : loopOptions.model,
      passScore,
      round,
    });

    const judgeReportPath = `${outputDir}/${version.output_slug}-judge-round-${round}.md`;
    writeOutput(judgeReportPath, buildJudgeReport(judgeResult, jobDescription, version));

    if (writeDebug) {
      const debugPath = `${DEBUG_OUTPUT_DIR}/${version.output_slug}-judge-round-${round}.json`;
      writeOutput(
        debugPath,
        JSON.stringify(
          {
            round,
            model: judgeResult.model,
            verdict: judgeResult.verdict,
            rawResponse: judgeResult.rawResponse,
          },
          null,
          2,
        ),
      );
    }

    let revised = false;
    if (!judgeResult.verdict.pass && round < maxRounds) {
      const revision = applyJudgeRevision(data, version, judgeResult.verdict, { round });
      version = revision.version;
      revised = revision.changed;
    } else if (judgeResult.verdict.pass || round === maxRounds) {
      // Always attach the latest application_fit on the terminal round.
      const revision = applyJudgeRevision(data, version, judgeResult.verdict, {
        round,
        attachApplicationFit: true,
      });
      version = revision.version;
      revised = revision.changed;
      // Re-render so application_fit appears in the final résumé.
      renderResumeVersionToDir(data, version, outputDir);
    }

    rounds.push({
      round,
      version,
      markdownPath,
      htmlPath,
      judgeReportPath,
      judgeResult,
      revised,
    });

    if (judgeResult.verdict.pass) {
      passed = true;
      break;
    }
  }

  const finalRender = renderResumeVersionToDir(data, version, outputDir);

  return {
    tailorResult: { ...tailorResult, version },
    rounds,
    finalVersion: version,
    finalMarkdownPath: finalRender.markdownPath,
    finalHtmlPath: finalRender.htmlPath,
    matchReportPath,
    passed,
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const jobDescription = loadJobDescription(args.jobDescriptionPath);
  const data = assertValidResumeData();

  const tailorOptions: TailorOptions = {
    targetId: args.targetId,
    label: args.label,
    slug: args.slug,
  };

  let result: JudgeLoopResult;
  try {
    result = await runJudgeLoop(data, jobDescription, tailorOptions, {
      maxRounds: args.maxRounds,
      passScore: args.passScore,
      stub: args.stub,
      model: args.model,
    });
  } catch (error) {
    console.error(`✗ ${(error as Error).message}`);
    process.exit(1);
    return;
  }

  const last = result.rounds[result.rounds.length - 1];
  console.log(`✓ Judge loop for "${jobDescription.title}"`);
  console.log(`  Target: ${result.tailorResult.target.label} (${result.tailorResult.target.id})`);
  console.log(`  Rounds: ${result.rounds.length}/${args.maxRounds}`);
  console.log(
    `  Final score: ${last.judgeResult.verdict.overall_score}/10 (${result.passed ? "pass" : "needs review"})`,
  );
  if (last.judgeResult.verdict.invented_claim_flags?.length) {
    console.log(
      `  Invented-claim flags: ${last.judgeResult.verdict.invented_claim_flags.length}`,
    );
  }
  console.log("");
  console.log("  Output files:");
  console.log(`    - ${result.finalMarkdownPath}`);
  console.log(`    - ${result.finalHtmlPath}`);
  console.log(`    - ${result.matchReportPath}`);
  for (const round of result.rounds) {
    console.log(`    - ${round.judgeReportPath}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void main();
}
