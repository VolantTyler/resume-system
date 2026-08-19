import { describe, expect, it } from "vitest";
import { loadResumeData } from "../scripts/lib/load-data.js";
import type { ResumeData, ResumeVersion } from "../scripts/lib/schemas.js";
import {
  buildClaimVerificationReport,
  hasUnsupportedClaims,
  verifyResumeVersionClaims,
} from "../scripts/lib/verify-claims.js";

function makeData(overrides: Partial<ResumeData> = {}): ResumeData {
  return {
    profile: {
      name: "Test Candidate",
      headline: "Engineer",
      summary_variants: { standard: "A capable engineer." },
      target_roles: ["engineer"],
    },
    accomplishments: [],
    projects: [],
    experience: [],
    skills: { categories: [] },
    resumeTargets: [
      { id: "engineer", label: "Engineer", summary_variant: "standard", bullet_variant: "standard" },
    ],
    resumeVersions: [],
    ...overrides,
  };
}

function makeVersion(overrides: Partial<ResumeVersion> = {}): ResumeVersion {
  return {
    id: "test-version",
    target_id: "engineer",
    label: "Test Version",
    summary_variant: "standard",
    experience_ids: [],
    accomplishment_ids: [],
    output_slug: "test-version",
    ...overrides,
  };
}

describe("verifyResumeVersionClaims — metrics", () => {
  it("verifies a number that appears in raw_fact", () => {
    const data = makeData({
      accomplishments: [
        {
          id: "acc-1",
          raw_fact: "Cut deploy time by 40% across three pipelines.",
          resume_bullets: { standard: "Cut deploy time by 40%." },
          target_roles: ["engineer"],
          confidence: "high",
        },
      ],
    });
    const version = makeVersion({ accomplishment_ids: ["acc-1"] });

    const result = verifyResumeVersionClaims(data, version);

    expect(result.totals.unsupported).toBe(0);
    const metricFindings = result.accomplishments[0].findings.filter(
      (f) => f.kind === "metric",
    );
    expect(metricFindings).toHaveLength(1);
    expect(metricFindings[0].status).toBe("verified");
  });

  it("flags a number in the bullet that never appears in raw_fact/evidence", () => {
    const data = makeData({
      accomplishments: [
        {
          id: "acc-1",
          raw_fact: "Cut deploy time across three pipelines.",
          resume_bullets: { standard: "Cut deploy time by 40%." },
          target_roles: ["engineer"],
          confidence: "high",
        },
      ],
    });
    const version = makeVersion({ accomplishment_ids: ["acc-1"] });

    const result = verifyResumeVersionClaims(data, version);

    expect(result.totals.unsupported).toBe(1);
    expect(hasUnsupportedClaims(result)).toBe(true);
    const metricFinding = result.accomplishments[0].findings.find(
      (f) => f.kind === "metric",
    );
    expect(metricFinding?.claim).toBe("40%");
    expect(metricFinding?.status).toBe("unsupported");
  });

  it("checks evidence[] and source_notes[] in addition to raw_fact", () => {
    const data = makeData({
      accomplishments: [
        {
          id: "acc-1",
          raw_fact: "Reduced onboarding friction for new hires.",
          resume_bullets: { standard: "Reduced onboarding time by 25%." },
          evidence: ["Internal metrics doc: 25% reduction quarter over quarter"],
          target_roles: ["engineer"],
          confidence: "high",
        },
      ],
    });
    const version = makeVersion({ accomplishment_ids: ["acc-1"] });

    const result = verifyResumeVersionClaims(data, version);

    expect(result.totals.unsupported).toBe(0);
  });

  it("ignores bare single-digit numbers as noise", () => {
    const data = makeData({
      accomplishments: [
        {
          id: "acc-1",
          raw_fact: "Led a small team.",
          resume_bullets: { standard: "Led a team through 2 major releases." },
          target_roles: ["engineer"],
          confidence: "high",
        },
      ],
    });
    const version = makeVersion({ accomplishment_ids: ["acc-1"] });

    const result = verifyResumeVersionClaims(data, version);

    expect(result.accomplishments[0].findings.filter((f) => f.kind === "metric")).toHaveLength(0);
  });
});

describe("verifyResumeVersionClaims — technologies", () => {
  it("verifies a technology listed on the accomplishment itself", () => {
    const data = makeData({
      accomplishments: [
        {
          id: "acc-1",
          raw_fact: "Built a service in Go.",
          resume_bullets: { standard: "Built a Go microservice." },
          technologies: ["Go"],
          target_roles: ["engineer"],
          confidence: "high",
        },
      ],
      skills: {
        categories: [{ name: "Languages", skills: [{ name: "Go" }] }],
      },
    });
    const version = makeVersion({ accomplishment_ids: ["acc-1"] });

    const result = verifyResumeVersionClaims(data, version);

    const techFinding = result.accomplishments[0].findings.find((f) => f.kind === "technology");
    expect(techFinding?.status).toBe("verified");
  });

  it("verifies via skills.yaml evidence_ids even when the term isn't spelled out in raw_fact", () => {
    const data = makeData({
      accomplishments: [
        {
          id: "acc-1",
          raw_fact: "Added mandatory human checkpoints before agent actions execute.",
          resume_bullets: { standard: "Added HITL checkpoints before agent actions execute." },
          target_roles: ["engineer"],
          confidence: "high",
        },
      ],
      skills: {
        categories: [
          {
            name: "Practices",
            skills: [
              {
                name: "Human-in-the-loop controls",
                aliases: ["HITL"],
                evidence_ids: ["acc-1"],
              },
            ],
          },
        ],
      },
    });
    const version = makeVersion({ accomplishment_ids: ["acc-1"] });

    const result = verifyResumeVersionClaims(data, version);

    const techFinding = result.accomplishments[0].findings.find((f) => f.kind === "technology");
    expect(techFinding?.claim).toBe("HITL");
    expect(techFinding?.status).toBe("verified");
    expect(techFinding?.detail).toContain("skills.yaml explicitly cites");
  });

  it("flags a recognized skill term with no backing on this accomplishment", () => {
    const data = makeData({
      accomplishments: [
        {
          id: "acc-1",
          raw_fact: "Built a reporting pipeline.",
          resume_bullets: { standard: "Built a Kubernetes-based reporting pipeline." },
          target_roles: ["engineer"],
          confidence: "high",
        },
      ],
      skills: {
        categories: [
          {
            name: "Infra",
            skills: [{ name: "Kubernetes", evidence_ids: ["some-other-accomplishment"] }],
          },
        ],
      },
    });
    const version = makeVersion({ accomplishment_ids: ["acc-1"] });

    const result = verifyResumeVersionClaims(data, version);

    expect(result.totals.unsupported).toBe(1);
    const techFinding = result.accomplishments[0].findings.find((f) => f.kind === "technology");
    expect(techFinding?.claim).toBe("Kubernetes");
    expect(techFinding?.status).toBe("unsupported");
  });
});

describe("verifyResumeVersionClaims — confidence", () => {
  it("flags medium/low confidence bullets as inferred, not unsupported", () => {
    const data = makeData({
      accomplishments: [
        {
          id: "acc-1",
          raw_fact: "Contributed to a platform migration.",
          resume_bullets: { standard: "Contributed to a platform migration." },
          target_roles: ["engineer"],
          confidence: "medium",
        },
      ],
    });
    const version = makeVersion({ accomplishment_ids: ["acc-1"] });

    const result = verifyResumeVersionClaims(data, version);

    const confidenceFinding = result.accomplishments[0].findings.find(
      (f) => f.kind === "confidence",
    );
    expect(confidenceFinding?.status).toBe("inferred");
    expect(result.totals.unsupported).toBe(0);
  });

  it("emits no confidence finding for high-confidence accomplishments", () => {
    const data = makeData({
      accomplishments: [
        {
          id: "acc-1",
          raw_fact: "Shipped a feature.",
          resume_bullets: { standard: "Shipped a feature." },
          target_roles: ["engineer"],
          confidence: "high",
        },
      ],
    });
    const version = makeVersion({ accomplishment_ids: ["acc-1"] });

    const result = verifyResumeVersionClaims(data, version);

    expect(result.accomplishments[0].findings.some((f) => f.kind === "confidence")).toBe(false);
  });
});

describe("buildClaimVerificationReport", () => {
  it("renders a markdown ledger with per-accomplishment tables", () => {
    const data = makeData({
      accomplishments: [
        {
          id: "acc-1",
          raw_fact: "Shipped a feature with no metrics.",
          resume_bullets: { standard: "Shipped a feature that cut errors by 90%." },
          target_roles: ["engineer"],
          confidence: "high",
        },
      ],
    });
    const version = makeVersion({ accomplishment_ids: ["acc-1"] });
    const result = verifyResumeVersionClaims(data, version);

    const report = buildClaimVerificationReport(result);

    expect(report).toContain("# Claim Verification");
    expect(report).toContain("acc-1");
    expect(report).toContain("90%");
    expect(report).toContain("Unsupported");
  });
});

describe("verifyResumeVersionClaims — real repo data", () => {
  it("runs over every curated résumé version without throwing", () => {
    const data = loadResumeData();

    for (const version of data.resumeVersions) {
      const result = verifyResumeVersionClaims(data, version);
      const summedTotal =
        result.totals.verified + result.totals.inferred + result.totals.unsupported;
      const findingCount = result.accomplishments.reduce(
        (sum, item) => sum + item.findings.length,
        0,
      );

      expect(result.accomplishments.length).toBe(version.accomplishment_ids.length);
      expect(summedTotal).toBe(findingCount);
    }
  });
});
