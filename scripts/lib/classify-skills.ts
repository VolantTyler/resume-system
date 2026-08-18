import { z } from "zod";
import type { LlmClient } from "./llm.js";
import {
  PORTFOLIO_FACETS,
  categoryFacet,
  resolveSkillFacets,
} from "./portfolio-facets.js";
import { portfolioFacetSchema, type PortfolioFacet, type ResumeData } from "./schemas.js";

export interface SkillCandidate {
  name: string;
  category: string;
  aliases: string[];
  evidence: string[];
  /** Facets the skill resolves to today — empty when nothing is inherited. */
  currentFacets: PortfolioFacet[];
}

export interface FacetProposal {
  name: string;
  facets: PortfolioFacet[];
  rationale: string;
}

const proposalsSchema = z.object({
  proposals: z.array(
    z.object({
      name: z.string().min(1),
      facets: z.array(portfolioFacetSchema).min(1),
      rationale: z.string().min(1),
    }),
  ),
});

const SYSTEM_PROMPT = `You classify résumé skills into portfolio facets for Tyler Stahl's living résumé system.

The facet vocabulary is fixed and closed: ${PORTFOLIO_FACETS.join(", ")}. Never invent a facet.

Rules:
- Assign a skill to more than one facet only when it genuinely belongs to both — a
  reviewer should recognize the claim from the evidence given, not from the skill's
  reputation. Padding a thin facet is a failure, not a favor.
- Ground every proposal in the supplied category, aliases, and evidence text.
- Every skill gets at least one facet.
- rationale is one sentence naming what in the evidence supports the choice.
- Respond with a single JSON object: {"proposals": [{"name", "facets", "rationale"}]}. No markdown fences.`;

/**
 * Skills whose facets are not stated explicitly. `unresolved` ones resolve to nothing
 * at all (their category has no default) and would vanish from every facet filter —
 * those are the ones validation rejects.
 */
export function findUnclassifiedSkills(
  data: ResumeData,
  includeInherited: boolean,
): SkillCandidate[] {
  const accomplishmentById = new Map(
    data.accomplishments.map((item) => [item.id, item]),
  );
  const candidates: SkillCandidate[] = [];

  for (const category of data.skills.categories) {
    for (const skill of category.skills) {
      if (skill.portfolio_facets?.length) {
        continue;
      }
      const inherited = categoryFacet(category.name);
      if (inherited && !includeInherited) {
        continue;
      }
      candidates.push({
        name: skill.name,
        category: category.name,
        aliases: skill.aliases ?? [],
        evidence: (skill.evidence_ids ?? []).map(
          (id) => accomplishmentById.get(id)?.raw_fact ?? id,
        ),
        currentFacets: resolveSkillFacets(skill, category.name),
      });
    }
  }

  return candidates;
}

export function buildClassifyPrompt(candidates: SkillCandidate[]): string {
  return JSON.stringify(
    {
      allowed_facets: PORTFOLIO_FACETS,
      category_defaults: {
        "Applied AI": "applied-ai",
        "Front-End": "front-end",
        "Back-End": "back-end",
        DevOps: "devops",
        Testing: null,
        Collaboration: null,
      },
      skills: candidates,
    },
    null,
    2,
  );
}

export function parseFacetProposals(
  rawResponse: string,
  candidates: SkillCandidate[],
): FacetProposal[] {
  const trimmed = rawResponse.trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) {
      throw new Error("Classifier response was not valid JSON");
    }
    parsed = JSON.parse(trimmed.slice(start, end + 1));
  }

  const known = new Set(candidates.map((item) => item.name));
  return proposalsSchema
    .parse(parsed)
    .proposals.filter((proposal) => known.has(proposal.name))
    .map((proposal) => ({
      ...proposal,
      facets: [...new Set(proposal.facets)],
    }));
}

const STUB_KEYWORDS: Record<PortfolioFacet, string[]> = {
  "applied-ai": [
    "agent",
    "llm",
    "gemini",
    "gemma",
    "model",
    "prompt",
    "rag",
    "embedding",
    "eval",
    "inference",
    "mcp",
  ],
  "front-end": [
    "react",
    "css",
    "ui",
    "ux",
    "browser",
    "component",
    "front-end",
    "frontend",
    "javascript",
    "design",
    "paint",
  ],
  "back-end": [
    "api",
    "server",
    "database",
    "sql",
    "auth",
    "endpoint",
    "backend",
    "back-end",
    "python",
    "php",
    "query",
  ],
  devops: [
    "docker",
    "ci/cd",
    "continuous",
    "deploy",
    "pipeline",
    "release",
    "staging",
    "actions",
    "container",
  ],
  collaboration: [
    "stakeholder",
    "collaboration",
    "consensus",
    "listening",
    "facilitation",
    "alignment",
    "agile",
    "scrum",
    "cross-functional",
    "cross-department",
    "workshop",
  ],
};

function matchedKeywords(haystack: string, facet: PortfolioFacet): string[] {
  return STUB_KEYWORDS[facet].filter((keyword) => {
    // Whole-word matching only: substring matching reads "api" inside "rapid"
    // and "ui" inside "guild", which cross-lists nearly everything.
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`).test(haystack);
  });
}

/**
 * Offline classifier used when no API key is configured, mirroring the judge's stub
 * mode. Keyword scoring only — it proposes, a human still confirms.
 */
export function createStubClassifyClient(): LlmClient {
  return {
    async complete(request) {
      const user = request.messages.find((message) => message.role === "user")?.content ?? "";
      const payload = JSON.parse(user) as { skills: SkillCandidate[] };

      const proposals = payload.skills.map((skill) => {
        const haystack = [skill.name, ...skill.aliases, ...skill.evidence]
          .join(" ")
          .toLowerCase();

        const hits = PORTFOLIO_FACETS.map((facet) => ({
          facet,
          keywords: matchedKeywords(haystack, facet),
        })).filter((entry) => entry.keywords.length > 0);

        const facets = hits.length > 0 ? hits.map((entry) => entry.facet) : skill.currentFacets;

        return {
          name: skill.name,
          facets: facets.length > 0 ? facets : ["applied-ai"],
          rationale:
            hits.length > 0
              ? `Stub classifier: matched ${hits
                  .map((entry) => `${entry.facet} (${entry.keywords.join("/")})`)
                  .join(", ")}.`
              : skill.currentFacets.length > 0
                ? "Stub classifier: no keyword signal — kept the inherited category facet."
                : "Stub classifier: no keyword signal — this one needs a human read.",
        };
      });

      return JSON.stringify({ proposals });
    },
  };
}

export async function proposeSkillFacets(
  candidates: SkillCandidate[],
  options: { client: LlmClient; model: string },
): Promise<FacetProposal[]> {
  const rawResponse = await options.client.complete({
    model: options.model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildClassifyPrompt(candidates) },
    ],
  });

  return parseFacetProposals(rawResponse, candidates);
}

/** The YAML a human would paste under the skill, once they agree with the proposal. */
export function formatFacetSnippet(proposal: FacetProposal): string {
  return [
    "        portfolio_facets:",
    ...proposal.facets.map((facet) => `          - ${facet}`),
  ].join("\n");
}
