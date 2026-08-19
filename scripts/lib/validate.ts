import { z } from "zod";
import { findPortfolioVersion } from "./build-resume-context.js";
import { loadResumeData } from "./load-data.js";
import { PORTFOLIO_FACETS, resolveSkillFacets } from "./portfolio-facets.js";
import type { ResumeData, ValidationIssue } from "./schemas.js";

function collectUniqueIds(ids: string[], label: string): ValidationIssue[] {
  const seen = new Set<string>();
  const issues: ValidationIssue[] = [];

  for (const id of ids) {
    if (seen.has(id)) {
      issues.push({ path: label, message: `Duplicate ID "${id}"` });
    }
    seen.add(id);
  }

  return issues;
}

/**
 * A project reaches the portfolio site only when it is marked `portfolio_visible: true`
 * *and* listed in the portfolio version's `project_ids`. Miss the second half and the
 * project is filtered out of the export with no error — the card simply never renders.
 * This turns that silence into a failed build.
 *
 * The reverse is legitimate and deliberately not flagged: a project may sit in
 * `project_ids` with `portfolio_visible: false`, which is how projects are parked for
 * later without editing the version.
 */
export function validatePortfolioVisibility(data: ResumeData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const version = findPortfolioVersion(data);

  if (!version) {
    return issues;
  }

  const selectedProjectIds = new Set(version.project_ids ?? []);

  for (const project of data.projects) {
    if (project.portfolio_visible === true && !selectedProjectIds.has(project.id)) {
      issues.push({
        path: `projects.${project.id}.portfolio_visible`,
        message:
          `Project is marked portfolio_visible: true but is missing from ` +
          `resume_versions.${version.id}.project_ids, so it would be dropped from the ` +
          `portfolio export without warning. Add it to project_ids, or set ` +
          `portfolio_visible: false.`,
      });
    }
  }

  return issues;
}

/**
 * Exactly one project may be `portfolio_featured` — the site gives that project the
 * large hero block, so a second one has nowhere to render.
 */
export function validatePortfolioFeatured(data: ResumeData): ValidationIssue[] {
  const featured = data.projects.filter(
    (project) => project.portfolio_featured === true,
  );

  if (featured.length <= 1) {
    return [];
  }

  return featured.map((project) => ({
    path: `projects.${project.id}.portfolio_featured`,
    message:
      `Only one project may be portfolio_featured: true, but ${featured.length} are ` +
      `(${featured.map((item) => item.id).join(", ")}). Clear the flag on all but one.`,
  }));
}

/**
 * Every skill must resolve to at least one facet, or it renders in no facet filter
 * and disappears from the site without an error. Categories outside the four-facet
 * vocabulary — Testing — have nothing to inherit, so skills there
 * must tag `portfolio_facets` explicitly. `npm run classify-skills` proposes them.
 */
export function validateSkillFacets(data: ResumeData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const category of data.skills.categories) {
    for (const skill of category.skills) {
      if (resolveSkillFacets(skill, category.name).length === 0) {
        issues.push({
          path: `skills.${category.name}.${skill.name}.portfolio_facets`,
          message:
            `Skill resolves to no portfolio facet: category "${category.name}" has no ` +
            `default facet and the skill sets none. Add portfolio_facets from ` +
            `[${PORTFOLIO_FACETS.join(", ")}] — see npm run classify-skills.`,
        });
      }
    }
  }

  return issues;
}

function validateCrossReferences(data: ResumeData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const accomplishmentIds = new Set(data.accomplishments.map((item) => item.id));
  const projectIds = new Set(data.projects.map((item) => item.id));
  const experienceIds = new Set(data.experience.map((item) => item.id));
  const targetIds = new Set(data.resumeTargets.map((item) => item.id));
  const summaryVariants = new Set(Object.keys(data.profile.summary_variants));

  for (const role of data.experience) {
    for (const id of role.accomplishment_ids) {
      if (!accomplishmentIds.has(id)) {
        issues.push({
          path: `experience.${role.id}.accomplishment_ids`,
          message: `Unknown accomplishment ID "${id}"`,
        });
      }
    }
    for (const id of role.project_ids ?? []) {
      if (!projectIds.has(id)) {
        issues.push({
          path: `experience.${role.id}.project_ids`,
          message: `Unknown project ID "${id}"`,
        });
      }
    }
  }

  for (const project of data.projects) {
    for (const id of project.related_accomplishment_ids ?? []) {
      if (!accomplishmentIds.has(id)) {
        issues.push({
          path: `projects.${project.id}.related_accomplishment_ids`,
          message: `Unknown accomplishment ID "${id}"`,
        });
      }
    }
  }

  for (const category of data.skills.categories) {
    for (const skill of category.skills) {
      for (const id of skill.evidence_ids ?? []) {
        if (!accomplishmentIds.has(id)) {
          issues.push({
            path: `skills.${category.name}.${skill.name}.evidence_ids`,
            message: `Unknown accomplishment ID "${id}"`,
          });
        }
      }
    }
  }

  for (const target of data.resumeTargets) {
    if (!summaryVariants.has(target.summary_variant)) {
      issues.push({
        path: `resume_targets.${target.id}.summary_variant`,
        message: `Unknown summary variant "${target.summary_variant}"`,
      });
    }
  }

  for (const version of data.resumeVersions) {
    if (!targetIds.has(version.target_id)) {
      issues.push({
        path: `resume_versions.${version.id}.target_id`,
        message: `Unknown target ID "${version.target_id}"`,
      });
    }

    if (!summaryVariants.has(version.summary_variant)) {
      issues.push({
        path: `resume_versions.${version.id}.summary_variant`,
        message: `Unknown summary variant "${version.summary_variant}"`,
      });
    }

    for (const id of version.experience_ids) {
      if (!experienceIds.has(id)) {
        issues.push({
          path: `resume_versions.${version.id}.experience_ids`,
          message: `Unknown experience ID "${id}"`,
        });
      }
    }

    for (const id of version.accomplishment_ids) {
      if (!accomplishmentIds.has(id)) {
        issues.push({
          path: `resume_versions.${version.id}.accomplishment_ids`,
          message: `Unknown accomplishment ID "${id}"`,
        });
      }
    }

    for (const id of version.project_ids ?? []) {
      if (!projectIds.has(id)) {
        issues.push({
          path: `resume_versions.${version.id}.project_ids`,
          message: `Unknown project ID "${id}"`,
        });
      }
    }

    if (version.accomplishment_ids.length === 0) {
      issues.push({
        path: `resume_versions.${version.id}`,
        message: "Résumé version must include at least one accomplishment",
      });
    }

    if (version.experience_ids.length === 0) {
      issues.push({
        path: `resume_versions.${version.id}`,
        message: "Résumé version must include at least one experience entry",
      });
    }

    if (!version.output_slug.trim()) {
      issues.push({
        path: `resume_versions.${version.id}.output_slug`,
        message: "output_slug must not be empty",
      });
    }
  }

  for (const accomplishment of data.accomplishments) {
    for (const roleId of accomplishment.target_roles) {
      if (!targetIds.has(roleId)) {
        issues.push({
          path: `accomplishments.${accomplishment.id}.target_roles`,
          message: `Unknown target role "${roleId}"`,
        });
      }
    }
  }

  return issues;
}

export function validateResumeData(): ValidationIssue[] {
  let data: ResumeData;

  try {
    data = loadResumeData();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues.map((issue) => ({
        path: issue.path.join(".") || "root",
        message: issue.message,
      }));
    }
    throw error;
  }

  const issues: ValidationIssue[] = [
    ...collectUniqueIds(
      data.accomplishments.map((item) => item.id),
      "accomplishments",
    ),
    ...collectUniqueIds(
      data.projects.map((item) => item.id),
      "projects",
    ),
    ...collectUniqueIds(
      data.experience.map((item) => item.id),
      "experience",
    ),
    ...collectUniqueIds(
      data.resumeTargets.map((item) => item.id),
      "resume_targets",
    ),
    ...collectUniqueIds(
      data.resumeVersions.map((item) => item.id),
      "resume_versions",
    ),
    ...validateCrossReferences(data),
    ...validatePortfolioVisibility(data),
    ...validatePortfolioFeatured(data),
    ...validateSkillFacets(data),
  ];

  return issues;
}

export function assertValidResumeData(): ResumeData {
  const issues = validateResumeData();
  if (issues.length > 0) {
    const formatted = issues
      .map((issue) => `  - [${issue.path}] ${issue.message}`)
      .join("\n");
    throw new Error(`Résumé data validation failed:\n${formatted}`);
  }
  return loadResumeData();
}
