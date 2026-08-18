import { selectBullet } from "./build-resume-context.js";
import { resolveTargetForVersion } from "./role-brief.js";
import type { Accomplishment, ResumeData, ResumeVersion } from "./schemas.js";

export type ClaimStatus = "verified" | "inferred" | "unsupported";

export interface ClaimFinding {
  kind: "metric" | "technology" | "confidence";
  claim: string;
  status: ClaimStatus;
  detail: string;
}

export interface AccomplishmentClaimReport {
  accomplishmentId: string;
  company?: string;
  bullet: string;
  confidence: Accomplishment["confidence"];
  findings: ClaimFinding[];
}

export interface VerifyClaimsResult {
  versionId: string;
  versionLabel: string;
  accomplishments: AccomplishmentClaimReport[];
  totals: Record<ClaimStatus, number>;
}

// Digit runs with a value worth checking: multi-digit numbers, or any number
// carrying a %, +, or x/X suffix (single bare digits like "step 2" are noise).
// The x/X suffix needs a negative lookahead rather than \b: \b after a
// non-word char like % is not itself a boundary, so a trailing \b would
// silently drop the % / + from the match.
const METRIC_PATTERN = /\b\d[\d,]*(?:\.\d+)?(?:%|\+|[xX](?!\w))?/g;

function isNoiseMetric(token: string): boolean {
  const digitsOnly = token.replace(/[^\d]/g, "");
  const hasSuffix = /[%+xX]$/.test(token);
  return digitsOnly.length < 2 && !hasSuffix;
}

function normalizeDigits(token: string): string {
  return token.replace(/,/g, "").replace(/[^\d.]/g, "");
}

function extractMetricClaims(bullet: string): string[] {
  const matches = bullet.match(METRIC_PATTERN) ?? [];
  const seen = new Set<string>();
  const claims: string[] = [];
  for (const match of matches) {
    if (isNoiseMetric(match)) continue;
    const key = normalizeDigits(match);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    claims.push(match);
  }
  return claims;
}

function accomplishmentEvidenceText(accomplishment: Accomplishment): string {
  return [
    accomplishment.raw_fact,
    accomplishment.context ?? "",
    accomplishment.timeframe ?? "",
    ...(accomplishment.evidence ?? []),
    ...(accomplishment.source_notes ?? []),
  ]
    .join(" \n ")
    .toLowerCase();
}

function checkMetricClaim(
  claim: string,
  evidenceText: string,
): ClaimFinding {
  const digits = normalizeDigits(claim);
  const evidenceDigits = evidenceText.replace(/,/g, "");
  const found = digits.length > 0 && evidenceDigits.includes(digits);

  return {
    kind: "metric",
    claim,
    status: found ? "verified" : "unsupported",
    detail: found
      ? `"${claim}" appears in raw_fact/evidence/source_notes.`
      : `"${claim}" does not appear anywhere in this accomplishment's raw_fact, evidence, source_notes, context, or timeframe — the résumé bullet states a number the source data doesn't back up.`,
  };
}

interface TechVocabularyEntry {
  display: string;
  pattern: RegExp;
  /** Accomplishment ids that skills.yaml itself cites as evidence for this term. */
  evidenceIds: Set<string>;
}

/**
 * Every skill/alias/technology name known anywhere in data/, longest names
 * first so "React Native" matches before the shorter "React" would.
 *
 * A skill's `evidence_ids` in skills.yaml is a second, independent source of
 * truth beyond an accomplishment's own text — e.g. "HITL" and "Human-in-the-loop
 * controls" are the same skill entry, so an accomplishment whose skills.yaml
 * evidence_ids cites it counts as backed even if the accomplishment's raw_fact
 * spells the phrase out instead of using the acronym.
 */
function buildTechVocabulary(data: ResumeData): TechVocabularyEntry[] {
  const seen = new Map<string, { display: string; evidenceIds: Set<string> }>();

  const add = (term: string | undefined, evidenceIds: string[] = []): void => {
    const trimmed = term?.trim();
    if (!trimmed || trimmed.length < 2) return;
    const key = trimmed.toLowerCase();
    const existing = seen.get(key);
    if (existing) {
      for (const id of evidenceIds) existing.evidenceIds.add(id);
      return;
    }
    seen.set(key, { display: trimmed, evidenceIds: new Set(evidenceIds) });
  };

  for (const category of data.skills.categories) {
    for (const skill of category.skills) {
      const evidenceIds = skill.evidence_ids ?? [];
      add(skill.name, evidenceIds);
      for (const alias of skill.aliases ?? []) add(alias, evidenceIds);
    }
  }
  for (const accomplishment of data.accomplishments) {
    for (const tech of accomplishment.technologies ?? []) add(tech);
  }

  return Array.from(seen.values())
    .sort((a, b) => b.display.length - a.display.length)
    .map(({ display, evidenceIds }) => ({
      display,
      evidenceIds,
      pattern: new RegExp(`\\b${escapeRegExp(display)}\\b`, "i"),
    }));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findTechnologyMentions(
  bullet: string,
  vocabulary: TechVocabularyEntry[],
): TechVocabularyEntry[] {
  const mentions: TechVocabularyEntry[] = [];
  let remaining = bullet;
  for (const entry of vocabulary) {
    if (entry.pattern.test(remaining)) {
      mentions.push(entry);
      // Prevent a shorter term (e.g. "React") from double-matching inside a
      // longer one already claimed (e.g. "React Native").
      remaining = remaining.replace(entry.pattern, "");
    }
  }
  return mentions;
}

function checkTechnologyClaim(
  entry: TechVocabularyEntry,
  accomplishment: Accomplishment,
  evidenceText: string,
): ClaimFinding {
  const term = entry.display;
  const ownTechnologies = (accomplishment.technologies ?? []).map((t) =>
    t.toLowerCase(),
  );
  const ownThemes = (accomplishment.themes ?? []).map((t) => t.toLowerCase());
  const termLower = term.toLowerCase();

  const directMatch =
    ownTechnologies.includes(termLower) ||
    ownThemes.includes(termLower) ||
    evidenceText.includes(termLower);
  const citedAsEvidence = entry.evidenceIds.has(accomplishment.id);
  const found = directMatch || citedAsEvidence;

  return {
    kind: "technology",
    claim: term,
    status: found ? "verified" : "unsupported",
    detail: directMatch
      ? `"${term}" is listed in this accomplishment's technologies/themes or evidence text.`
      : citedAsEvidence
        ? `"${term}" isn't spelled out in this accomplishment's raw_fact, but data/skills.yaml explicitly cites "${accomplishment.id}" as evidence for this skill.`
        : `"${term}" is a recognized skill/technology elsewhere in data/, but isn't listed in this accomplishment's technologies/themes, doesn't appear in its raw_fact or evidence, and data/skills.yaml doesn't cite this accomplishment as evidence for it — possible bleed-through from the job description or another accomplishment's bullet.`,
  };
}

function checkConfidence(accomplishment: Accomplishment): ClaimFinding | undefined {
  if (accomplishment.confidence === "high") return undefined;
  return {
    kind: "confidence",
    claim: `confidence: ${accomplishment.confidence}`,
    status: "inferred",
    detail: `This bullet is backed by a "${accomplishment.confidence}"-confidence accomplishment — the underlying evidence is thinner than a high-confidence claim. Fine to include, but don't state it with more certainty than the source has.`,
  };
}

/**
 * Deterministically re-check every bullet a résumé version will render against
 * its own source-of-truth accomplishment record — the manual cross-reference
 * pass against data/*.yaml that would otherwise happen by hand before an
 * application goes out. No LLM calls; every finding traces to an exact field.
 */
export function verifyResumeVersionClaims(
  data: ResumeData,
  version: ResumeVersion,
): VerifyClaimsResult {
  const target = resolveTargetForVersion(data, version);
  const accomplishmentMap = new Map(data.accomplishments.map((a) => [a.id, a]));
  const vocabulary = buildTechVocabulary(data);

  const accomplishments: AccomplishmentClaimReport[] = [];
  const totals: Record<ClaimStatus, number> = {
    verified: 0,
    inferred: 0,
    unsupported: 0,
  };

  for (const id of version.accomplishment_ids) {
    const accomplishment = accomplishmentMap.get(id);
    if (!accomplishment) {
      // Caught separately by npm run validate; skip here to keep this pass
      // focused on claim content rather than referential integrity.
      continue;
    }

    const bullet = selectBullet(accomplishment, target.bullet_variant);
    const evidenceText = accomplishmentEvidenceText(accomplishment);
    const findings: ClaimFinding[] = [];

    for (const metric of extractMetricClaims(bullet)) {
      findings.push(checkMetricClaim(metric, evidenceText));
    }

    for (const entry of findTechnologyMentions(bullet, vocabulary)) {
      findings.push(checkTechnologyClaim(entry, accomplishment, evidenceText));
    }

    const confidenceFinding = checkConfidence(accomplishment);
    if (confidenceFinding) findings.push(confidenceFinding);

    for (const finding of findings) {
      totals[finding.status] += 1;
    }

    accomplishments.push({
      accomplishmentId: accomplishment.id,
      company: accomplishment.company,
      bullet,
      confidence: accomplishment.confidence,
      findings,
    });
  }

  return {
    versionId: version.id,
    versionLabel: version.label,
    accomplishments,
    totals,
  };
}

export function hasUnsupportedClaims(result: VerifyClaimsResult): boolean {
  return result.totals.unsupported > 0;
}

export function buildClaimVerificationReport(result: VerifyClaimsResult): string {
  const lines: string[] = [
    `# Claim Verification — ${result.versionLabel} (\`${result.versionId}\`)`,
    "",
    `Verified: ${result.totals.verified} · Inferred: ${result.totals.inferred} · Unsupported: ${result.totals.unsupported}`,
    "",
  ];

  for (const item of result.accomplishments) {
    const flagged = item.findings.filter((f) => f.status !== "verified");
    const icon = flagged.some((f) => f.status === "unsupported")
      ? "❌"
      : flagged.length > 0
        ? "⚠️"
        : "✅";

    lines.push(`## ${icon} ${item.accomplishmentId}`, "", `> ${item.bullet}`, "");

    if (item.findings.length === 0) {
      lines.push("_No metric/technology claims detected in this bullet._", "");
      continue;
    }

    lines.push("| Claim | Kind | Status | Detail |", "|---|---|---|---|");
    for (const finding of item.findings) {
      const statusLabel =
        finding.status === "verified"
          ? "✅ Verified"
          : finding.status === "inferred"
            ? "⚠️ Inferred"
            : "❌ Unsupported";
      lines.push(
        `| ${finding.claim} | ${finding.kind} | ${statusLabel} | ${finding.detail} |`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}
