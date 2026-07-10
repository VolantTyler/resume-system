import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildJudgeEvidence,
  buildJudgeReport,
  createStubJudgeClient,
  evaluateResumeWithJudge,
  parseJudgeVerdict,
  type JudgeVerdict,
} from "../scripts/lib/judge.js";
import type { LlmClient } from "../scripts/lib/llm.js";
import { loadResumeData } from "../scripts/lib/load-data.js";
import { ROOT } from "../scripts/lib/paths.js";
import { applyJudgeRevision } from "../scripts/lib/revise.js";
import {
  readJobDescriptionTitle,
  tailorResumeForJobDescription,
  type JobDescription,
} from "../scripts/lib/tailor.js";
import { runJudgeLoop } from "../scripts/judge-resume.js";
import { JOB_DESCRIPTIONS_DIR } from "../scripts/lib/paths.js";

const exampleJobPath = join(JOB_DESCRIPTIONS_DIR, "example-nonprofit-qa-frontend.md");
const exampleJobText = readFileSync(exampleJobPath, "utf8");
const tempOutputDir = join(ROOT, "output", "debug", "judge-test-output");

function makeJobDescription(text = exampleJobText): JobDescription {
  return {
    sourcePath: "docs/job-descriptions/example-nonprofit-qa-frontend.md",
    title: readJobDescriptionTitle(exampleJobPath, text),
    text,
  };
}

function baseVerdict(overrides: Partial<JudgeVerdict> = {}): JudgeVerdict {
  return {
    overall_score: 6,
    pass: false,
    dimensions: {
      relevance: { score: 6, critique: "Needs stronger Cypress emphasis." },
      evidence_alignment: { score: 8, critique: "Claims match raw_facts." },
      coverage: { score: 6, critique: "Some JD themes underweighted." },
      clarity: { score: 8, critique: "Clear structure." },
    },
    application_fit: {
      role_reference: "Front-End Engineer, QA-Minded",
      overall: "Partial fit with strong testing evidence.",
      strengths: [
        {
          criterion: "Cypress regression testing ownership",
          resume_reference: "Experience → Independent R&D",
        },
        {
          criterion: "Laravel/Livewire delivery",
          resume_reference: "Selected Projects → related work",
        },
      ],
      weaknesses: [
        {
          criterion: "WCAG specialization",
          indirect_address: "Accessibility appears indirectly via UI quality work, not as a dedicated WCAG practice.",
        },
        {
          criterion: "Large-team process ownership",
          indirect_address: "Evidence shows individual ownership of release reliability rather than formal process leadership.",
        },
      ],
    },
    revision_directives: {
      prioritize_accomplishment_ids: [],
      demote_accomplishment_ids: [],
      emphasize_skills: [],
      de_emphasize_skills: [],
      notes: ["Reorder toward testing evidence."],
    },
    invented_claim_flags: [],
    ...overrides,
  };
}

afterEach(() => {
  rmSync(tempOutputDir, { recursive: true, force: true });
});

describe("parseJudgeVerdict", () => {
  it("parses and enforces pass threshold + evidence floor", () => {
    const raw = JSON.stringify(
      baseVerdict({
        overall_score: 8,
        pass: true,
        dimensions: {
          relevance: { score: 8, critique: "Strong." },
          evidence_alignment: { score: 6, critique: "Thin evidence." },
          coverage: { score: 8, critique: "Good." },
          clarity: { score: 8, critique: "Clear." },
        },
      }),
    );

    const verdict = parseJudgeVerdict(raw, 7);
    expect(verdict.overall_score).toBe(8);
    // evidence_alignment < 7 forces fail even if model said pass
    expect(verdict.pass).toBe(false);
  });

  it("extracts JSON from fenced model output", () => {
    const raw = "```json\n" + JSON.stringify(baseVerdict({ overall_score: 8, pass: true })) + "\n```";
    const verdict = parseJudgeVerdict(raw, 7);
    expect(verdict.overall_score).toBe(8);
    expect(verdict.pass).toBe(true);
  });
});

describe("applyJudgeRevision", () => {
  it("reorders accomplishments and ignores unknown IDs", () => {
    const data = loadResumeData();
    const tailor = tailorResumeForJobDescription(data, makeJobDescription());
    const ids = tailor.version.accomplishment_ids;
    expect(ids.length).toBeGreaterThan(1);

    const last = ids[ids.length - 1];
    const first = ids[0];
    const verdict = baseVerdict({
      revision_directives: {
        prioritize_accomplishment_ids: [last, "not-a-real-id"],
        demote_accomplishment_ids: [first],
        emphasize_skills: ["Cypress", "NotASkill"],
        notes: ["test"],
      },
    });

    const result = applyJudgeRevision(data, tailor.version, verdict, { round: 1 });
    expect(result.version.accomplishment_ids[0]).toBe(last);
    expect(result.version.accomplishment_ids.at(-1)).toBe(first);
    expect(result.applied.ignoredAccomplishmentIds).toContain("not-a-real-id");
    expect(result.applied.ignoredSkillNames).toContain("NotASkill");
    expect(result.version.skill_emphasis?.[0]).toBe("Cypress");
    expect(result.version.application_fit?.overall).toContain("Partial fit");
    expect(result.changed).toBe(true);
  });

  it("does not invent new accomplishment IDs", () => {
    const data = loadResumeData();
    const tailor = tailorResumeForJobDescription(data, makeJobDescription());
    const before = new Set(tailor.version.accomplishment_ids);
    const verdict = baseVerdict({
      revision_directives: {
        prioritize_accomplishment_ids: ["fabricated-accomplishment"],
      },
    });
    const result = applyJudgeRevision(data, tailor.version, verdict, { round: 1 });
    expect(result.version.accomplishment_ids.every((id) => before.has(id))).toBe(true);
    expect(result.version.accomplishment_ids).toHaveLength(before.size);
  });
});

describe("stub judge + loop", () => {
  it("builds evidence from tailored output without inventing IDs", () => {
    const data = loadResumeData();
    const tailor = tailorResumeForJobDescription(data, makeJobDescription());
    const evidence = buildJudgeEvidence(data, tailor, "# Fake Resume\n\n## Experience\n");
    expect(evidence.selectedAccomplishments.length).toBe(
      tailor.version.accomplishment_ids.length,
    );
    expect(evidence.currentAccomplishmentOrder).toEqual(tailor.version.accomplishment_ids);
  });

  it("runs evaluateResumeWithJudge via stub client", async () => {
    const data = loadResumeData();
    const tailor = tailorResumeForJobDescription(data, makeJobDescription());
    const evidence = buildJudgeEvidence(data, tailor, "# Resume\n\n## Experience\n");
    const result = await evaluateResumeWithJudge(evidence, {
      client: createStubJudgeClient(data),
      passScore: 7,
      round: 1,
    });
    expect(result.verdict.overall_score).toBeGreaterThanOrEqual(1);
    expect(result.verdict.application_fit.strengths.length).toBeGreaterThanOrEqual(1);
    expect(result.verdict.application_fit.weaknesses.length).toBeGreaterThanOrEqual(1);
  });

  it("runs a multi-round judge loop with a scripted client", async () => {
    const data = loadResumeData();
    mkdirSync(tempOutputDir, { recursive: true });

    let calls = 0;
    const client: LlmClient = {
      async complete() {
        calls += 1;
        const tailor = tailorResumeForJobDescription(data, makeJobDescription());
        const ids = tailor.version.accomplishment_ids;
        if (calls === 1) {
          return JSON.stringify(
            baseVerdict({
              overall_score: 6,
              pass: false,
              revision_directives: {
                prioritize_accomplishment_ids: [ids[ids.length - 1]],
                demote_accomplishment_ids: [ids[0]],
                emphasize_skills: ["Cypress"],
                notes: ["Round 1 critique"],
              },
            }),
          );
        }
        return JSON.stringify(
          baseVerdict({
            overall_score: 8,
            pass: true,
            dimensions: {
              relevance: { score: 8, critique: "Improved ordering." },
              evidence_alignment: { score: 8, critique: "Still grounded." },
              coverage: { score: 8, critique: "Better." },
              clarity: { score: 8, critique: "Clear." },
            },
            revision_directives: { notes: ["Looks good."] },
          }),
        );
      },
    };

    const result = await runJudgeLoop(
      data,
      makeJobDescription(),
      { slug: "judge-test-role" },
      {
        client,
        maxRounds: 2,
        passScore: 7,
        outputDir: tempOutputDir,
        writeDebug: false,
      },
    );

    expect(calls).toBe(2);
    expect(result.passed).toBe(true);
    expect(result.rounds).toHaveLength(2);
    expect(result.rounds[0].revised).toBe(true);
    expect(result.finalVersion.application_fit?.overall).toBeTruthy();

    const report = readFileSync(result.rounds[0].judgeReportPath, "utf8");
    expect(report).toContain("# LLM Judge Evaluation Report");
    expect(report).toContain("Revision Directives");

    const resume = readFileSync(result.finalMarkdownPath, "utf8");
    expect(resume).toContain("Application Fit");
  });

  it("renders a judge report from a verdict", () => {
    const data = loadResumeData();
    const tailor = tailorResumeForJobDescription(data, makeJobDescription());
    const report = buildJudgeReport(
      {
        verdict: baseVerdict(),
        rawResponse: "{}",
        evidence: buildJudgeEvidence(data, tailor, "# Resume"),
        model: "test-model",
        round: 1,
      },
      makeJobDescription(),
      tailor.version,
    );
    expect(report).toContain("Dimension Scores");
    expect(report).toContain("Application Fit");
  });
});
