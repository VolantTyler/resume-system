import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { JOB_DESCRIPTIONS_DIR } from "../scripts/lib/paths.js";
import { loadResumeData } from "../scripts/lib/load-data.js";
import { resumeVersionSchema } from "../scripts/lib/schemas.js";
import {
  buildMatchReport,
  extractMatchedTerms,
  findGapTerms,
  rankTargets,
  readJobDescriptionTitle,
  tailorResumeForJobDescription,
  type JobDescription,
} from "../scripts/lib/tailor.js";

const exampleJobPath = join(JOB_DESCRIPTIONS_DIR, "example-nonprofit-qa-frontend.md");
const exampleJobText = readFileSync(exampleJobPath, "utf8");

function makeJobDescription(text: string, sourcePath = "test.md"): JobDescription {
  return { sourcePath, title: readJobDescriptionTitle(sourcePath, text), text };
}

describe("term extraction", () => {
  it("finds known résumé terms in job description text", () => {
    const data = loadResumeData();
    const terms = extractMatchedTerms(exampleJobText, data).map((match) =>
      match.term.toLowerCase(),
    );

    expect(terms).toContain("cypress");
    expect(terms).toContain("laravel");
    expect(terms).toContain("livewire");
    expect(terms).toContain("alpine.js");
    expect(terms).toContain("release reliability");
  });

  it("does not match terms that aren't present in the text", () => {
    const data = loadResumeData();
    const terms = extractMatchedTerms(
      "We are hiring a generalist with strong communication skills.",
      data,
    ).map((match) => match.term.toLowerCase());

    expect(terms).not.toContain("cypress");
    expect(terms).not.toContain("laravel");
    expect(terms).not.toContain("livewire");
  });

  it("requires whole-word boundaries, not partial substrings", () => {
    const data = loadResumeData();
    // "testing" should not falsely satisfy the "test documentation" phrase term.
    const terms = extractMatchedTerms("We value testing culture.", data).map((match) =>
      match.term.toLowerCase(),
    );
    expect(terms).not.toContain("test documentation");
  });
});

describe("target ranking", () => {
  it("scores every target and ranks Cypress/nonprofit-flavored targets above unrelated ones", () => {
    const data = loadResumeData();
    const matches = extractMatchedTerms(exampleJobText, data);
    const ranking = rankTargets(data, matches);

    expect(ranking).toHaveLength(data.resumeTargets.length);
    expect(ranking[0].score).toBeGreaterThan(0);

    const rankedIds = ranking.map((entry) => entry.target.id);
    const qaIndex = rankedIds.indexOf("qa-minded-frontend");
    const portfolioIndex = rankedIds.indexOf("portfolio-focused");

    expect(qaIndex).toBeGreaterThanOrEqual(0);
    expect(portfolioIndex).toBeGreaterThanOrEqual(0);
    expect(qaIndex).toBeLessThan(portfolioIndex);
  });

  it("returns zero scores for a job description with no known terms", () => {
    const data = loadResumeData();
    const matches = extractMatchedTerms("Totally unrelated text with no overlap at all.", data);
    const ranking = rankTargets(data, matches);

    for (const entry of ranking) {
      expect(entry.score).toBe(0);
    }
  });
});

describe("tailored version building", () => {
  it("builds a schema-valid tailored résumé version", () => {
    const data = loadResumeData();
    const jobDescription = makeJobDescription(exampleJobText, exampleJobPath);
    const result = tailorResumeForJobDescription(data, jobDescription);

    expect(() => resumeVersionSchema.parse(result.version)).not.toThrow();
    expect(result.version.target_id).toBe(result.target.id);
    expect(result.version.accomplishment_ids.length).toBeGreaterThan(0);
    expect(result.version.experience_ids.length).toBeGreaterThan(0);
    expect(result.version.output_slug).toMatch(/^tailored-/);
  });

  it("orders accomplishments by relevance score, most relevant first", () => {
    const data = loadResumeData();
    const jobDescription = makeJobDescription(exampleJobText, exampleJobPath);
    const result = tailorResumeForJobDescription(data, jobDescription);

    // nami-platform-maintenance has the fewest JD-matching themes/technologies
    // among accomplishments linked to the recommended target, so it should not
    // be ranked first when other, more relevant accomplishments are included.
    const ids = result.version.accomplishment_ids;
    if (ids.includes("nami-platform-maintenance") && ids.length > 1) {
      expect(ids.indexOf("nami-platform-maintenance")).toBeGreaterThan(0);
    }
  });

  it("honors an explicit target override", () => {
    const data = loadResumeData();
    const jobDescription = makeJobDescription(exampleJobText, exampleJobPath);
    const result = tailorResumeForJobDescription(data, jobDescription, {
      targetId: "ui-engineer",
    });

    expect(result.target.id).toBe("ui-engineer");
    expect(result.version.target_id).toBe("ui-engineer");
  });

  it("throws for an unknown target override", () => {
    const data = loadResumeData();
    const jobDescription = makeJobDescription(exampleJobText, exampleJobPath);

    expect(() =>
      tailorResumeForJobDescription(data, jobDescription, { targetId: "does-not-exist" }),
    ).toThrow(/Unknown target/);
  });
});

describe("gap detection", () => {
  it("flags reference terms mentioned in the JD but absent from résumé data", () => {
    const data = loadResumeData();
    const matches = extractMatchedTerms(exampleJobText, data);
    const gaps = findGapTerms(exampleJobText, matches);

    expect(gaps).toContain("WCAG");
  });

  it("does not flag reference terms that aren't mentioned in the JD", () => {
    const data = loadResumeData();
    const matches = extractMatchedTerms(exampleJobText, data);
    const gaps = findGapTerms(exampleJobText, matches);

    expect(gaps).not.toContain("React");
    expect(gaps).not.toContain("Docker");
  });
});

describe("job description title extraction", () => {
  it("uses the first Markdown heading as the title", () => {
    expect(readJobDescriptionTitle("x.md", "# Senior Engineer\n\nBody text.")).toBe(
      "Senior Engineer",
    );
  });

  it("falls back to a formatted filename when there is no heading", () => {
    expect(readJobDescriptionTitle("docs/job-descriptions/senior-role.md", "No heading here.")).toBe(
      "senior role",
    );
  });
});

describe("match report", () => {
  it("includes all key sections", () => {
    const data = loadResumeData();
    const jobDescription = makeJobDescription(exampleJobText, exampleJobPath);
    const result = tailorResumeForJobDescription(data, jobDescription);
    const report = buildMatchReport(result);

    expect(report).toContain("# Job Description Match Report");
    expect(report).toContain("## Recommended Target");
    expect(report).toContain("## Target Ranking");
    expect(report).toContain("## Matched Terms");
    expect(report).toContain("## Selected Accomplishments");
    expect(report).toContain("## Possible Gaps");
    expect(report).toContain("WCAG");
  });
});
