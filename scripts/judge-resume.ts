import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderResumeVersionToDir } from "./generate-resume.js";
import { finalizeResumeWithJudge, type FinalizeResult } from "./lib/finalize-resume.js";
import { TAILORED_OUTPUT_DIR } from "./lib/paths.js";
import {
  buildMatchReport,
  readJobDescriptionTitle,
  tailorResumeForJobDescription,
  type JobDescription,
  type TailorOptions,
  type TailorResult,
} from "./lib/tailor.js";
import { assertValidResumeData } from "./lib/validate.js";
import type { ResumeData } from "./lib/schemas.js";
import type { LlmClient } from "./lib/llm.js";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

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
  writeLog?: boolean;
  logFile?: string;
  runsDir?: string;
}

export interface JudgeLoopResult {
  tailorResult: TailorResult;
  finalize: FinalizeResult;
  finalVersion: FinalizeResult["version"];
  finalMarkdownPath: string;
  finalHtmlPath: string;
  matchReportPath: string;
  passed: boolean;
  rounds: FinalizeResult["rounds"];
}

function parseArgs(argv: string[]): CliArgs {
  const [jobDescriptionPath, ...rest] = argv;

  if (!jobDescriptionPath || jobDescriptionPath.startsWith("-")) {
    console.error(
      [
        "Usage: npm run judge -- <path-to-job-description.md> [options]",
        "",
        "On-demand judge for a job description. Standard `npm run generate` and",
        "`npm run tailor` already run this finalize loop automatically.",
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

/**
 * Tailor → finalize-with-judge (shared path used by generate/tailor).
 */
export async function runJudgeLoop(
  data: ResumeData,
  jobDescription: JobDescription,
  tailorOptions: TailorOptions = {},
  loopOptions: JudgeLoopOptions = {},
): Promise<JudgeLoopResult> {
  const outputDir = loopOptions.outputDir ?? TAILORED_OUTPUT_DIR;
  const tailorResult = tailorResumeForJobDescription(data, jobDescription, tailorOptions);

  const matchReportPath = `${outputDir}/${tailorResult.version.output_slug}-match-report.md`;
  writeOutput(matchReportPath, buildMatchReport(tailorResult));

  const finalize = await finalizeResumeWithJudge(data, tailorResult.version, {
    trigger: "judge",
    roleBrief: jobDescription,
    outputDir,
    render: renderResumeVersionToDir,
    applicationFitMode: "always",
    maxRounds: loopOptions.maxRounds,
    passScore: loopOptions.passScore,
    client: loopOptions.client,
    model: loopOptions.model,
    stub: loopOptions.stub,
    writeDebug: loopOptions.writeDebug,
    writeLog: loopOptions.writeLog,
    logFile: loopOptions.logFile,
    runsDir: loopOptions.runsDir,
    matchReportSummary: [
      `Recommended target: ${tailorResult.target.label} (${tailorResult.target.id})`,
      `Matched terms: ${tailorResult.matchedTerms.map((term) => term.term).join(", ") || "(none)"}`,
      `Gap terms: ${tailorResult.gapTerms.join(", ") || "(none)"}`,
    ].join("\n"),
    gapTerms: tailorResult.gapTerms,
  });

  return {
    tailorResult: { ...tailorResult, version: finalize.version },
    finalize,
    finalVersion: finalize.version,
    finalMarkdownPath: finalize.markdownPath,
    finalHtmlPath: finalize.htmlPath,
    matchReportPath,
    passed: finalize.passed,
    rounds: finalize.rounds,
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
    `  Final score: ${last.judgeResult?.verdict.overall_score}/10 (${result.passed ? "pass" : "needs review"})`,
  );
  if (last.judgeResult?.verdict.invented_claim_flags?.length) {
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
    if (round.judgeReportPath) {
      console.log(`    - ${round.judgeReportPath}`);
    }
  }
  if (result.finalize.detailPath) {
    console.log(`    - ${result.finalize.detailPath}`);
  }
  if (result.finalize.logFile) {
    console.log(`    - ${result.finalize.logFile}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void main();
}
