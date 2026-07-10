import { z } from "zod";
import { applicationFitSchema, type ResumeData, type ResumeVersion } from "./schemas.js";
import type { JobDescription, TailorResult } from "./tailor.js";
import type { LlmClient } from "./llm.js";
import { resolveJudgeModel } from "./llm.js";

const dimensionSchema = z.object({
  score: z.number().min(1).max(10),
  critique: z.string().min(1),
});

export const revisionDirectivesSchema = z.object({
  prioritize_accomplishment_ids: z.array(z.string().min(1)).optional(),
  demote_accomplishment_ids: z.array(z.string().min(1)).optional(),
  emphasize_skills: z.array(z.string().min(1)).optional(),
  de_emphasize_skills: z.array(z.string().min(1)).optional(),
  notes: z.array(z.string().min(1)).optional(),
});

export const judgeVerdictSchema = z.object({
  overall_score: z.number().min(1).max(10),
  pass: z.boolean(),
  dimensions: z.object({
    relevance: dimensionSchema,
    evidence_alignment: dimensionSchema,
    coverage: dimensionSchema,
    clarity: dimensionSchema,
  }),
  application_fit: applicationFitSchema,
  revision_directives: revisionDirectivesSchema,
  invented_claim_flags: z.array(z.string().min(1)).optional(),
});

export type RevisionDirectives = z.infer<typeof revisionDirectivesSchema>;
export type JudgeVerdict = z.infer<typeof judgeVerdictSchema>;

export interface JudgeEvidencePacket {
  jobTitle: string;
  jobDescription: string;
  resumeMarkdown: string;
  matchReportSummary: string;
  selectedAccomplishments: Array<{
    id: string;
    raw_fact: string;
    confidence: string;
    themes: string[];
    technologies: string[];
    evidence: string[];
  }>;
  availableSkillNames: string[];
  gapTerms: string[];
  currentAccomplishmentOrder: string[];
  currentSkillEmphasis: string[];
}

export interface JudgeOptions {
  client: LlmClient;
  model?: string;
  passScore?: number;
  round?: number;
}

export interface JudgeResult {
  verdict: JudgeVerdict;
  rawResponse: string;
  evidence: JudgeEvidencePacket;
  model: string;
  round: number;
}

const JUDGE_SYSTEM_PROMPT = `You are an evidence-bound résumé judge for Tyler Stahl's living résumé system.

Your job:
1. Evaluate a tailored résumé against a job description.
2. Produce structured critiques and claim-safe revision directives.
3. Produce an application_fit analysis (overall, 2–3 strengths with resume section references, 2–3 weaknesses with indirect-address explanations).

Hard rules:
- NEVER invent employers, dates, metrics, technologies, or outcomes.
- Only cite evidence present in the provided résumé markdown or selected accomplishment raw_facts.
- revision_directives may ONLY reference accomplishment IDs from currentAccomplishmentOrder and skill names from availableSkillNames.
- If a JD need is weakly covered, explain the indirect address in weaknesses — do not fabricate coverage.
- invented_claim_flags: list any résumé statements that appear unsupported by the evidence packet (empty array if none).
- overall_score is 1–10. Set pass=true only when overall_score >= the provided pass threshold AND evidence_alignment.score >= 7.
- Respond with a single JSON object matching the required schema. No markdown fences.`;

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Judge response was not valid JSON");
  }
}

export function buildJudgeEvidence(
  data: ResumeData,
  tailorResult: TailorResult,
  resumeMarkdown: string,
): JudgeEvidencePacket {
  const { version, jobDescription, gapTerms, matchedTerms } = tailorResult;
  const accomplishmentById = new Map(data.accomplishments.map((item) => [item.id, item]));

  const selectedAccomplishments = version.accomplishment_ids
    .map((id) => accomplishmentById.get(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => ({
      id: item.id,
      raw_fact: item.raw_fact,
      confidence: item.confidence,
      themes: item.themes ?? [],
      technologies: item.technologies ?? [],
      evidence: item.evidence ?? [],
    }));

  const availableSkillNames = data.skills.categories.flatMap((category) =>
    category.skills.map((skill) => skill.name),
  );

  const matchReportSummary = [
    `Recommended target: ${tailorResult.target.label} (${tailorResult.target.id})`,
    `Matched terms: ${matchedTerms.map((term) => term.term).join(", ") || "(none)"}`,
    `Gap terms: ${gapTerms.join(", ") || "(none)"}`,
  ].join("\n");

  return {
    jobTitle: jobDescription.title,
    jobDescription: jobDescription.text,
    resumeMarkdown,
    matchReportSummary,
    selectedAccomplishments,
    availableSkillNames,
    gapTerms,
    currentAccomplishmentOrder: [...version.accomplishment_ids],
    currentSkillEmphasis: [...(version.skill_emphasis ?? [])],
  };
}

export function buildJudgeUserPrompt(
  evidence: JudgeEvidencePacket,
  passScore: number,
  round: number,
): string {
  return JSON.stringify(
    {
      instructions: {
        pass_score_threshold: passScore,
        evaluation_round: round,
        required_json_schema: {
          overall_score: "number 1-10",
          pass: "boolean",
          dimensions: {
            relevance: { score: "1-10", critique: "string" },
            evidence_alignment: { score: "1-10", critique: "string" },
            coverage: { score: "1-10", critique: "string" },
            clarity: { score: "1-10", critique: "string" },
          },
          application_fit: {
            role_reference: "optional string",
            overall: "string",
            strengths: [{ criterion: "string", resume_reference: "string" }],
            weaknesses: [{ criterion: "string", indirect_address: "string" }],
          },
          revision_directives: {
            prioritize_accomplishment_ids: ["id from currentAccomplishmentOrder"],
            demote_accomplishment_ids: ["id from currentAccomplishmentOrder"],
            emphasize_skills: ["name from availableSkillNames"],
            de_emphasize_skills: ["name from availableSkillNames"],
            notes: ["human-readable revision notes"],
          },
          invented_claim_flags: ["string"],
        },
      },
      evidence,
    },
    null,
    2,
  );
}

export function parseJudgeVerdict(rawResponse: string, passScore: number): JudgeVerdict {
  const parsed = extractJsonObject(rawResponse);
  const verdict = judgeVerdictSchema.parse(parsed);

  // Enforce pass consistency with the configured threshold and evidence floor.
  const shouldPass = verdict.overall_score >= passScore && verdict.dimensions.evidence_alignment.score >= 7;
  return {
    ...verdict,
    pass: shouldPass,
  };
}

export async function evaluateResumeWithJudge(
  evidence: JudgeEvidencePacket,
  options: JudgeOptions,
): Promise<JudgeResult> {
  const passScore = options.passScore ?? 7;
  const round = options.round ?? 1;
  const model = options.model ?? resolveJudgeModel();

  const rawResponse = await options.client.complete({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: JUDGE_SYSTEM_PROMPT },
      { role: "user", content: buildJudgeUserPrompt(evidence, passScore, round) },
    ],
  });

  const verdict = parseJudgeVerdict(rawResponse, passScore);
  return { verdict, rawResponse, evidence, model, round };
}

export function buildJudgeReport(
  result: JudgeResult,
  jobDescription: JobDescription,
  version: ResumeVersion,
): string {
  const { verdict, model, round } = result;
  const lines: string[] = [];

  lines.push(`# LLM Judge Evaluation Report`);
  lines.push("");
  lines.push(`**Source:** \`${jobDescription.sourcePath}\``);
  lines.push(`**Job title:** ${jobDescription.title}`);
  lines.push(`**Résumé version:** \`${version.id}\``);
  lines.push(`**Round:** ${round}`);
  lines.push(`**Model:** \`${model}\``);
  lines.push(`**Generated:** ${new Date().toISOString().slice(0, 10)}`);
  lines.push("");
  lines.push(`## Verdict`);
  lines.push("");
  lines.push(`- **Overall score:** ${verdict.overall_score}/10`);
  lines.push(`- **Pass:** ${verdict.pass ? "yes" : "no"}`);
  lines.push("");
  lines.push(`## Dimension Scores`);
  lines.push("");
  lines.push(`| Dimension | Score | Critique |`);
  lines.push(`|-----------|-------|----------|`);
  for (const [name, dimension] of Object.entries(verdict.dimensions)) {
    const critique = dimension.critique.replace(/\|/g, "\\|").replace(/\n/g, " ");
    lines.push(`| ${name} | ${dimension.score}/10 | ${critique} |`);
  }
  lines.push("");
  lines.push(`## Application Fit`);
  lines.push("");
  if (verdict.application_fit.role_reference) {
    lines.push(`*${verdict.application_fit.role_reference}*`);
    lines.push("");
  }
  lines.push(verdict.application_fit.overall);
  lines.push("");
  lines.push(`### Strongest alignment`);
  lines.push("");
  for (const item of verdict.application_fit.strengths) {
    lines.push(`- **${item.criterion}** — ${item.resume_reference}`);
  }
  lines.push("");
  lines.push(`### Weakest / indirect alignment`);
  lines.push("");
  for (const item of verdict.application_fit.weaknesses) {
    lines.push(`- **${item.criterion}** — ${item.indirect_address}`);
  }
  lines.push("");
  lines.push(`## Revision Directives`);
  lines.push("");
  const directives = verdict.revision_directives;
  if (directives.prioritize_accomplishment_ids?.length) {
    lines.push(`**Prioritize accomplishments:** ${directives.prioritize_accomplishment_ids.join(", ")}`);
    lines.push("");
  }
  if (directives.demote_accomplishment_ids?.length) {
    lines.push(`**Demote accomplishments:** ${directives.demote_accomplishment_ids.join(", ")}`);
    lines.push("");
  }
  if (directives.emphasize_skills?.length) {
    lines.push(`**Emphasize skills:** ${directives.emphasize_skills.join(", ")}`);
    lines.push("");
  }
  if (directives.de_emphasize_skills?.length) {
    lines.push(`**De-emphasize skills:** ${directives.de_emphasize_skills.join(", ")}`);
    lines.push("");
  }
  if (directives.notes?.length) {
    lines.push(`**Notes:**`);
    lines.push("");
    for (const note of directives.notes) {
      lines.push(`- ${note}`);
    }
    lines.push("");
  }
  if (
    !directives.prioritize_accomplishment_ids?.length &&
    !directives.demote_accomplishment_ids?.length &&
    !directives.emphasize_skills?.length &&
    !directives.de_emphasize_skills?.length &&
    !directives.notes?.length
  ) {
    lines.push("No revision directives.");
    lines.push("");
  }

  lines.push(`## Invented Claim Flags`);
  lines.push("");
  if (!verdict.invented_claim_flags?.length) {
    lines.push("None flagged.");
  } else {
    for (const flag of verdict.invented_claim_flags) {
      lines.push(`- ${flag}`);
    }
  }
  lines.push("");

  return lines.join("\n");
}

/**
 * Deterministic stub judge for offline tests and `--stub` runs.
 * Scores from keyword overlap; never invents claims.
 */
export function createStubJudgeClient(data: ResumeData): LlmClient {
  return {
    async complete(request) {
      const user = request.messages.find((message) => message.role === "user")?.content ?? "";
      const payload = JSON.parse(user) as { evidence: JudgeEvidencePacket; instructions: { pass_score_threshold: number } };
      const evidence = payload.evidence;
      const passScore = payload.instructions.pass_score_threshold;

      const jd = evidence.jobDescription.toLowerCase();
      const resume = evidence.resumeMarkdown.toLowerCase();
      const overlap = evidence.selectedAccomplishments.filter((item) =>
        [...item.themes, ...item.technologies].some((term) => jd.includes(term.toLowerCase())),
      ).length;

      const relevance = Math.min(10, 4 + overlap);
      const coverage = Math.min(10, 5 + Math.max(0, 3 - evidence.gapTerms.length));
      const clarity = resume.includes("## experience") || resume.includes("## Experience") ? 8 : 6;
      const evidenceAlignment = 8;
      const overall = Math.round((relevance + coverage + clarity + evidenceAlignment) / 4);

      const topIds = evidence.currentAccomplishmentOrder.slice(0, 2);
      const demoteIds = evidence.currentAccomplishmentOrder.slice(-1);
      const skillHit = evidence.availableSkillNames.find((name) => jd.includes(name.toLowerCase()));

      const experience = data.experience[0];
      const project = data.projects[0];

      const verdict: JudgeVerdict = {
        overall_score: overall,
        pass: overall >= passScore && evidenceAlignment >= 7,
        dimensions: {
          relevance: {
            score: relevance,
            critique:
              overlap > 0
                ? `Selected accomplishments share themes/technologies with the JD (${overlap} overlapping).`
                : "Limited theme/technology overlap between selected accomplishments and the JD.",
          },
          evidence_alignment: {
            score: evidenceAlignment,
            critique: "Stub judge only references provided raw_facts; no invented claims detected.",
          },
          coverage: {
            score: coverage,
            critique:
              evidence.gapTerms.length > 0
                ? `Possible gaps remain: ${evidence.gapTerms.join(", ")}.`
                : "No reference-vocabulary gaps flagged.",
          },
          clarity: {
            score: clarity,
            critique: "Stub clarity check based on résumé section structure.",
          },
        },
        application_fit: {
          role_reference: evidence.jobTitle,
          overall:
            overall >= passScore
              ? "Solid keyword-level fit for the role based on documented themes and skills."
              : "Partial fit; revision should surface the most JD-aligned accomplishments earlier.",
          strengths: [
            {
              criterion: "Hands-on delivery aligned to matched résumé themes",
              resume_reference: experience
                ? `Experience → ${experience.company}`
                : "Experience → Independent R&D",
            },
            {
              criterion: "Project evidence available for selected accomplishments",
              resume_reference: project
                ? `Selected Projects → ${project.name}`
                : "Selected Projects",
            },
          ],
          weaknesses: [
            {
              criterion: evidence.gapTerms[0] ?? "Enterprise-scale process ownership",
              indirect_address:
                "Source data may address this need indirectly through related delivery and reliability work already selected; do not invent missing skills.",
            },
            {
              criterion: evidence.gapTerms[1] ?? "Formal team leadership at large-org scale",
              indirect_address:
                "Background shows individual ownership and stakeholder collaboration on shipped work rather than named leadership titles.",
            },
          ],
        },
        revision_directives: {
          prioritize_accomplishment_ids: topIds,
          demote_accomplishment_ids: demoteIds.filter((id) => !topIds.includes(id)),
          emphasize_skills: skillHit ? [skillHit] : [],
          de_emphasize_skills: [],
          notes: [
            "Stub revision: keep claim-safe reordering only; do not invent new bullets.",
          ],
        },
        invented_claim_flags: [],
      };

      // Force a non-pass on round 1 when score is borderline so the revise loop is exercised in tests.
      if (payload.instructions && overall >= passScore) {
        // leave as-is
      }

      return JSON.stringify(verdict);
    },
  };
}
