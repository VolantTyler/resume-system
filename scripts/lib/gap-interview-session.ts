import { existsSync, mkdirSync } from "node:fs";
import { basename, join } from "node:path";
import {
  createReadlineInterviewIO,
  runGapInterview,
  shouldOfferInterview,
  type GapInterviewResult,
} from "./gap-interview.js";
import { logIntakeNote } from "./intake.js";
import { INTAKE_DIR } from "./paths.js";
import {
  persistConfirmedGaps,
  writeGapInterviewNote,
  type ConfirmedGapAnswer,
} from "./persist-gap-evidence.js";
import type { ResumeData } from "./schemas.js";
import type { GapCandidate, JobDescription } from "./tailor.js";
import { assertValidResumeData } from "./validate.js";

export interface GapInterviewSessionResult {
  interviewed: boolean;
  confirmed: ConfirmedGapAnswer[];
  denied: GapCandidate[];
  skipped: GapCandidate[];
  changeSummary: string[];
  notePath?: string;
  /** Reloaded data when YAML was mutated; otherwise the input data. */
  data: ResumeData;
}

/**
 * Picks a transcript filename that does not collide with an existing intake
 * note, so re-interviewing the same JD on the same date never overwrites the
 * evidence trail cited by previously persisted accomplishments.
 */
export function interviewNoteFilename(
  jobDescriptionPath: string,
  noteExists: (filename: string) => boolean,
): string {
  const date = new Date().toISOString().slice(0, 10);
  const slug = basename(jobDescriptionPath, ".md")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const base = `${date}-gap-interview-${slug || "role"}`;

  let candidate = `${base}.md`;
  for (let n = 2; noteExists(candidate); n += 1) {
    candidate = `${base}-${n}.md`;
  }
  return candidate;
}

/**
 * Interactive gap interview + claim-safe YAML persistence + intake transcript.
 * No-ops when there are no gaps or when the session is skipped.
 */
export async function conductGapInterviewSession(opts: {
  data: ResumeData;
  jobDescription: JobDescription;
  gaps: GapCandidate[];
  targetRoles: string[];
  force: boolean;
  skip: boolean;
}): Promise<GapInterviewSessionResult> {
  const empty: GapInterviewSessionResult = {
    interviewed: false,
    confirmed: [],
    denied: [],
    skipped: [],
    changeSummary: [],
    data: opts.data,
  };

  const mode = shouldOfferInterview({
    gapCount: opts.gaps.length,
    force: opts.force,
    skip: opts.skip,
    isTty: Boolean(process.stdin.isTTY),
  });

  if (mode === "skip") {
    if (opts.gaps.length > 0 && !opts.skip) {
      console.log(
        `  Tip: ${opts.gaps.length} possible gap(s) — re-run with --interview-gaps to capture missing evidence.`,
      );
    }
    return empty;
  }

  if (!process.stdin.isTTY) {
    console.error(
      "✗ Gap interview requires an interactive TTY. Re-run in a terminal with --interview-gaps.",
    );
    return empty;
  }

  const { io, close } = createReadlineInterviewIO();
  try {
    if (mode === "offer") {
      console.log("");
      console.log(
        `Found ${opts.gaps.length} possible gap(s) (JD terms not yet in data/):`,
      );
      for (const gap of opts.gaps) {
        console.log(`  - ${gap.term} (${gap.kind})`);
      }
      const proceed = (await io.ask("\nInterview about these gaps now? [Y/n] "))
        .trim()
        .toLowerCase();
      if (proceed === "n" || proceed === "no") {
        console.log("Skipped gap interview.");
        return empty;
      }
    }

    const interview: GapInterviewResult = await runGapInterview(
      opts.gaps,
      opts.data,
      opts.targetRoles,
      io,
    );

    mkdirSync(INTAKE_DIR, { recursive: true });
    const noteFilename = interviewNoteFilename(
      opts.jobDescription.sourcePath,
      (filename) => existsSync(join(INTAKE_DIR, filename)),
    );
    const absoluteNotePath = join(INTAKE_DIR, noteFilename);
    const relativeNotePath = `docs/intake/${noteFilename}`;

    let changeSummary: string[] = [];
    let data = opts.data;

    if (interview.confirmed.length > 0) {
      const persist = persistConfirmedGaps(data, interview.confirmed, {
        jobDescriptionPath: opts.jobDescription.sourcePath,
        interviewNotePath: relativeNotePath,
      });
      changeSummary = persist.changeSummary;
      data = assertValidResumeData();
    }

    writeGapInterviewNote(absoluteNotePath, {
      jobTitle: opts.jobDescription.title,
      jobDescriptionPath: opts.jobDescription.sourcePath,
      asked: opts.gaps,
      confirmed: interview.confirmed,
      denied: interview.denied,
      skipped: interview.skipped,
      changeSummary,
    });

    const summaryParts = [
      `Gap interview for ${opts.jobDescription.title}:`,
      `${interview.confirmed.length} confirmed`,
      `${interview.denied.length} denied`,
      `${interview.skipped.length} skipped`,
    ];
    if (changeSummary.length > 0) {
      summaryParts.push(changeSummary.join("; "));
    }

    try {
      logIntakeNote(relativeNotePath, summaryParts.join(" "));
    } catch (error) {
      console.warn(`⚠ Could not append intake log: ${(error as Error).message}`);
    }

    return {
      interviewed: true,
      confirmed: interview.confirmed,
      denied: interview.denied,
      skipped: interview.skipped,
      changeSummary,
      notePath: relativeNotePath,
      data,
    };
  } finally {
    close();
  }
}
