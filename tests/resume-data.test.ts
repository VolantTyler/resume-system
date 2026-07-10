import { describe, expect, it } from "vitest";
import { buildResumeContext } from "../scripts/lib/build-resume-context.js";
import { loadResumeData } from "../scripts/lib/load-data.js";
import { validateResumeData } from "../scripts/lib/validate.js";

describe("resume data validation", () => {
  it("passes validation for starter data", () => {
    const issues = validateResumeData();
    expect(issues).toEqual([]);
  });

  it("loads all required YAML files", () => {
    const data = loadResumeData();
    expect(data.profile.name).toBe("Tyler Stahl");
    expect(data.accomplishments.length).toBeGreaterThan(0);
    expect(data.resumeVersions.length).toBeGreaterThan(0);
  });
});

describe("resume context building", () => {
  it("selects role-specific bullet variants for frontend engineer", () => {
    const data = loadResumeData();
    const version = data.resumeVersions.find(
      (item) => item.target_id === "frontend-engineer",
    );

    expect(version).toBeDefined();

    const context = buildResumeContext(data, version!);
    const allBullets = context.experience.flatMap((role) => role.bullets);
    const cypressBullet = allBullets.find(
      (bullet) =>
        bullet.includes("Cypress coverage") || bullet.includes("Cypress"),
    );

    expect(cypressBullet).toBeTruthy();
    expect(context.summary.toLowerCase()).toContain("front-end");
  });

  it("selects nonprofit bullet variants for nonprofit target", () => {
    const data = loadResumeData();
    const version = data.resumeVersions.find(
      (item) => item.target_id === "nonprofit-tech",
    );

    expect(version).toBeDefined();

    const context = buildResumeContext(data, version!);
    const allBullets = context.experience.flatMap((role) => role.bullets);
    const nonprofitBullet = allBullets.find((bullet) =>
      bullet.toLowerCase().includes("nonprofit"),
    );

    expect(nonprofitBullet).toBeTruthy();
    expect(context.summary.toLowerCase()).toContain("nonprofit");
  });

  it("includes application fit when configured on a resume version", () => {
    const data = loadResumeData();
    const version = data.resumeVersions.find(
      (item) => item.id === "tyler-stahl-deloitte-fde-frontier-genai",
    );

    expect(version).toBeDefined();
    expect(version?.application_fit).toBeDefined();

    const context = buildResumeContext(data, version!);
    expect(context.application_fit?.strengths.length).toBeGreaterThanOrEqual(2);
    expect(context.application_fit?.weaknesses.length).toBeGreaterThanOrEqual(2);
  });
});
