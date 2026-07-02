import { describe, expect, it } from "vitest";
import {
  appendIntakeLogEntry,
  extractTitle,
  formatIntakeLogRow,
  getIntakeStatus,
  isIntakeFileLogged,
  listIntakeNotes,
  parseIntakeFilename,
  parseIntakeLog,
  relativeIntakePath,
  resolveIntakeNoteArg,
} from "../scripts/lib/intake.js";

describe("intake note parsing", () => {
  it("splits dated filenames into date and slug", () => {
    expect(parseIntakeFilename("2026-06-29-example-update.md")).toEqual({
      date: "2026-06-29",
      slug: "example-update",
    });
  });

  it("falls back gracefully for undated filenames", () => {
    expect(parseIntakeFilename("notes.md")).toEqual({
      date: null,
      slug: "notes",
    });
  });

  it("extracts the first Markdown heading as the title", () => {
    expect(extractTitle("# Intake Note: Example\n\nBody text.")).toBe(
      "Intake Note: Example",
    );
    expect(extractTitle("No heading here.")).toBe("Untitled intake note");
  });

  it("lists the example intake note already committed to the repo", () => {
    const notes = listIntakeNotes();
    const example = notes.find((note) => note.filename === "2026-06-29-example-update.md");

    expect(example).toBeDefined();
    expect(example!.date).toBe("2026-06-29");
    expect(example!.title).toContain("CCIE-TM");
    expect(relativeIntakePath(example!)).toBe(
      "docs/intake/2026-06-29-example-update.md",
    );
  });

  it("resolves a bare filename argument to the matching note", () => {
    const note = resolveIntakeNoteArg("2026-06-29-example-update.md");
    expect(note.filename).toBe("2026-06-29-example-update.md");
  });

  it("throws for an unknown intake file argument", () => {
    expect(() => resolveIntakeNoteArg("does-not-exist.md")).toThrow(/not found/i);
  });
});

describe("intake log parsing", () => {
  const sampleLog = [
    "# Intake Log",
    "",
    "Record of intake notes processed into structured résumé data.",
    "",
    "| Date | Intake File | Summary |",
    "|------|-------------|---------|",
    "| 2026-06-29 | `docs/intake/2026-06-29-example-update.md` | Added an accomplishment. |",
    "",
  ].join("\n");

  it("parses existing table rows into structured entries", () => {
    const entries = parseIntakeLog(sampleLog);
    expect(entries).toEqual([
      {
        date: "2026-06-29",
        file: "docs/intake/2026-06-29-example-update.md",
        summary: "Added an accomplishment.",
      },
    ]);
  });

  it("detects whether a file is already logged", () => {
    const entries = parseIntakeLog(sampleLog);
    expect(
      isIntakeFileLogged(entries, "docs/intake/2026-06-29-example-update.md"),
    ).toBe(true);
    expect(isIntakeFileLogged(entries, "docs/intake/2026-07-01-other.md")).toBe(false);
  });

  it("formats a new entry as a Markdown table row", () => {
    const row = formatIntakeLogRow({
      date: "2026-07-01",
      file: "docs/intake/2026-07-01-new-note.md",
      summary: "Did a thing.",
    });
    expect(row).toBe(
      "| 2026-07-01 | `docs/intake/2026-07-01-new-note.md` | Did a thing. |",
    );
  });

  it("appends a new row without disturbing existing rows", () => {
    const updated = appendIntakeLogEntry(sampleLog, {
      date: "2026-07-01",
      file: "docs/intake/2026-07-01-new-note.md",
      summary: "Did a thing.",
    });

    const entries = parseIntakeLog(updated);
    expect(entries).toHaveLength(2);
    expect(entries[1]).toEqual({
      date: "2026-07-01",
      file: "docs/intake/2026-07-01-new-note.md",
      summary: "Did a thing.",
    });
  });
});

describe("intake status", () => {
  it("reports the checked-in example note as processed with no pending notes", () => {
    const { pending, processed } = getIntakeStatus();

    expect(processed.some((note) => note.filename === "2026-06-29-example-update.md")).toBe(
      true,
    );
    expect(pending).toHaveLength(0);
  });
});
