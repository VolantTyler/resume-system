import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  buildJudgeEvidence,
  buildJudgeReport,
  createStubJudgeClient,
  evaluateResumeWithJudge,
  type JudgeResult,
} from "./judge.js";
import {
  appendJudgeLogEntry,
  buildJudgeLogEntry,
  judgeRoundRecordFromResult,
  type JudgeLogRoundRecord,
} from "./judge-log.js";
import {
  createJudgeLlmClient,
  resolveJudgeApiKey,
  type LlmClient,
} from "./llm.js";
import { DEBUG_OUTPUT_DIR } from "./paths.js";
import { applyJudgeRevision, type ReviseOptions } from "./revise.js";
import type { RoleBrief } from "./role-brief.js";
import type { ResumeData, ResumeVersion } from "./schemas.js";

export type JudgeTrigger = "generate" | "tailor" | "judge";

export interface FinalizeWithJudgeOptions {
  trigger: JudgeTrigger;
  roleBrief: RoleBrief;
  outputDir: string;
  /** Render function supplied by generate-resume to avoid circular imports. */
  render: (
    data: ResumeData,
    version: ResumeVersion,
    outputDir: string,
  ) => { markdownPath: string; htmlPath: string };
  maxRounds?: number;
  passScore?: number;
  client?: LlmClient;
  model?: string;
  /** Force stub judge even when an API key is present. */
  stub?: boolean;
  /** Skip judge entirely and only render once. */
  skipJudge?: boolean;
  writeDebug?: boolean;
  writeLog?: boolean;
  logFile?: string;
  runsDir?: string;
  applicationFitMode?: ReviseOptions["applicationFitMode"];
  matchReportSummary?: string;
  gapTerms?: string[];
}

export interface FinalizeRound {
  round: number;
  version: ResumeVersion;
  markdownPath: string;
  htmlPath: string;
  judgeReportPath?: string;
  judgeResult?: JudgeResult;
  revised: boolean;
}

export interface FinalizeResult {
  version: ResumeVersion;
  markdownPath: string;
  htmlPath: string;
  rounds: FinalizeRound[];
  passed: boolean;
  judged: boolean;
  logFile?: string;
  detailPath?: string;
}

function writeOutput(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, "utf8");
}

export function resolveJudgeMode(options: {
  stub?: boolean;
  skipJudge?: boolean;
  client?: LlmClient;
}): "off" | "stub" | "live" {
  if (options.skipJudge || process.env.RESUME_JUDGE === "off") {
    return "off";
  }
  if (options.client) {
    return "live";
  }
  if (options.stub || process.env.RESUME_JUDGE === "stub") {
    return "stub";
  }
  if (resolveJudgeApiKey()) {
    return "live";
  }
  // Default: always judge during generation; use stub when no API key.
  return "stub";
}

function resolveClient(
  data: ResumeData,
  options: FinalizeWithJudgeOptions,
  mode: "stub" | "live",
): LlmClient {
  if (options.client) {
    return options.client;
  }
  if (mode === "stub") {
    return createStubJudgeClient(data);
  }
  return createJudgeLlmClient();
}

/**
 * Render → judge → claim-safe revise loop used by generate, tailor, and on-demand judge.
 * Final résumé files are written only after the loop completes (or immediately if judge is off).
 */
export async function finalizeResumeWithJudge(
  data: ResumeData,
  initialVersion: ResumeVersion,
  options: FinalizeWithJudgeOptions,
): Promise<FinalizeResult> {
  const mode = resolveJudgeMode(options);
  const envMaxRounds = Number.parseInt(process.env.RESUME_JUDGE_MAX_ROUNDS ?? "2", 10);
  const maxRounds = options.maxRounds ?? (Number.isFinite(envMaxRounds) && envMaxRounds > 0 ? envMaxRounds : 2);
  const envPassScore = Number.parseFloat(process.env.RESUME_JUDGE_PASS_SCORE ?? "7");
  const passScore =
    options.passScore ?? (Number.isFinite(envPassScore) && envPassScore > 0 ? envPassScore : 7);
  const writeDebug = options.writeDebug ?? true;
  const writeLog = options.writeLog ?? true;
  // Curated generate: preserve hand-authored fit; stub never injects generic fit copy.
  // Tailor/on-demand judge pass applicationFitMode: "always" explicitly.
  const applicationFitMode =
    options.applicationFitMode ?? (mode === "stub" ? "never" : "if-missing");

  if (mode === "off") {
    const rendered = options.render(data, initialVersion, options.outputDir);
    return {
      version: initialVersion,
      markdownPath: rendered.markdownPath,
      htmlPath: rendered.htmlPath,
      rounds: [
        {
          round: 0,
          version: initialVersion,
          markdownPath: rendered.markdownPath,
          htmlPath: rendered.htmlPath,
          revised: false,
        },
      ],
      passed: true,
      judged: false,
    };
  }

  const client = resolveClient(data, options, mode);
  const modelLabel = mode === "stub" && !options.model ? "stub" : options.model;
  let version = initialVersion;
  const rounds: FinalizeRound[] = [];
  const roundRecords: JudgeLogRoundRecord[] = [];
  let passed = false;

  for (let round = 1; round <= maxRounds; round += 1) {
    // Intermediate renders are working copies; the final write happens after the loop.
    const { markdownPath, htmlPath } = options.render(data, version, options.outputDir);
    const resumeMarkdown = readFileSync(markdownPath, "utf8");
    const evidence = buildJudgeEvidence(data, {
      version,
      roleBrief: options.roleBrief,
      resumeMarkdown,
      matchReportSummary: options.matchReportSummary,
      gapTerms: options.gapTerms,
    });

    const judgeResult = await evaluateResumeWithJudge(evidence, {
      client,
      model: modelLabel,
      passScore,
      round,
    });

    const judgeReportPath = `${options.outputDir}/${version.output_slug}-judge-round-${round}.md`;
    writeOutput(
      judgeReportPath,
      buildJudgeReport(judgeResult, options.roleBrief, version),
    );

    if (writeDebug) {
      writeOutput(
        `${DEBUG_OUTPUT_DIR}/${version.output_slug}-judge-round-${round}.json`,
        JSON.stringify(
          {
            trigger: options.trigger,
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
    let applied: ReturnType<typeof applyJudgeRevision>["applied"] | undefined;

    const failed = !judgeResult.verdict.pass;
    const canContinue = round < maxRounds;
    const terminal = !failed || !canContinue;

    if (failed && canContinue) {
      const revision = applyJudgeRevision(data, version, judgeResult.verdict, {
        round,
        applicationFitMode: "never",
        applyDirectives: true,
      });
      version = revision.version;
      revised = revision.changed;
      applied = revision.applied;
    } else if (terminal) {
      const revision = applyJudgeRevision(data, version, judgeResult.verdict, {
        round,
        applicationFitMode,
        // On a failing terminal round, still apply last directives; on pass, only fit.
        applyDirectives: failed,
      });
      version = revision.version;
      revised = revision.changed;
      applied = revision.applied;
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
    roundRecords.push(judgeRoundRecordFromResult(judgeResult, revised, applied));

    if (judgeResult.verdict.pass) {
      passed = true;
      break;
    }
  }

  const finalRender = options.render(data, version, options.outputDir);
  let logFile: string | undefined;
  let detailPath: string | undefined;

  if (writeLog) {
    const entry = buildJudgeLogEntry({
      trigger: options.trigger,
      version,
      roleTitle: options.roleBrief.title,
      roleSource: options.roleBrief.sourcePath,
      maxRounds,
      passed,
      roundRecords,
    });
    const logged = appendJudgeLogEntry(entry, {
      logFile: options.logFile,
      runsDir: options.runsDir,
    });
    logFile = logged.logFile;
    detailPath = logged.detailPath;
  }

  return {
    version,
    markdownPath: finalRender.markdownPath,
    htmlPath: finalRender.htmlPath,
    rounds,
    passed,
    judged: true,
    logFile,
    detailPath,
  };
}
