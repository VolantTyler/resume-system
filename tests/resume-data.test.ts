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
    const cypressBullet = context.experience[0]?.bullets.find((bullet) =>
      bullet.includes("Cypress coverage"),
    );

    expect(cypressBullet).toBeTruthy();
    expect(context.summary).toContain("Front-end engineer");
  });

  it("selects nonprofit bullet variants for nonprofit target", () => {
    const data = loadResumeData();
    const version = data.resumeVersions.find(
      (item) => item.target_id === "nonprofit-tech",
    );

    expect(version).toBeDefined();

    const context = buildResumeContext(data, version!);
    const nonprofitBullet = context.experience[0]?.bullets.find((bullet) =>
      bullet.toLowerCase().includes("nonprofit"),
    );

    expect(nonprofitBullet).toBeTruthy();
    expect(context.summary.toLowerCase()).toContain("nonprofit");
  });
});
