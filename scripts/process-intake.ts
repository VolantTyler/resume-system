import {
  getIntakeStatus,
  logIntakeNote,
  relativeIntakePath,
  resolveIntakeNoteArg,
} from "./lib/intake.js";
import { validateResumeData } from "./lib/validate.js";

function printStatus(): void {
  const { pending, processed } = getIntakeStatus();

  console.log(
    `Intake notes: ${pending.length} pending, ${processed.length} processed.\n`,
  );

  if (pending.length === 0) {
    console.log("No pending intake notes — docs/intake-log.md is up to date.");
    return;
  }

  console.log("Pending (not yet reflected in docs/intake-log.md):");
  for (const note of pending) {
    console.log(`  - ${relativeIntakePath(note)} — "${note.title}"`);
  }

  console.log("\nNext steps:");
  console.log("  1. Read AGENTS.md and the existing YAML data.");
  console.log(
    "  2. Propose conservative additions to accomplishments.yaml / projects.yaml / skills.yaml.",
  );
  console.log("  3. Run `npm run build` to validate and regenerate outputs.");
  console.log(
    '  4. Log the note: npm run intake:log -- <filename> "<summary of what changed>"',
  );
}

function runLog(args: string[]): void {
  const [fileArg, summary] = args;

  if (!fileArg || !summary) {
    console.error('Usage: npm run intake:log -- <intake-file> "<summary>"');
    process.exit(1);
  }

  let relativePath: string;
  try {
    const note = resolveIntakeNoteArg(fileArg);
    relativePath = relativeIntakePath(note);
    const entry = logIntakeNote(relativePath, summary);
    console.log(`✓ Logged ${entry.file} in docs/intake-log.md`);
  } catch (error) {
    console.error(`✗ ${(error as Error).message}`);
    process.exit(1);
    return;
  }

  const issues = validateResumeData();
  if (issues.length > 0) {
    console.warn(
      "\n⚠ Résumé data currently fails validation — double-check the YAML updates for this note:",
    );
    for (const issue of issues) {
      console.warn(`  - [${issue.path}] ${issue.message}`);
    }
  } else {
    console.log("✓ Résumé data still passes validation.");
  }
}

function main(): void {
  const [command, ...rest] = process.argv.slice(2);

  switch (command) {
    case undefined:
    case "list":
      printStatus();
      break;
    case "log":
      runLog(rest);
      break;
    default:
      console.error(`Unknown command "${command}". Use "list" or "log".`);
      process.exit(1);
  }
}

main();
