import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generateAllPdfs } from "../scripts/generate-pdf.js";
import { generatePortfolioJson } from "../scripts/generate-portfolio-json.js";
import { generateAllResumes } from "../scripts/generate-resume.js";
import { findChromeExecutable } from "../scripts/lib/chrome.js";
import { PORTFOLIO_FACETS } from "../scripts/lib/portfolio-facets.js";
import { PORTFOLIO_OUTPUT_DIR, RESUMES_OUTPUT_DIR } from "../scripts/lib/paths.js";

function hasLocalChrome(): boolean {
  try {
    findChromeExecutable();
    return true;
  } catch {
    return false;
  }
}

describe("generation", () => {
  it("generates markdown and HTML résumés for all versions", async () => {
    const { paths, results } = await generateAllResumes({
      stub: true,
      writeDebug: false,
      writeLog: false,
    });

    expect(paths.length).toBeGreaterThanOrEqual(6);
    expect(results.every((result) => result.judged)).toBe(true);

    for (const path of paths) {
      expect(existsSync(path)).toBe(true);
      const content = readFileSync(path, "utf8");
      expect(content.length).toBeGreaterThan(100);
    }

    expect(existsSync(`${RESUMES_OUTPUT_DIR}/frontend/tyler-stahl-frontend-engineer.md`)).toBe(
      true,
    );
    expect(existsSync(`${RESUMES_OUTPUT_DIR}/frontend/tyler-stahl-frontend-engineer.html`)).toBe(
      true,
    );
    expect(existsSync(`${RESUMES_OUTPUT_DIR}/nonprofit/tyler-stahl-nonprofit-tech.md`)).toBe(
      true,
    );
    expect(existsSync(`${RESUMES_OUTPUT_DIR}/nonprofit/tyler-stahl-nonprofit-tech.html`)).toBe(
      true,
    );
  });

  it("generates portfolio JSON with expected structure", () => {
    const outputPath = generatePortfolioJson();
    expect(existsSync(outputPath)).toBe(true);

    const json = JSON.parse(readFileSync(outputPath, "utf8"));

    expect(json.name).toBe("Tyler Stahl");
    expect(json.targetId).toBe("portfolio-focused");
    expect(json.versionId).toBe("portfolio-v1");
    expect(json.featuredProjects).toBeInstanceOf(Array);
    expect(json.skills).toBeInstanceOf(Array);
    expect(json.experience).toBeInstanceOf(Array);
    expect(json.selectedAccomplishments).toBeInstanceOf(Array);
    expect(json.featuredProjects.length).toBeGreaterThan(0);
    for (const project of json.featuredProjects) {
      expect(project.portfolioVisible).toBe(true);
    }
  });

  it("exports every project with a portfolio headline and exactly one featured", () => {
    const json = JSON.parse(readFileSync(generatePortfolioJson(), "utf8"));

    for (const project of json.featuredProjects) {
      expect(project.portfolioHeadline?.length).toBeGreaterThan(0);
      expect(project.portfolioLinks).toBeInstanceOf(Array);
      expect(typeof project.portfolioFeatured).toBe("boolean");
    }

    const featured = json.featuredProjects.filter(
      (project: { portfolioFeatured: boolean }) => project.portfolioFeatured,
    );
    expect(featured).toHaveLength(1);
    expect(featured[0].id).toBe("cognitive-bridge");
  });

  // The portfolio export emitted zero skills for as long as it filtered on
  // target_roles against "portfolio-focused", a target no skill lists.
  it("exports a non-empty flat skill list covering every facet", () => {
    const json = JSON.parse(readFileSync(generatePortfolioJson(), "utf8"));

    expect(json.skills.length).toBeGreaterThan(0);

    for (const skill of json.skills) {
      expect(skill.name?.length).toBeGreaterThan(0);
      expect(skill.facets.length).toBeGreaterThan(0);
    }

    const covered = new Set(
      json.skills.flatMap((skill: { facets: string[] }) => skill.facets),
    );
    for (const facet of PORTFOLIO_FACETS) {
      expect(covered).toContain(facet);
    }
  });
});

describe.skipIf(!hasLocalChrome())("PDF export", () => {
  it("generates a valid PDF for every résumé version", async () => {
    const paths = await generateAllPdfs();

    expect(paths.length).toBeGreaterThanOrEqual(2);

    for (const path of paths) {
      expect(existsSync(path)).toBe(true);
      const buffer = readFileSync(path);
      expect(buffer.subarray(0, 5).toString("utf8")).toBe("%PDF-");
      expect(buffer.length).toBeGreaterThan(1000);
    }
    // Budget scales with resume_versions.yaml: this renders one headless-Chrome
    // PDF per curated version (~3.4s each on a CI runner). At 9 versions the old
    // 30s cap was already marginal — it passed on main and failed on a docs-only
    // PR at 30286ms — and every version added pushes it further over. Keep this
    // generous so adding a résumé version doesn't turn CI red for timing alone.
  }, 120000);
});
