import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { ExperienceEntry, ResumeData } from "./schemas.js";
import type { ConfirmedGapAnswer } from "./persist-gap-evidence.js";
import type { GapCandidate } from "./tailor.js";

export type GapInterviewDecision = "yes" | "no" | "skip";

export interface GapInterviewResult {
  confirmed: ConfirmedGapAnswer[];
  denied: GapCandidate[];
  skipped: GapCandidate[];
}

export interface GapInterviewIO {
  ask: (prompt: string) => Promise<string>;
  say: (message: string) => void;
}

function parseYesNoSkip(raw: string): GapInterviewDecision | null {
  const value = raw.trim().toLowerCase();
  if (["y", "yes", "yeah", "yep", "true"].includes(value)) return "yes";
  if (["n", "no", "nope", "false"].includes(value)) return "no";
  if (["s", "skip", ""].includes(value)) return "skip";
  return null;
}

function matchExperience(
  experience: ExperienceEntry[],
  query: string,
): ExperienceEntry | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;

  const byId = experience.find((entry) => entry.id.toLowerCase() === q);
  if (byId) return byId;

  return experience.find(
    (entry) =>
      entry.company.toLowerCase().includes(q) ||
      entry.title.toLowerCase().includes(q) ||
      entry.id.toLowerCase().includes(q),
  );
}

function formatExperienceMenu(experience: ExperienceEntry[]): string {
  return experience
    .map((entry) => `    - ${entry.id}  (${entry.company} · ${entry.title})`)
    .join("\n");
}

/** Pure-ish interview loop driven by injectable IO (easy to test). */
export async function runGapInterview(
  gaps: GapCandidate[],
  data: ResumeData,
  targetRoles: string[],
  io: GapInterviewIO,
): Promise<GapInterviewResult> {
  const confirmed: ConfirmedGapAnswer[] = [];
  const denied: GapCandidate[] = [];
  const skipped: GapCandidate[] = [];

  if (gaps.length === 0) {
    io.say("No gaps to interview about.");
    return { confirmed, denied, skipped };
  }

  io.say("");
  io.say(
    `Interviewing about ${gaps.length} possible gap(s). Answers that you confirm are written into data/ with confidence: medium.`,
  );
  io.say("For each gap: y = yes I did that, n = no, s = skip for now.");
  io.say("");

  for (let i = 0; i < gaps.length; i += 1) {
    const gap = gaps[i];
    io.say(`[${i + 1}/${gaps.length}] ${gap.term} (${gap.kind})`);
    io.say(`  ${gap.question}`);

    let decision: GapInterviewDecision | null = null;
    while (!decision) {
      const raw = await io.ask("  Confirm? [y/n/s] ");
      decision = parseYesNoSkip(raw);
      if (!decision) {
        io.say("  Please answer y, n, or s.");
      }
    }

    if (decision === "no") {
      denied.push(gap);
      io.say("  → Noted as not in background.\n");
      continue;
    }

    if (decision === "skip") {
      skipped.push(gap);
      io.say("  → Skipped.\n");
      continue;
    }

    io.say("  Experience ids (optional — press Enter to skip linking):");
    io.say(formatExperienceMenu(data.experience));
    const experienceRaw = await io.ask("  Link to experience (id or company): ");
    const matched = matchExperience(data.experience, experienceRaw);
    if (experienceRaw.trim() && !matched) {
      io.say(
        `  (No experience matched "${experienceRaw.trim()}" — continuing without a link.)`,
      );
    }

    const contextRaw = await io.ask(
      "  Context (company/project, optional): ",
    );
    let rawFact = "";
    while (!rawFact) {
      rawFact = (
        await io.ask(
          `  One sentence about what you did with ${gap.term} (no invented metrics): `,
        )
      ).trim();
      if (!rawFact) {
        io.say("  A short factual sentence is required to store evidence.");
      }
    }

    confirmed.push({
      gap,
      rawFact,
      context: contextRaw.trim() || matched?.company || undefined,
      experienceId: matched?.id,
      targetRoles: [...targetRoles],
    });
    io.say("  → Will add to persistent data.\n");
  }

  return { confirmed, denied, skipped };
}

/** Creates readline-backed IO for interactive CLI use. */
export function createReadlineInterviewIO(): {
  io: GapInterviewIO;
  close: () => void;
} {
  const rl = createInterface({ input, output });
  return {
    io: {
      ask: (prompt) => rl.question(prompt),
      say: (message) => {
        output.write(`${message}\n`);
      },
    },
    close: () => rl.close(),
  };
}

export function shouldOfferInterview(opts: {
  gapCount: number;
  force: boolean;
  skip: boolean;
  isTty: boolean;
}): "run" | "offer" | "skip" {
  if (opts.skip || opts.gapCount === 0) return "skip";
  if (opts.force) return "run";
  if (opts.isTty) return "offer";
  return "skip";
}
