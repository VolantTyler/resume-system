import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DOCS_DIR, OUTPUT_DIR } from "./paths.js";
import type { ResumeVersion } from "./schemas.js";
import type { JudgeResult } from "./judge.js";
import type { ReviseResult } from "./revise.js";

export const JUDGE_LOG_FILE = join(DOCS_DIR, "judge-log.md");
export const JUDGE_RUNS_DIR = join(OUTPUT_DIR, "judge-runs");

export interface JudgeLogRoundRecord {
  round: number;
  score: number;
  pass: boolean;
  model: string;
  revised: boolean;
  directives: {
    prioritize: string[];
    demote: string[];
    emphasizeSkills: string[];
    deEmphasizeSkills: string[];
    notes: string[];
  };
  applied?: ReviseResult["applied"];
  inventedClaimFlags: string[];
}

export interface JudgeLogEntry {
  timestamp: string;
  trigger: "generate" | "tailor" | "judge";
  versionId: string;
  outputSlug: string;
  roleTitle: string;
  roleSource: string;
  rounds: number;
  maxRounds: number;
  finalScore: number;
  passed: boolean;
  model: string;
  changesSummary: string;
  roundRecords: JudgeLogRoundRecord[];
  detailRelativePath: string;
}

const LOG_HEADER = `# Judge Log

Append-only record of LLM judge loops run while finalizing résumés (generate, tailor, or on-demand judge).

| Timestamp (UTC) | Trigger | Version | Rounds | Final Score | Pass | Model | Changes Demanded | Detail |
|-----------------|---------|---------|--------|-------------|------|-------|------------------|--------|
`;

function ensureLogFile(logFile: string): void {
  if (!existsSync(logFile)) {
    mkdirSync(dirname(logFile), { recursive: true });
    writeFileSync(logFile, LOG_HEADER, "utf8");
  }
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ").trim();
}

export function summarizeJudgeChanges(rounds: JudgeLogRoundRecord[]): string {
  const parts: string[] = [];
  for (const round of rounds) {
    const bits: string[] = [];
    if (round.directives.prioritize.length) {
      bits.push(`prioritize ${round.directives.prioritize.join(", ")}`);
    }
    if (round.directives.demote.length) {
      bits.push(`demote ${round.directives.demote.join(", ")}`);
    }
    if (round.directives.emphasizeSkills.length) {
      bits.push(`emphasize ${round.directives.emphasizeSkills.join(", ")}`);
    }
    if (round.directives.deEmphasizeSkills.length) {
      bits.push(`de-emphasize ${round.directives.deEmphasizeSkills.join(", ")}`);
    }
    if (round.directives.notes.length) {
      bits.push(round.directives.notes.join("; "));
    }
    if (bits.length > 0) {
      parts.push(`r${round.round}: ${bits.join("; ")}`);
    }
  }
  return parts.length > 0 ? parts.join(" · ") : "none";
}

export function buildJudgeRunDetailMarkdown(entry: JudgeLogEntry): string {
  const lines: string[] = [
    `# Judge Run — ${entry.versionId}`,
    "",
    `**Timestamp:** ${entry.timestamp}`,
    `**Trigger:** ${entry.trigger}`,
    `**Role:** ${entry.roleTitle} (\`${entry.roleSource}\`)`,
    `**Rounds:** ${entry.rounds}/${entry.maxRounds}`,
    `**Final score:** ${entry.finalScore}/10 (${entry.passed ? "pass" : "needs review"})`,
    `**Model:** \`${entry.model}\``,
    "",
    `## Changes demanded`,
    "",
    entry.changesSummary,
    "",
  ];

  for (const round of entry.roundRecords) {
    lines.push(`## Round ${round.round}`);
    lines.push("");
    lines.push(`- Score: ${round.score}/10`);
    lines.push(`- Pass: ${round.pass ? "yes" : "no"}`);
    lines.push(`- Revised after: ${round.revised ? "yes" : "no"}`);
    lines.push(`- Model: \`${round.model}\``);
    lines.push("");
    lines.push("### Directives");
    lines.push("");
    lines.push(`- Prioritize: ${round.directives.prioritize.join(", ") || "—"}`);
    lines.push(`- Demote: ${round.directives.demote.join(", ") || "—"}`);
    lines.push(`- Emphasize skills: ${round.directives.emphasizeSkills.join(", ") || "—"}`);
    lines.push(
      `- De-emphasize skills: ${round.directives.deEmphasizeSkills.join(", ") || "—"}`,
    );
    if (round.directives.notes.length) {
      lines.push("- Notes:");
      for (const note of round.directives.notes) {
        lines.push(`  - ${note}`);
      }
    }
    if (round.applied) {
      lines.push("");
      lines.push("### Applied (claim-safe)");
      lines.push("");
      lines.push(`- Prioritized: ${round.applied.prioritized.join(", ") || "—"}`);
      lines.push(`- Demoted: ${round.applied.demoted.join(", ") || "—"}`);
      lines.push(`- Emphasized: ${round.applied.emphasizedSkills.join(", ") || "—"}`);
      lines.push(
        `- Ignored unknown IDs: ${round.applied.ignoredAccomplishmentIds.join(", ") || "—"}`,
      );
      lines.push(
        `- Ignored unknown skills: ${round.applied.ignoredSkillNames.join(", ") || "—"}`,
      );
    }
    if (round.inventedClaimFlags.length) {
      lines.push("");
      lines.push("### Invented claim flags");
      lines.push("");
      for (const flag of round.inventedClaimFlags) {
        lines.push(`- ${flag}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function appendJudgeLogEntry(
  entry: JudgeLogEntry,
  options: { logFile?: string; runsDir?: string } = {},
): { logFile: string; detailPath: string } {
  const logFile = options.logFile ?? JUDGE_LOG_FILE;
  const runsDir = options.runsDir ?? JUDGE_RUNS_DIR;

  ensureLogFile(logFile);
  mkdirSync(runsDir, { recursive: true });

  const detailName = entry.detailRelativePath.split("/").pop() ?? `${entry.outputSlug}.md`;
  const detailPath = join(runsDir, detailName);
  writeFileSync(detailPath, buildJudgeRunDetailMarkdown(entry), "utf8");

  const row = `| ${entry.timestamp} | ${entry.trigger} | \`${escapeCell(entry.versionId)}\` | ${entry.rounds}/${entry.maxRounds} | ${entry.finalScore}/10 | ${entry.passed ? "yes" : "no"} | \`${escapeCell(entry.model)}\` | ${escapeCell(entry.changesSummary)} | [\`${escapeCell(detailName)}\`](../output/judge-runs/${encodeURIComponent(detailName)}) |`;

  const existing = readFileSync(logFile, "utf8").replace(/\s*$/, "");
  writeFileSync(logFile, `${existing}\n${row}\n`, "utf8");

  return { logFile, detailPath };
}

export function judgeRoundRecordFromResult(
  judgeResult: JudgeResult,
  revised: boolean,
  applied?: ReviseResult["applied"],
): JudgeLogRoundRecord {
  const directives = judgeResult.verdict.revision_directives;
  return {
    round: judgeResult.round,
    score: judgeResult.verdict.overall_score,
    pass: judgeResult.verdict.pass,
    model: judgeResult.model,
    revised,
    directives: {
      prioritize: [...(directives.prioritize_accomplishment_ids ?? [])],
      demote: [...(directives.demote_accomplishment_ids ?? [])],
      emphasizeSkills: [...(directives.emphasize_skills ?? [])],
      deEmphasizeSkills: [...(directives.de_emphasize_skills ?? [])],
      notes: [...(directives.notes ?? [])],
    },
    applied,
    inventedClaimFlags: [...(judgeResult.verdict.invented_claim_flags ?? [])],
  };
}

export function buildJudgeLogEntry(input: {
  trigger: JudgeLogEntry["trigger"];
  version: ResumeVersion;
  roleTitle: string;
  roleSource: string;
  maxRounds: number;
  passed: boolean;
  roundRecords: JudgeLogRoundRecord[];
}): JudgeLogEntry {
  const timestamp = new Date().toISOString();
  const safeStamp = timestamp.replace(/[:.]/g, "-");
  const last = input.roundRecords[input.roundRecords.length - 1];
  const detailRelativePath = `output/judge-runs/${safeStamp}-${input.version.output_slug}.md`;

  return {
    timestamp,
    trigger: input.trigger,
    versionId: input.version.id,
    outputSlug: input.version.output_slug,
    roleTitle: input.roleTitle,
    roleSource: input.roleSource,
    rounds: input.roundRecords.length,
    maxRounds: input.maxRounds,
    finalScore: last?.score ?? 0,
    passed: input.passed,
    model: last?.model ?? "unknown",
    changesSummary: summarizeJudgeChanges(input.roundRecords),
    roundRecords: input.roundRecords,
    detailRelativePath,
  };
}
