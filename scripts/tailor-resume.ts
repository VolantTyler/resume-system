import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderResumeVersionToDir } from "./generate-resume.js";
import { finalizeResumeWithJudge } from "./lib/finalize-resume.js";
import { TAILORED_OUTPUT_DIR } from "./lib/paths.js";
import {
  buildMatchReport,
  readJobDescriptionTitle,
  tailorResumeForJobDescription,
  type JobDescription,
  type TailorOptions,
} from "./lib/tailor.js";
import { assertValidResumeData } from "./lib/validate.js";

interface CliArgs {
  jobDescriptionPath: string;
  targetId?: string;
  label?: string;
  slug?: string;
  skipJudge: boolean;
  stub: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const [jobDescriptionPath, ...rest] = argv;

  if (!jobDescriptionPath) {
    console.error(
      [
        "Usage: npm run tailor -- <path-to-job-description.md> [options]",
        "",
        "Options:",
        "  --target <target-id>   Override recommended résumé target",
        "  --label \"Custom Label\" Override tailored version label",
        "  --slug custom-slug     Override output slug",
        "  --skip-judge           Skip the built-in judge finalize step",
        "  --stub                 Force stub judge (no API key)",
      ].join("\n"),
    );
    process.exit(1);
  }

  const options: CliArgs = { jobDescriptionPath, skipJudge: false, stub: false };

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
    } else if (flag === "--skip-judge") {
      options.skipJudge = true;
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

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const jobDescription = loadJobDescription(args.jobDescriptionPath);
  const data = assertValidResumeData();

  const options: TailorOptions = {
    targetId: args.targetId,
    label: args.label,
    slug: args.slug,
  };

  let tailorResult;
  try {
    tailorResult = tailorResumeForJobDescription(data, jobDescription, options);
  } catch (error) {
    console.error(`✗ ${(error as Error).message}`);
    process.exit(1);
    return;
  }

  const matchReportPath = `${TAILORED_OUTPUT_DIR}/${tailorResult.version.output_slug}-match-report.md`;
  writeOutput(matchReportPath, buildMatchReport(tailorResult));

  let finalize;
  try {
    finalize = await finalizeResumeWithJudge(data, tailorResult.version, {
      trigger: "tailor",
      roleBrief: jobDescription,
      outputDir: TAILORED_OUTPUT_DIR,
      render: renderResumeVersionToDir,
      applicationFitMode: "always",
      skipJudge: args.skipJudge,
      stub: args.stub,
      matchReportSummary: [
        `Recommended target: ${tailorResult.target.label} (${tailorResult.target.id})`,
        `Matched terms: ${tailorResult.matchedTerms.map((term) => term.term).join(", ") || "(none)"}`,
        `Gap terms: ${tailorResult.gapTerms.join(", ") || "(none)"}`,
      ].join("\n"),
      gapTerms: tailorResult.gapTerms,
    });
  } catch (error) {
    console.error(`✗ ${(error as Error).message}`);
    process.exit(1);
    return;
  }

  console.log(`✓ Tailored résumé for "${jobDescription.title}"`);
  console.log(`  Recommended target: ${tailorResult.target.label} (${tailorResult.target.id})`);
  console.log(`  Matched terms: ${tailorResult.matchedTerms.length}`);
  console.log(`  Accomplishments included: ${finalize.version.accomplishment_ids.length}`);
  if (tailorResult.gapTerms.length > 0) {
    console.log(`  Possible gaps: ${tailorResult.gapTerms.join(", ")}`);
  }
  if (finalize.judged) {
    const last = finalize.rounds[finalize.rounds.length - 1];
    console.log(
      `  Judge: ${last.judgeResult?.verdict.overall_score}/10 · ${finalize.rounds.length} round(s) · ${finalize.passed ? "pass" : "needs review"}`,
    );
  } else {
    console.log("  Judge: skipped");
  }
  console.log("");
  console.log("  Output files:");
  console.log(`    - ${finalize.markdownPath}`);
  console.log(`    - ${finalize.htmlPath}`);
  console.log(`    - ${matchReportPath}`);
  for (const round of finalize.rounds) {
    if (round.judgeReportPath) {
      console.log(`    - ${round.judgeReportPath}`);
    }
  }
  if (finalize.detailPath) {
    console.log(`    - ${finalize.detailPath}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void main();
}
