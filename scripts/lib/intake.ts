import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { INTAKE_DIR, INTAKE_LOG_FILE } from "./paths.js";

export interface IntakeNote {
  filename: string;
  path: string;
  date: string | null;
  slug: string;
  title: string;
  body: string;
}

export interface IntakeLogEntry {
  date: string;
  file: string;
  summary: string;
}

export interface IntakeStatus {
  pending: IntakeNote[];
  processed: IntakeNote[];
}

const FILENAME_PATTERN = /^(\d{4}-\d{2}-\d{2})-(.+)\.md$/;
const TABLE_ROW_PATTERN = /^\|(.+)\|\s*$/;

/** Splits an intake note filename like `2026-06-29-example-update.md` into date + slug. */
export function parseIntakeFilename(filename: string): {
  date: string | null;
  slug: string;
} {
  const match = FILENAME_PATTERN.exec(filename);
  if (!match) {
    return { date: null, slug: filename.replace(/\.md$/, "") };
  }
  return { date: match[1], slug: match[2] };
}

export function extractTitle(content: string): string {
  const match = /^#\s+(.+)$/m.exec(content);
  return match ? match[1].trim() : "Untitled intake note";
}

/** The canonical repo-relative path used to reference an intake note in the log. */
export function relativeIntakePath(note: Pick<IntakeNote, "filename">): string {
  return `docs/intake/${note.filename}`;
}

export function parseIntakeNote(filePath: string): IntakeNote {
  const filename = basename(filePath);
  const body = readFileSync(filePath, "utf8");
  const { date, slug } = parseIntakeFilename(filename);

  return {
    filename,
    path: filePath,
    date,
    slug,
    title: extractTitle(body),
    body,
  };
}

export function listIntakeNotes(): IntakeNote[] {
  const filenames = readdirSync(INTAKE_DIR).filter((name) => name.endsWith(".md"));

  return filenames
    .map((filename) => parseIntakeNote(join(INTAKE_DIR, filename)))
    .sort(
      (a, b) =>
        (a.date ?? "").localeCompare(b.date ?? "") || a.filename.localeCompare(b.filename),
    );
}

function stripBackticks(value: string): string {
  return value.trim().replace(/^`/, "").replace(/`$/, "");
}

/** Parses the `| Date | Intake File | Summary |` table in docs/intake-log.md. */
export function parseIntakeLog(content: string): IntakeLogEntry[] {
  const tableRows = content
    .split("\n")
    .filter((line) => TABLE_ROW_PATTERN.test(line.trim()));

  // First matching row is the header, second is the `---|---|---` separator.
  const dataRows = tableRows.slice(2);

  return dataRows.map((row) => {
    const cells = row
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|");

    const [date = "", file = "", ...summaryParts] = cells.map((cell) => cell.trim());

    return {
      date,
      file: stripBackticks(file),
      summary: summaryParts.join("|").trim(),
    };
  });
}

export function formatIntakeLogRow(entry: IntakeLogEntry): string {
  return `| ${entry.date} | \`${entry.file}\` | ${entry.summary} |`;
}

export function isIntakeFileLogged(
  entries: IntakeLogEntry[],
  relativeFilePath: string,
): boolean {
  return entries.some((entry) => entry.file === relativeFilePath);
}

/** Pure function: appends a new row to the intake log's Markdown table. */
export function appendIntakeLogEntry(content: string, entry: IntakeLogEntry): string {
  const trimmed = content.replace(/\s+$/, "");
  return `${trimmed}\n${formatIntakeLogRow(entry)}\n`;
}

export function readIntakeLog(): string {
  return readFileSync(INTAKE_LOG_FILE, "utf8");
}

export function writeIntakeLog(content: string): void {
  writeFileSync(INTAKE_LOG_FILE, content, "utf8");
}

export function getProcessedIntakeFiles(): Set<string> {
  const entries = parseIntakeLog(readIntakeLog());
  return new Set(entries.map((entry) => entry.file));
}

/** Splits all intake notes into those already logged vs. awaiting processing. */
export function getIntakeStatus(): IntakeStatus {
  const notes = listIntakeNotes();
  const processedFiles = getProcessedIntakeFiles();

  const pending: IntakeNote[] = [];
  const processed: IntakeNote[] = [];

  for (const note of notes) {
    if (processedFiles.has(relativeIntakePath(note))) {
      processed.push(note);
    } else {
      pending.push(note);
    }
  }

  return { pending, processed };
}

/** Resolves a CLI-provided filename/path to a known intake note. */
export function resolveIntakeNoteArg(arg: string): IntakeNote {
  const filename = basename(arg);
  const note = listIntakeNotes().find((candidate) => candidate.filename === filename);

  if (!note) {
    throw new Error(
      `Intake note not found: "${arg}" (looked for docs/intake/${filename})`,
    );
  }

  return note;
}

/** Records an intake note as processed by appending a row to docs/intake-log.md. */
export function logIntakeNote(
  relativeFilePath: string,
  summary: string,
  date: string = new Date().toISOString().slice(0, 10),
): IntakeLogEntry {
  const content = readIntakeLog();
  const entries = parseIntakeLog(content);

  if (isIntakeFileLogged(entries, relativeFilePath)) {
    throw new Error(
      `"${relativeFilePath}" is already logged in docs/intake-log.md. Use a different summary edit by hand if it needs correction.`,
    );
  }

  const entry: IntakeLogEntry = { date, file: relativeFilePath, summary };
  writeIntakeLog(appendIntakeLogEntry(content, entry));

  return entry;
}
