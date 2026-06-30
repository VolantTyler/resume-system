import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generatePortfolioJson } from "../scripts/generate-portfolio-json.js";
import { generateAllResumes } from "../scripts/generate-resume.js";
import { PORTFOLIO_OUTPUT_DIR, RESUMES_OUTPUT_DIR } from "../scripts/lib/paths.js";

describe("generation", () => {
  it("generates markdown and HTML résumés for all versions", () => {
    const paths = generateAllResumes();

    expect(paths.length).toBeGreaterThanOrEqual(4);

    for (const path of paths) {
      expect(existsSync(path)).toBe(true);
      const content = readFileSync(path, "utf8");
      expect(content.length).toBeGreaterThan(100);
    }

    expect(existsSync(`${RESUMES_OUTPUT_DIR}/tyler-stahl-frontend-engineer.md`)).toBe(
      true,
    );
    expect(existsSync(`${RESUMES_OUTPUT_DIR}/tyler-stahl-frontend-engineer.html`)).toBe(
      true,
    );
    expect(existsSync(`${RESUMES_OUTPUT_DIR}/tyler-stahl-nonprofit-tech.md`)).toBe(
      true,
    );
    expect(existsSync(`${RESUMES_OUTPUT_DIR}/tyler-stahl-nonprofit-tech.html`)).toBe(
      true,
    );
  });

  it("generates portfolio JSON with expected structure", () => {
    const outputPath = generatePortfolioJson();
    expect(existsSync(outputPath)).toBe(true);

    const json = JSON.parse(readFileSync(outputPath, "utf8"));

    expect(json.name).toBe("Tyler Stahl");
    expect(json.featuredProjects).toBeInstanceOf(Array);
    expect(json.skills).toBeInstanceOf(Array);
    expect(json.experience).toBeInstanceOf(Array);
    expect(json.selectedAccomplishments).toBeInstanceOf(Array);
    expect(json.featuredProjects.length).toBeGreaterThan(0);
  });
});
