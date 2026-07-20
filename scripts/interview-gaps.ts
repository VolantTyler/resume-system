import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { conductGapInterviewSession } from "./lib/gap-interview-session.js";
import { extractMatchedTerms, findGapCandidates, readJobDescriptionTitle } from "./lib/tailor.js";
import type { JobDescription } from "./lib/tailor.js";
import { assertValidResumeData } from "./lib/validate.js";

interface CliArgs {
  jobDescriptionPath: string;
  targetId?: string;
  yes: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const [jobDescriptionPath, ...rest] = argv;

  if (!jobDescriptionPath || jobDescriptionPath.startsWith("-")) {
    console.error(
      [
        "Usage: npm run interview-gaps -- <path-to-job-description.md> [options]",
        "",
        "Interviews you about JD terms that aren't yet in data/, and on confirmation",
        "writes claim-safe accomplishments/skills (confidence: medium) plus an intake note.",
        "",
        "Options:",
        "  --target <target-id>   Target roles to attach on new accomplishments",
        "  --yes                  Skip the initial proceed confirmation",
      ].join("\n"),
    );
    process.exit(1);
  }

  const options: CliArgs = { jobDescriptionPath, yes: false };

  for (let i = 0; i < rest.length; i += 1) {
    const flag = rest[i];
    const value = rest[i + 1];
    if (flag === "--target" && value) {
      options.targetId = value;
      i += 1;
    } else if (flag === "--yes" || flag === "-y") {
      options.yes = true;
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

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const jobDescription = loadJobDescription(args.jobDescriptionPath);
  const data = assertValidResumeData();

  if (args.targetId && !data.resumeTargets.some((t) => t.id === args.targetId)) {
    console.error(`✗ Unknown target ID "${args.targetId}"`);
    process.exit(1);
  }

  const matchedTerms = extractMatchedTerms(jobDescription.text, data);
  const gaps = findGapCandidates(jobDescription.text, matchedTerms);

  if (gaps.length === 0) {
    console.log(`✓ No undocumented reference terms found in "${jobDescription.title}".`);
    return;
  }

  const targetRoles = args.targetId
    ? [args.targetId]
    : data.profile.target_roles.filter((id) =>
        data.resumeTargets.some((target) => target.id === id),
      );

  const session = await conductGapInterviewSession({
    data,
    jobDescription,
    gaps,
    targetRoles:
      targetRoles.length > 0
        ? targetRoles
        : data.resumeTargets[0]
          ? [data.resumeTargets[0].id]
          : ["full-stack-engineer"],
    force: args.yes,
    skip: false,
  });

  if (!session.interviewed) {
    return;
  }

  console.log("");
  console.log(`✓ Interview complete`);
  console.log(`  Confirmed: ${session.confirmed.length}`);
  console.log(`  Denied: ${session.denied.length}`);
  console.log(`  Skipped: ${session.skipped.length}`);
  if (session.notePath) {
    console.log(`  Intake note: ${session.notePath}`);
  }
  if (session.changeSummary.length > 0) {
    console.log("  Changes:");
    for (const change of session.changeSummary) {
      console.log(`    - ${change}`);
    }
    console.log("");
    console.log("  Next: npm run build  (or re-run tailor to refresh the résumé)");
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void main();
}
