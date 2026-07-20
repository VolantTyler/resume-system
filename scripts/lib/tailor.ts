import { basename, extname } from "node:path";
import type { Accomplishment, ResumeData, ResumeTarget, ResumeVersion } from "./schemas.js";

export interface JobDescription {
  sourcePath: string;
  title: string;
  text: string;
}

export interface MatchedTerm {
  term: string;
  sources: Set<string>;
}

export interface TargetRanking {
  target: ResumeTarget;
  score: number;
  matchedEmphasis: string[];
}

export interface TailorOptions {
  targetId?: string;
  label?: string;
  slug?: string;
}

export type GapKind = "skill" | "tool" | "responsibility";

export interface GapCandidate {
  term: string;
  kind: GapKind;
  /** Short prompt used by the gap interview CLI / agent. */
  question: string;
}

export interface TailorResult {
  jobDescription: JobDescription;
  matchedTerms: MatchedTerm[];
  ranking: TargetRanking[];
  target: ResumeTarget;
  version: ResumeVersion;
  gapTerms: string[];
  gapCandidates: GapCandidate[];
}

/**
 * Common résumé-relevant terms that are *not* necessarily part of Tyler's own
 * data. Used only to flag possible coverage gaps in a job description — never
 * to assert Tyler does or doesn't have a skill.
 */
const REFERENCE_GAP_VOCABULARY: Array<{ term: string; kind: GapKind }> = [
  // Languages & frameworks
  { term: "React", kind: "skill" },
  { term: "Vue", kind: "skill" },
  { term: "Angular", kind: "skill" },
  { term: "Svelte", kind: "skill" },
  { term: "TypeScript", kind: "skill" },
  { term: "JavaScript", kind: "skill" },
  { term: "Node.js", kind: "skill" },
  { term: "Next.js", kind: "skill" },
  { term: "Redux", kind: "skill" },
  { term: "Tailwind CSS", kind: "skill" },
  { term: "Sass", kind: "skill" },
  { term: "Webpack", kind: "tool" },
  { term: "Vite", kind: "tool" },
  { term: "GraphQL", kind: "skill" },
  { term: "REST API", kind: "skill" },
  { term: "PostgreSQL", kind: "skill" },
  { term: "MySQL", kind: "skill" },
  { term: "MongoDB", kind: "skill" },
  { term: "SQL", kind: "skill" },
  { term: "Go", kind: "skill" },
  { term: "Golang", kind: "skill" },
  { term: "Rust", kind: "skill" },
  { term: "Java", kind: "skill" },
  { term: "C++", kind: "skill" },
  { term: "C#", kind: "skill" },
  { term: "Kotlin", kind: "skill" },
  { term: "Swift", kind: "skill" },
  { term: "Scala", kind: "skill" },
  { term: "Ruby", kind: "skill" },
  { term: "Ruby on Rails", kind: "skill" },
  { term: "PHP", kind: "skill" },
  { term: "Symfony", kind: "skill" },
  { term: "Python", kind: "skill" },
  { term: "Django", kind: "skill" },
  { term: "Flask", kind: "skill" },
  { term: "FastAPI", kind: "skill" },
  { term: "Bash", kind: "skill" },
  { term: "Terraform", kind: "skill" },
  { term: "Bootstrap", kind: "skill" },
  { term: "jQuery", kind: "skill" },
  { term: "REST", kind: "skill" },
  { term: "API design", kind: "skill" },
  // Cloud / infra / tools
  { term: "AWS", kind: "tool" },
  { term: "GCP", kind: "tool" },
  { term: "Google Cloud", kind: "tool" },
  { term: "Azure", kind: "tool" },
  { term: "Docker", kind: "tool" },
  { term: "Kubernetes", kind: "tool" },
  { term: "CI/CD", kind: "tool" },
  { term: "GitHub Actions", kind: "tool" },
  { term: "Vercel", kind: "tool" },
  { term: "Netlify", kind: "tool" },
  { term: "Firebase", kind: "tool" },
  { term: "Cloud Run", kind: "tool" },
  { term: "BigQuery", kind: "tool" },
  { term: "Vertex AI", kind: "tool" },
  { term: "Jest", kind: "tool" },
  { term: "Playwright", kind: "tool" },
  { term: "Selenium", kind: "tool" },
  { term: "Mocha", kind: "tool" },
  { term: "Storybook", kind: "tool" },
  { term: "Figma", kind: "tool" },
  { term: "WordPress", kind: "tool" },
  { term: "Salesforce", kind: "tool" },
  { term: "Jira", kind: "tool" },
  { term: "Datadog", kind: "tool" },
  { term: "Sentry", kind: "tool" },
  // Practices / responsibilities
  { term: "Agile", kind: "responsibility" },
  { term: "Scrum", kind: "responsibility" },
  { term: "Accessibility", kind: "responsibility" },
  { term: "WCAG", kind: "responsibility" },
  { term: "SEO", kind: "responsibility" },
  { term: "Unit testing", kind: "responsibility" },
  { term: "End-to-end testing", kind: "responsibility" },
  { term: "Cross-browser testing", kind: "responsibility" },
  { term: "Performance optimization", kind: "responsibility" },
  { term: "Code review", kind: "responsibility" },
  { term: "Mentoring", kind: "responsibility" },
  { term: "System design", kind: "responsibility" },
  { term: "Requirements gathering", kind: "responsibility" },
  { term: "Customer discovery", kind: "responsibility" },
  { term: "Stakeholder management", kind: "responsibility" },
  { term: "Client-facing", kind: "responsibility" },
  { term: "On-call", kind: "responsibility" },
  { term: "Incident response", kind: "responsibility" },
  { term: "Technical writing", kind: "responsibility" },
  { term: "Rapid prototyping", kind: "responsibility" },
  { term: "Production support", kind: "responsibility" },
  { term: "Forward deployed", kind: "responsibility" },
  { term: "A/B testing", kind: "responsibility" },
  { term: "Product discovery", kind: "responsibility" },
  { term: "UX research", kind: "responsibility" },
  { term: "Design systems", kind: "responsibility" },
];

function questionForGap(term: string, kind: GapKind): string {
  switch (kind) {
    case "skill":
      return `Have you used ${term} in a professional or project context?`;
    case "tool":
      return `Have you worked with ${term} (deployed, configured, or shipped with it)?`;
    case "responsibility":
      return `Have you owned or regularly done work involving "${term}"?`;
  }
}

function normalize(text: string): string {
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  return cleaned.length > 0 ? ` ${cleaned} ` : "";
}

function containsTerm(normalizedHaystack: string, term: string): boolean {
  const normalizedTerm = normalize(term);
  return normalizedTerm.length > 0 && normalizedHaystack.includes(normalizedTerm);
}

/** Builds a canonical-term -> source-labels index from all résumé data. */
function buildTermIndex(data: ResumeData): Map<string, Set<string>> {
  const index = new Map<string, Set<string>>();

  const addTerm = (term: string | undefined, source: string): void => {
    if (!term || !term.trim()) return;
    const key = term.trim();
    const existing = index.get(key);
    if (existing) {
      existing.add(source);
    } else {
      index.set(key, new Set([source]));
    }
  };

  for (const category of data.skills.categories) {
    for (const skill of category.skills) {
      addTerm(skill.name, "skills");
      for (const alias of skill.aliases ?? []) {
        addTerm(alias, "skills");
      }
    }
  }

  for (const accomplishment of data.accomplishments) {
    for (const theme of accomplishment.themes ?? []) {
      addTerm(theme, "accomplishment-theme");
    }
    for (const tech of accomplishment.technologies ?? []) {
      addTerm(tech, "accomplishment-technology");
    }
  }

  for (const role of data.experience) {
    for (const tech of role.technologies ?? []) {
      addTerm(tech, "experience-technology");
    }
  }

  for (const project of data.projects) {
    for (const tech of project.technologies ?? []) {
      addTerm(tech, "project-technology");
    }
  }

  for (const target of data.resumeTargets) {
    for (const term of target.emphasis ?? []) {
      addTerm(term, "target-emphasis");
    }
  }

  return index;
}

/** Finds every known résumé term that appears in the job description text. */
export function extractMatchedTerms(jobText: string, data: ResumeData): MatchedTerm[] {
  const haystack = normalize(jobText);
  const index = buildTermIndex(data);

  const matches: MatchedTerm[] = [];
  for (const [term, sources] of index) {
    if (containsTerm(haystack, term)) {
      matches.push({ term, sources });
    }
  }

  return matches.sort((a, b) => a.term.localeCompare(b.term));
}

function matchedTermKeySet(matchedTerms: MatchedTerm[]): Set<string> {
  return new Set(matchedTerms.map((match) => match.term.toLowerCase()));
}

/** Counts how many of an accomplishment's themes/technologies were matched in the JD. */
export function scoreAccomplishment(
  accomplishment: Accomplishment,
  matchedTermKeys: Set<string>,
): number {
  const terms = [
    ...(accomplishment.themes ?? []),
    ...(accomplishment.technologies ?? []),
  ];
  return terms.filter((term) => matchedTermKeys.has(term.toLowerCase())).length;
}

/** Ranks every résumé target by how well its emphasis + linked accomplishments fit the JD. */
export function rankTargets(data: ResumeData, matchedTerms: MatchedTerm[]): TargetRanking[] {
  const matchedTermKeys = matchedTermKeySet(matchedTerms);

  const rankings = data.resumeTargets.map((target) => {
    const matchedEmphasis = (target.emphasis ?? []).filter((term) =>
      matchedTermKeys.has(term.toLowerCase()),
    );

    const linkedAccomplishments = data.accomplishments.filter((item) =>
      item.target_roles.includes(target.id),
    );
    const accomplishmentScore = linkedAccomplishments.reduce(
      (sum, item) => sum + scoreAccomplishment(item, matchedTermKeys),
      0,
    );

    const linkedSkillMatches = data.skills.categories
      .flatMap((category) => category.skills)
      .filter((skill) => skill.target_roles?.includes(target.id))
      .filter((skill) => matchedTermKeys.has(skill.name.toLowerCase())).length;

    const score = matchedEmphasis.length * 3 + accomplishmentScore + linkedSkillMatches * 2;

    return { target, score, matchedEmphasis };
  });

  return rankings.sort((a, b) => b.score - a.score);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function readJobDescriptionTitle(sourcePath: string, text: string): string {
  const headingMatch = /^#\s+(.+)$/m.exec(text);
  if (headingMatch) {
    return headingMatch[1].trim();
  }
  const base = basename(sourcePath, extname(sourcePath));
  return base.replace(/[-_]+/g, " ").trim() || "job description";
}

function selectSkillEmphasis(data: ResumeData, matchedTerms: MatchedTerm[]): string[] {
  const matchedTermKeys = matchedTermKeySet(matchedTerms);
  const skillNames = data.skills.categories.flatMap((category) =>
    category.skills.map((skill) => skill.name),
  );
  return skillNames.filter((name) => matchedTermKeys.has(name.toLowerCase()));
}

function selectProjectIds(data: ResumeData, accomplishmentIds: string[]): string[] {
  const accomplishmentIdSet = new Set(accomplishmentIds);
  return data.projects
    .filter((project) =>
      (project.related_accomplishment_ids ?? []).some((id) => accomplishmentIdSet.has(id)),
    )
    .map((project) => project.id);
}

/**
 * Finds job-relevant, résumé-adjacent terms that appear in the JD but aren't
 * reflected in Tyler's data. Prefer {@link findGapCandidates} when you need
 * kind/question metadata for an interview.
 */
export function findGapCandidates(
  jobText: string,
  matchedTerms: MatchedTerm[],
): GapCandidate[] {
  const haystack = normalize(jobText);
  const matchedTermKeys = matchedTermKeySet(matchedTerms);
  const seen = new Set<string>();
  const candidates: GapCandidate[] = [];

  for (const entry of REFERENCE_GAP_VOCABULARY) {
    const key = entry.term.toLowerCase();
    if (seen.has(key)) continue;
    if (!containsTerm(haystack, entry.term)) continue;
    if (matchedTermKeys.has(key)) continue;

    // Treat Golang / Go as the same gap if either matches.
    if (key === "golang" && (seen.has("go") || matchedTermKeys.has("go"))) continue;
    if (key === "go" && (seen.has("golang") || matchedTermKeys.has("golang"))) continue;

    seen.add(key);
    candidates.push({
      term: entry.term,
      kind: entry.kind,
      question: questionForGap(entry.term, entry.kind),
    });
  }

  return candidates;
}

/** Convenience wrapper — term strings only (same set as {@link findGapCandidates}). */
export function findGapTerms(jobText: string, matchedTerms: MatchedTerm[]): string[] {
  return findGapCandidates(jobText, matchedTerms).map((gap) => gap.term);
}

export function buildTailoredVersion(
  data: ResumeData,
  jobDescription: JobDescription,
  ranking: TargetRanking[],
  matchedTerms: MatchedTerm[],
  options: TailorOptions = {},
): { target: ResumeTarget; version: ResumeVersion } {
  const target = options.targetId
    ? data.resumeTargets.find((item) => item.id === options.targetId)
    : ranking[0]?.target;

  if (!target) {
    throw new Error(
      options.targetId
        ? `Unknown target ID "${options.targetId}"`
        : "No résumé targets are defined in data/resume_targets.yaml",
    );
  }

  const matchedTermKeys = matchedTermKeySet(matchedTerms);

  const scoredAccomplishments = data.accomplishments
    .filter((item) => item.target_roles.includes(target.id))
    .map((item, index) => ({
      item,
      index,
      score: scoreAccomplishment(item, matchedTermKeys),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const accomplishmentIds = scoredAccomplishments.map((entry) => entry.item.id);

  if (accomplishmentIds.length === 0) {
    throw new Error(
      `No accomplishments reference target role "${target.id}" — add accomplishments with this target_role before tailoring for it.`,
    );
  }

  const accomplishmentIdSet = new Set(accomplishmentIds);
  const experienceIds = data.experience
    .filter((role) => role.accomplishment_ids.some((id) => accomplishmentIdSet.has(id)))
    .map((role) => role.id);

  const projectIds = selectProjectIds(data, accomplishmentIds);
  const skillEmphasis = selectSkillEmphasis(data, matchedTerms);

  const slugSource = options.slug ?? jobDescription.title;
  const slug = slugify(slugSource) || "tailored-role";
  const label = options.label ?? `${target.label} — tailored for ${jobDescription.title}`;

  const version: ResumeVersion = {
    id: `tailored-${slug}`,
    target_id: target.id,
    label,
    summary_variant: target.summary_variant,
    experience_ids: experienceIds,
    accomplishment_ids: accomplishmentIds,
    project_ids: projectIds.length > 0 ? projectIds : undefined,
    skill_emphasis: skillEmphasis.length > 0 ? skillEmphasis : undefined,
    output_slug: `tailored-${slug}`,
    revision_history: [
      {
        date: new Date().toISOString().slice(0, 10),
        note: `Tailored from job description: ${jobDescription.sourcePath}`,
      },
    ],
  };

  return { target, version };
}

export function tailorResumeForJobDescription(
  data: ResumeData,
  jobDescription: JobDescription,
  options: TailorOptions = {},
): TailorResult {
  const matchedTerms = extractMatchedTerms(jobDescription.text, data);
  const ranking = rankTargets(data, matchedTerms);
  const { target, version } = buildTailoredVersion(
    data,
    jobDescription,
    ranking,
    matchedTerms,
    options,
  );
  const gapCandidates = findGapCandidates(jobDescription.text, matchedTerms);
  const gapTerms = gapCandidates.map((gap) => gap.term);

  return {
    jobDescription,
    matchedTerms,
    ranking,
    target,
    version,
    gapTerms,
    gapCandidates,
  };
}

export function buildMatchReport(result: TailorResult): string {
  const { jobDescription, matchedTerms, ranking, target, version, gapTerms } = result;

  const lines: string[] = [];
  lines.push(`# Job Description Match Report`);
  lines.push("");
  lines.push(`**Source:** \`${jobDescription.sourcePath}\``);
  lines.push(`**Job title:** ${jobDescription.title}`);
  lines.push(`**Generated:** ${new Date().toISOString().slice(0, 10)}`);
  lines.push("");
  lines.push(`## Recommended Target`);
  lines.push("");
  lines.push(`**${target.label}** (\`${target.id}\`)`);
  lines.push("");
  lines.push(`## Target Ranking`);
  lines.push("");
  lines.push(`| Target | Score | Matched Emphasis |`);
  lines.push(`|--------|-------|-------------------|`);
  for (const entry of ranking) {
    const emphasis = entry.matchedEmphasis.length > 0 ? entry.matchedEmphasis.join(", ") : "—";
    lines.push(`| ${entry.target.label} | ${entry.score} | ${emphasis} |`);
  }
  lines.push("");
  lines.push(`## Matched Terms (${matchedTerms.length})`);
  lines.push("");
  if (matchedTerms.length === 0) {
    lines.push("No known résumé terms were found in this job description.");
  } else {
    for (const match of matchedTerms) {
      lines.push(`- ${match.term} (${[...match.sources].join(", ")})`);
    }
  }
  lines.push("");
  lines.push(`## Selected Accomplishments (ranked by relevance)`);
  lines.push("");
  lines.push(`Included in tailored version \`${version.id}\`, most relevant first:`);
  lines.push("");
  for (const id of version.accomplishment_ids) {
    lines.push(`- ${id}`);
  }
  lines.push("");
  lines.push(`## Possible Gaps`);
  lines.push("");
  lines.push(
    "Terms mentioned in the job description that aren't currently reflected in the résumé data. This is informational only — it does not mean Tyler lacks the skill, only that it isn't yet documented.",
  );
  lines.push("");
  if (gapTerms.length === 0) {
    lines.push("No obvious gaps detected against the reference vocabulary.");
  } else {
    for (const gap of result.gapCandidates) {
      lines.push(`- **${gap.term}** (${gap.kind}) — ${gap.question}`);
    }
    lines.push("");
    lines.push(
      "To capture missing evidence interactively: `npm run tailor -- <jd> --interview-gaps` (or `npm run interview-gaps -- <jd>`).",
    );
  }
  lines.push("");

  return lines.join("\n");
}
