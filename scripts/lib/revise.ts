import type { ResumeData, ResumeVersion } from "./schemas.js";
import type { JudgeVerdict, RevisionDirectives } from "./judge.js";

export interface ReviseOptions {
  round: number;
  /**
   * How to handle application_fit from the verdict:
   * - "always" — overwrite with judge fit
   * - "if-missing" — only attach when the version has no fit yet (default for curated generate)
   * - "never" — leave version.application_fit unchanged
   */
  applicationFitMode?: "always" | "if-missing" | "never";
  /** When false, skip prioritize/demote/skill directive application. Default true. */
  applyDirectives?: boolean;
  /** @deprecated Prefer applicationFitMode. When true, behaves like "always". */
  attachApplicationFit?: boolean;
}

export interface ReviseResult {
  version: ResumeVersion;
  applied: {
    prioritized: string[];
    demoted: string[];
    emphasizedSkills: string[];
    deEmphasizedSkills: string[];
    ignoredAccomplishmentIds: string[];
    ignoredSkillNames: string[];
  };
  changed: boolean;
}

function uniquePreserveOrder(ids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  return result;
}

function knownSkillNameSet(data: ResumeData): Map<string, string> {
  const map = new Map<string, string>();
  for (const category of data.skills.categories) {
    for (const skill of category.skills) {
      map.set(skill.name.toLowerCase(), skill.name);
    }
  }
  return map;
}

/**
 * Apply claim-safe revision directives to a résumé version.
 *
 * Allowed changes:
 * - Reorder existing accomplishment_ids (prioritize / demote)
 * - Adjust skill_emphasis using only known skill names
 * - Attach application_fit from the judge verdict
 * - Append revision_history
 *
 * Never invents accomplishments, bullets, metrics, or skills.
 */
export function applyJudgeRevision(
  data: ResumeData,
  version: ResumeVersion,
  verdict: JudgeVerdict,
  options: ReviseOptions,
): ReviseResult {
  const directives: RevisionDirectives =
    options.applyDirectives === false ? {} : (verdict.revision_directives ?? {});
  const allowedIds = new Set(version.accomplishment_ids);
  const skillNames = knownSkillNameSet(data);

  const ignoredAccomplishmentIds: string[] = [];
  const ignoredSkillNames: string[] = [];

  const prioritize = (directives.prioritize_accomplishment_ids ?? []).filter((id) => {
    if (!allowedIds.has(id)) {
      ignoredAccomplishmentIds.push(id);
      return false;
    }
    return true;
  });

  const demote = (directives.demote_accomplishment_ids ?? []).filter((id) => {
    if (!allowedIds.has(id)) {
      ignoredAccomplishmentIds.push(id);
      return false;
    }
    return true;
  });

  const demoteSet = new Set(demote.filter((id) => !prioritize.includes(id)));
  const remaining = version.accomplishment_ids.filter(
    (id) => !prioritize.includes(id) && !demoteSet.has(id),
  );
  const nextAccomplishmentIds = uniquePreserveOrder([
    ...prioritize,
    ...remaining,
    ...[...demoteSet],
  ]);

  const currentEmphasis = [...(version.skill_emphasis ?? [])];
  const emphasize = (directives.emphasize_skills ?? [])
    .map((name) => {
      const canonical = skillNames.get(name.toLowerCase());
      if (!canonical) {
        ignoredSkillNames.push(name);
        return undefined;
      }
      return canonical;
    })
    .filter((name): name is string => Boolean(name));

  const deEmphasize = new Set(
    (directives.de_emphasize_skills ?? [])
      .map((name) => {
        const canonical = skillNames.get(name.toLowerCase());
        if (!canonical) {
          ignoredSkillNames.push(name);
          return undefined;
        }
        return canonical.toLowerCase();
      })
      .filter((name): name is string => Boolean(name)),
  );

  const nextEmphasis = uniquePreserveOrder([
    ...emphasize,
    ...currentEmphasis.filter((name) => !deEmphasize.has(name.toLowerCase())),
  ]);

  const fitMode: NonNullable<ReviseOptions["applicationFitMode"]> =
    options.applicationFitMode ??
    (options.attachApplicationFit === false
      ? "never"
      : options.attachApplicationFit === true
        ? "always"
        : "always");

  let nextApplicationFit = version.application_fit;
  if (fitMode === "always") {
    nextApplicationFit = verdict.application_fit;
  } else if (fitMode === "if-missing" && !version.application_fit) {
    nextApplicationFit = verdict.application_fit;
  }

  const accomplishmentChanged =
    nextAccomplishmentIds.join("\0") !== version.accomplishment_ids.join("\0");
  const emphasisChanged =
    nextEmphasis.join("\0") !== currentEmphasis.join("\0");
  const fitChanged =
    JSON.stringify(nextApplicationFit ?? null) !== JSON.stringify(version.application_fit ?? null);

  const changed = accomplishmentChanged || emphasisChanged || fitChanged;

  const history = [...(version.revision_history ?? [])];
  if (changed) {
    const noteParts = [
      `LLM judge revision round ${options.round} (score ${verdict.overall_score}/10)`,
    ];
    if (prioritize.length > 0) {
      noteParts.push(`prioritized: ${prioritize.join(", ")}`);
    }
    if (demoteSet.size > 0) {
      noteParts.push(`demoted: ${[...demoteSet].join(", ")}`);
    }
    if (emphasize.length > 0) {
      noteParts.push(`emphasized skills: ${emphasize.join(", ")}`);
    }
    history.push({
      date: new Date().toISOString().slice(0, 10),
      note: noteParts.join("; "),
    });
  }

  // Preserve curated experience/project selection unless the accomplishment *set* changes.
  // Reordering alone must not reshuffle roles/projects away from the YAML version.
  const previousSet = new Set(version.accomplishment_ids);
  const nextSet = new Set(nextAccomplishmentIds);
  const accomplishmentSetChanged =
    previousSet.size !== nextSet.size ||
    [...previousSet].some((id) => !nextSet.has(id));

  let experienceIds = version.experience_ids;
  let projectIds = version.project_ids;
  if (accomplishmentSetChanged) {
    experienceIds = data.experience
      .filter((role) => role.accomplishment_ids.some((id) => nextSet.has(id)))
      .map((role) => role.id);
    const recomputedProjects = data.projects
      .filter((project) =>
        (project.related_accomplishment_ids ?? []).some((id) => nextSet.has(id)),
      )
      .map((project) => project.id);
    projectIds = recomputedProjects.length > 0 ? recomputedProjects : undefined;
  }

  const nextVersion: ResumeVersion = {
    ...version,
    accomplishment_ids: nextAccomplishmentIds,
    experience_ids: experienceIds,
    project_ids: projectIds,
    skill_emphasis: nextEmphasis.length > 0 ? nextEmphasis : undefined,
    application_fit: nextApplicationFit,
    revision_history: history,
  };

  return {
    version: nextVersion,
    applied: {
      prioritized: prioritize,
      demoted: [...demoteSet],
      emphasizedSkills: emphasize,
      deEmphasizedSkills: [...deEmphasize],
      ignoredAccomplishmentIds: uniquePreserveOrder(ignoredAccomplishmentIds),
      ignoredSkillNames: uniquePreserveOrder(ignoredSkillNames),
    },
    changed,
  };
}
