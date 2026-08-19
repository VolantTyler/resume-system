import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CLAIM_VERIFICATION_OUTPUT_DIR } from "./lib/paths.js";
import {
  readJobDescriptionTitle,
  tailorResumeForJobDescription,
  type JobDescription,
} from "./lib/tailor.js";
import { assertValidResumeData } from "./lib/validate.js";
import {
  buildClaimVerificationReport,
  hasUnsupportedClaims,
  verifyResumeVersionClaims,
  type VerifyClaimsResult,
} from "./lib/verify-claims.js";
import type { ResumeData, ResumeVersion } from "./lib/schemas.js";

interface CliArgs {
  versionId?: string;
  jobDescriptionPath?: string;
  targetId?: string;
  quiet: boolean;
  noReport: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { quiet: false, noReport: false };

  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === "--version" && value) {
      args.versionId = value;
      i += 1;
    } else if (flag === "--jd" && value) {
      args.jobDescriptionPath = value;
      i += 1;
    } else if (flag === "--target" && value) {
      args.targetId = value;
      i += 1;
    } else if (flag === "--quiet") {
      args.quiet = true;
    } else if (flag === "--no-report") {
      args.noReport = true;
    } else if (flag === "--help" || flag === "-h") {
      printUsage();
      process.exit(0);
    }
  }

  return args;
}

function printUsage(): void {
  console.log(
    [
      "Usage: npm run verify-claims -- [options]",
      "",
      "Deterministically re-checks every résumé bullet's numbers, dates, and",
      "technologies against its source accomplishment in data/*.yaml — no LLM,",
      "every finding traces to an exact field.",
      "",
      "Options:",
      "  --version <id>     Check one résumé version from data/resume_versions.yaml",
      "                     (default: every curated version)",
      "  --jd <path>        Check an ad-hoc tailor match for a job description",
      "                     instead of a saved version (pre-judge-revision match)",
      "  --target <id>      With --jd, override the recommended résumé target",
      "  --quiet            Only print per-version totals, not individual findings",
      "  --no-report        Skip writing markdown reports to output/claim-verification/",
    ].join("\n"),
  );
}

function loadJobDescription(path: string): JobDescription {
  const resolvedPath = isAbsolute(path) ? path : join(process.cwd(), path);
  if (!existsSync(resolvedPath)) {
    console.error(`✗ Job description file not found: ${path}`);
    process.exit(1);
  }
  const text = readFileSync(resolvedPath, "utf8");
  return { sourcePath: path, title: readJobDescriptionTitle(resolvedPath, text), text };
}

function writeReport(slug: string, result: VerifyClaimsResult): string {
  const path = `${CLAIM_VERIFICATION_OUTPUT_DIR}/${slug}.md`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, buildClaimVerificationReport(result), "utf8");
  return path;
}

function printResult(result: VerifyClaimsResult, quiet: boolean): void {
  const { verified, inferred, unsupported } = result.totals;
  const summary = `${result.versionLabel} (${result.versionId}): ${verified} verified, ${inferred} inferred, ${unsupported} unsupported`;

  if (unsupported > 0) {
    console.log(`✗ ${summary}`);
  } else if (inferred > 0) {
    console.log(`⚠ ${summary}`);
  } else {
    console.log(`✓ ${summary}`);
  }

  if (quiet) return;

  for (const item of result.accomplishments) {
    const flagged = item.findings.filter((f) => f.status !== "verified");
    if (flagged.length === 0) continue;
    console.log(`  ${item.accomplishmentId}`);
    console.log(`    "${item.bullet}"`);
    for (const finding of flagged) {
      const icon = finding.status === "unsupported" ? "❌" : "⚠️";
      console.log(`    ${icon} [${finding.kind}] ${finding.claim} — ${finding.detail}`);
    }
  }
}

function resolveVersions(data: ResumeData, args: CliArgs): ResumeVersion[] {
  if (!args.versionId) return data.resumeVersions;
  const version = data.resumeVersions.find((v) => v.id === args.versionId);
  if (!version) {
    console.error(`✗ Unknown résumé version "${args.versionId}"`);
    process.exit(1);
  }
  return [version];
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const data = assertValidResumeData();
  const results: VerifyClaimsResult[] = [];

  if (args.jobDescriptionPath) {
    const jobDescription = loadJobDescription(args.jobDescriptionPath);
    let tailorResult;
    try {
      tailorResult = tailorResumeForJobDescription(data, jobDescription, {
        targetId: args.targetId,
      });
    } catch (error) {
      console.error(`✗ ${(error as Error).message}`);
      process.exit(1);
      return;
    }
    console.log(
      `Checking ad-hoc tailor match for "${jobDescription.title}" (pre-judge-revision — the judge loop may still adjust accomplishment selection).`,
    );
    results.push(verifyResumeVersionClaims(data, tailorResult.version));
  } else {
    for (const version of resolveVersions(data, args)) {
      results.push(verifyResumeVersionClaims(data, version));
    }
  }

  for (const result of results) {
    printResult(result, args.quiet);
    if (!args.noReport) {
      const path = writeReport(result.versionId, result);
      if (!args.quiet) console.log(`    report: ${path}`);
    }
  }

  const anyUnsupported = results.some(hasUnsupportedClaims);
  if (anyUnsupported) {
    console.log("\n✗ Unsupported claims found — review before this résumé goes out.");
    process.exit(1);
  }
  console.log("\n✓ No unsupported claims found.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void main();
}
