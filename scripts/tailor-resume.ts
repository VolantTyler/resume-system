import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderResumeVersionToDir } from "./generate-resume.js";
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
}

function parseArgs(argv: string[]): CliArgs {
  const [jobDescriptionPath, ...rest] = argv;

  if (!jobDescriptionPath) {
    console.error(
      "Usage: npm run tailor -- <path-to-job-description.md> [--target <target-id>] [--label \"Custom Label\"] [--slug custom-slug]",
    );
    process.exit(1);
  }

  const options: CliArgs = { jobDescriptionPath };

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

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const jobDescription = loadJobDescription(args.jobDescriptionPath);
  const data = assertValidResumeData();

  const options: TailorOptions = {
    targetId: args.targetId,
    label: args.label,
    slug: args.slug,
  };

  let result;
  try {
    result = tailorResumeForJobDescription(data, jobDescription, options);
  } catch (error) {
    console.error(`✗ ${(error as Error).message}`);
    process.exit(1);
    return;
  }

  const { markdownPath, htmlPath } = renderResumeVersionToDir(
    data,
    result.version,
    TAILORED_OUTPUT_DIR,
  );

  const reportPath = `${TAILORED_OUTPUT_DIR}/${result.version.output_slug}-match-report.md`;
  writeOutput(reportPath, buildMatchReport(result));

  console.log(`✓ Tailored résumé for "${jobDescription.title}"`);
  console.log(`  Recommended target: ${result.target.label} (${result.target.id})`);
  console.log(`  Matched terms: ${result.matchedTerms.length}`);
  console.log(`  Accomplishments included: ${result.version.accomplishment_ids.length}`);
  if (result.gapTerms.length > 0) {
    console.log(`  Possible gaps: ${result.gapTerms.join(", ")}`);
  }
  console.log("");
  console.log("  Output files:");
  console.log(`    - ${markdownPath}`);
  console.log(`    - ${htmlPath}`);
  console.log(`    - ${reportPath}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
