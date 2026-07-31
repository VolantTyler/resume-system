import { appendFileSync, writeFileSync } from "node:fs";
import { DATA_FILES } from "./paths.js";
import type {
  Accomplishment,
  ExperienceEntry,
  ResumeData,
  SkillsData,
} from "./schemas.js";
import type { GapCandidate, GapKind } from "./tailor.js";
import { stringifyYamlListItems, writeYamlFile } from "./write-yaml.js";

export interface ConfirmedGapAnswer {
  gap: GapCandidate;
  /** One-sentence raw fact from the user — never invent metrics. */
  rawFact: string;
  /** Optional company / project framing from the user. */
  context?: string;
  /** When set, link the new accomplishment under this experience entry. */
  experienceId?: string;
  /** Target roles to attach; defaults to the active tailored target. */
  targetRoles: string[];
}

export interface PersistGapMeta {
  jobDescriptionPath: string;
  interviewNotePath: string;
  date?: string;
}

export interface PersistGapPaths {
  accomplishments: string;
  skills: string;
  experience: string;
}

export interface PersistGapResult {
  accomplishmentsAdded: Accomplishment[];
  skillsTouched: string[];
  experienceLinked: string[];
  changeSummary: string[];
}

const DEFAULT_PERSIST_PATHS: PersistGapPaths = {
  accomplishments: DATA_FILES.accomplishments,
  skills: DATA_FILES.skills,
  experience: DATA_FILES.experience,
};

function slugifyId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function uniqueId(base: string, existing: Set<string>): string {
  let candidate = base || "gap-evidence";
  if (!existing.has(candidate)) return candidate;
  let n = 2;
  while (existing.has(`${candidate}-${n}`)) n += 1;
  return `${candidate}-${n}`;
}

function defaultSkillCategory(kind: GapKind, term: string): string {
  const lower = term.toLowerCase();
  if (
    ["react", "vue", "angular", "svelte", "typescript", "javascript", "next.js", "redux", "tailwind css", "sass", "bootstrap", "jquery"].includes(
      lower,
    )
  ) {
    return "Front-End";
  }
  if (
    ["jest", "playwright", "selenium", "mocha", "cypress", "unit testing", "end-to-end testing"].includes(
      lower,
    )
  ) {
    return "Testing";
  }
  if (kind === "responsibility") {
    return "Collaboration";
  }
  if (
    ["aws", "gcp", "google cloud", "azure", "docker", "kubernetes", "firebase", "vertex ai", "cloud run", "bigquery", "vercel", "netlify"].includes(
      lower,
    )
  ) {
    return "Applied AI";
  }
  return "Back-End";
}

function findSkill(
  skills: SkillsData,
  term: string,
): { categoryIndex: number; skillIndex: number } | null {
  const key = term.toLowerCase();
  for (let c = 0; c < skills.categories.length; c += 1) {
    const category = skills.categories[c];
    for (let s = 0; s < category.skills.length; s += 1) {
      const skill = category.skills[s];
      if (skill.name.toLowerCase() === key) {
        return { categoryIndex: c, skillIndex: s };
      }
      if ((skill.aliases ?? []).some((alias) => alias.toLowerCase() === key)) {
        return { categoryIndex: c, skillIndex: s };
      }
    }
  }
  return null;
}

function ensureCategory(skills: SkillsData, name: string): number {
  const existing = skills.categories.findIndex((category) => category.name === name);
  if (existing >= 0) return existing;
  skills.categories.push({ name, skills: [] });
  return skills.categories.length - 1;
}

function polishBullet(rawFact: string): string {
  const trimmed = rawFact.trim().replace(/\s+/g, " ");
  if (!trimmed) return trimmed;
  return trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
}

function buildAccomplishment(
  answer: ConfirmedGapAnswer,
  id: string,
  meta: PersistGapMeta,
  date: string,
): Accomplishment {
  const { gap, rawFact, context, targetRoles } = answer;
  const technologies =
    gap.kind === "skill" || gap.kind === "tool" ? [gap.term] : undefined;
  const themes =
    gap.kind === "responsibility"
      ? [gap.term]
      : [gap.term, gap.kind === "tool" ? "tooling" : "technical skills"];

  return {
    id,
    company: context,
    timeframe: date.slice(0, 4),
    category: gap.kind === "responsibility" ? "collaboration" : "technical",
    themes,
    technologies,
    raw_fact: polishBullet(rawFact),
    context: context
      ? `Confirmed during gap interview for ${meta.jobDescriptionPath} (${context}).`
      : `Confirmed during gap interview for ${meta.jobDescriptionPath}.`,
    resume_bullets: {
      standard: polishBullet(rawFact),
    },
    target_roles: targetRoles,
    confidence: "medium",
    source_notes: [
      `Gap interview confirmation (${date}) for term "${gap.term}" against ${meta.jobDescriptionPath}.`,
      `Interview transcript: ${meta.interviewNotePath}`,
    ],
  };
}

function upsertSkill(
  skills: SkillsData,
  answer: ConfirmedGapAnswer,
  accomplishmentId: string,
  changeSummary: string[],
): void {
  const { gap, targetRoles } = answer;
  const existing = findSkill(skills, gap.term);

  if (existing) {
    const skill = skills.categories[existing.categoryIndex].skills[existing.skillIndex];
    const evidence = new Set(skill.evidence_ids ?? []);
    evidence.add(accomplishmentId);
    skill.evidence_ids = [...evidence];
    const roles = new Set(skill.target_roles ?? []);
    for (const role of targetRoles) roles.add(role);
    skill.target_roles = [...roles];
    changeSummary.push(`Linked skill "${skill.name}" → ${accomplishmentId}`);
    return;
  }

  const categoryName = defaultSkillCategory(gap.kind, gap.term);
  const categoryIndex = ensureCategory(skills, categoryName);
  skills.categories[categoryIndex].skills.push({
    name: gap.term,
    evidence_ids: [accomplishmentId],
    proficiency: "medium",
    target_roles: [...targetRoles],
  });
  changeSummary.push(`Added skill "${gap.term}" under ${categoryName}`);
}

function linkExperience(
  experience: ExperienceEntry[],
  experienceId: string,
  accomplishmentId: string,
  term: string,
  kind: GapKind,
  changeSummary: string[],
): void {
  const role = experience.find((entry) => entry.id === experienceId);
  if (!role) {
    changeSummary.push(
      `Skipped experience link — unknown experience id "${experienceId}"`,
    );
    return;
  }

  if (!role.accomplishment_ids.includes(accomplishmentId)) {
    role.accomplishment_ids.push(accomplishmentId);
  }

  if (kind === "skill" || kind === "tool") {
    const tech = new Set(role.technologies ?? []);
    tech.add(term);
    role.technologies = [...tech];
  }

  changeSummary.push(`Linked ${accomplishmentId} under experience ${role.id}`);
}

/**
 * Applies confirmed gap-interview answers to in-memory résumé data and writes
 * claim-safe updates to accomplishments / skills / experience YAML.
 */
export function persistConfirmedGaps(
  data: ResumeData,
  answers: ConfirmedGapAnswer[],
  meta: PersistGapMeta,
  paths: PersistGapPaths = DEFAULT_PERSIST_PATHS,
): PersistGapResult {
  if (answers.length === 0) {
    return {
      accomplishmentsAdded: [],
      skillsTouched: [],
      experienceLinked: [],
      changeSummary: [],
    };
  }

  const date = meta.date ?? new Date().toISOString().slice(0, 10);
  const existingIds = new Set(data.accomplishments.map((item) => item.id));
  const accomplishmentsAdded: Accomplishment[] = [];
  const skillsTouched: string[] = [];
  const experienceLinked: string[] = [];
  const changeSummary: string[] = [];

  // Deep-ish copies of mutable collections we rewrite.
  const skills: SkillsData = structuredClone(data.skills);
  const experience: ExperienceEntry[] = structuredClone(data.experience);

  for (const answer of answers) {
    const id = uniqueId(`gap-${slugifyId(answer.gap.term)}`, existingIds);
    existingIds.add(id);

    const accomplishment = buildAccomplishment(answer, id, meta, date);
    accomplishmentsAdded.push(accomplishment);
    data.accomplishments.push(accomplishment);
    changeSummary.push(`Added accomplishment ${id}`);

    upsertSkill(skills, answer, id, changeSummary);
    skillsTouched.push(answer.gap.term);

    if (answer.experienceId) {
      linkExperience(
        experience,
        answer.experienceId,
        id,
        answer.gap.term,
        answer.gap.kind,
        changeSummary,
      );
      experienceLinked.push(answer.experienceId);
    }
  }

  appendFileSync(paths.accomplishments, stringifyYamlListItems(accomplishmentsAdded), "utf8");
  writeYamlFile(paths.skills, skills);
  writeYamlFile(paths.experience, experience);

  // Keep caller data in sync with what we wrote for skills/experience.
  data.skills = skills;
  data.experience = experience;

  return {
    accomplishmentsAdded,
    skillsTouched: [...new Set(skillsTouched)],
    experienceLinked: [...new Set(experienceLinked)],
    changeSummary,
  };
}

/** Writes an intake-style Markdown transcript for a gap interview. */
export function writeGapInterviewNote(
  path: string,
  opts: {
    jobTitle: string;
    jobDescriptionPath: string;
    asked: GapCandidate[];
    confirmed: ConfirmedGapAnswer[];
    denied: GapCandidate[];
    skipped: GapCandidate[];
    changeSummary: string[];
  },
): void {
  const date = new Date().toISOString().slice(0, 10);
  const lines: string[] = [];
  lines.push(`# Gap interview: ${opts.jobTitle}`);
  lines.push("");
  lines.push(`**Date:** ${date}`);
  lines.push(`**Job description:** \`${opts.jobDescriptionPath}\``);
  lines.push("");
  lines.push("## Gaps asked");
  lines.push("");
  for (const gap of opts.asked) {
    lines.push(`- **${gap.term}** (${gap.kind}) — ${gap.question}`);
  }
  lines.push("");
  lines.push("## Confirmed");
  lines.push("");
  if (opts.confirmed.length === 0) {
    lines.push("_None_");
  } else {
    for (const answer of opts.confirmed) {
      lines.push(`### ${answer.gap.term}`);
      lines.push("");
      lines.push(`- **Kind:** ${answer.gap.kind}`);
      if (answer.context) lines.push(`- **Context:** ${answer.context}`);
      if (answer.experienceId) {
        lines.push(`- **Experience id:** \`${answer.experienceId}\``);
      }
      lines.push(`- **Raw fact:** ${answer.rawFact}`);
      lines.push("");
    }
  }
  lines.push("## Denied (not in background)");
  lines.push("");
  if (opts.denied.length === 0) {
    lines.push("_None_");
  } else {
    for (const gap of opts.denied) {
      lines.push(`- ${gap.term}`);
    }
  }
  lines.push("");
  lines.push("## Skipped");
  lines.push("");
  if (opts.skipped.length === 0) {
    lines.push("_None_");
  } else {
    for (const gap of opts.skipped) {
      lines.push(`- ${gap.term}`);
    }
  }
  lines.push("");
  lines.push("## YAML changes");
  lines.push("");
  if (opts.changeSummary.length === 0) {
    lines.push("_No YAML updates_");
  } else {
    for (const change of opts.changeSummary) {
      lines.push(`- ${change}`);
    }
  }
  lines.push("");

  writeFileSync(path, lines.join("\n"), "utf8");
}
