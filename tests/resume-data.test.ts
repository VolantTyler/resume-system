import { describe, expect, it } from "vitest";
import {
  buildResumeContext,
  findPortfolioVersion,
} from "../scripts/lib/build-resume-context.js";
import { loadResumeData } from "../scripts/lib/load-data.js";
import {
  validatePortfolioVisibility,
  validateResumeData,
} from "../scripts/lib/validate.js";

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

describe("portfolio visibility validation", () => {
  it("errors when a portfolio_visible project is missing from the portfolio version", () => {
    const data = loadResumeData();
    const version = findPortfolioVersion(data);

    expect(version).toBeDefined();

    const orphan = data.projects.find(
      (project) => !(version!.project_ids ?? []).includes(project.id),
    );

    expect(orphan).toBeDefined();

    const issues = validatePortfolioVisibility({
      ...data,
      projects: data.projects.map((project) =>
        project.id === orphan!.id
          ? { ...project, portfolio_visible: true }
          : project,
      ),
    });

    expect(issues).toHaveLength(1);
    expect(issues[0].path).toBe(`projects.${orphan!.id}.portfolio_visible`);
    expect(issues[0].message).toContain("project_ids");
  });

  it("allows a project in the portfolio version to be parked with portfolio_visible: false", () => {
    const data = loadResumeData();
    const version = findPortfolioVersion(data);

    expect(version).toBeDefined();

    // Park a project that is currently listed *and* visible, so the flip is a real
    // state change rather than a no-op on an already-hidden project.
    const parked = data.projects.find(
      (project) =>
        project.portfolio_visible === true &&
        (version!.project_ids ?? []).includes(project.id),
    );

    expect(parked).toBeDefined();

    const issues = validatePortfolioVisibility({
      ...data,
      projects: data.projects.map((project) =>
        project.id === parked!.id
          ? { ...project, portfolio_visible: false }
          : project,
      ),
    });

    expect(issues).toEqual([]);
  });

  it("reports no issues for the committed data", () => {
    expect(validatePortfolioVisibility(loadResumeData())).toEqual([]);
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
      (item) => item.id === "tyler-stahl-google-fde-genai",
    );

    expect(version).toBeDefined();
    expect(version?.application_fit).toBeDefined();

    const context = buildResumeContext(data, version!);
    expect(context.application_fit?.strengths.length).toBeGreaterThanOrEqual(2);
    expect(context.application_fit?.weaknesses.length).toBeGreaterThanOrEqual(2);
  });
});
