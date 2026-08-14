import { collectFacetedSkills } from "./portfolio-facets.js";
import type {
  Accomplishment,
  ApplicationFit,
  ExperienceEntry,
  PortfolioFacet,
  PortfolioLink,
  Profile,
  Project,
  ResumeData,
  ResumeTarget,
  ResumeVersion,
  SkillsData,
} from "./schemas.js";

export interface ResumeRoleContext {
  id: string;
  company: string;
  title: string;
  location?: string;
  start_date: string;
  end_date: string;
  role_summary?: string;
  technologies: string[];
  bullets: string[];
}

export interface ResumeProjectContext {
  id: string;
  name: string;
  organization: string;
  timeframe?: string;
  problem?: string;
  solution?: string;
  technologies: string[];
  outcomes: string[];
  portfolio_visible: boolean;
  portfolio_headline: string;
  portfolio_blurb?: string;
  portfolio_image?: string;
  portfolio_links: PortfolioLink[];
  portfolio_featured: boolean;
}

export interface ResumeSkillCategoryContext {
  name: string;
  skill_names: string[];
}

export interface PortfolioSkillContext {
  name: string;
  facets: PortfolioFacet[];
  proficiency?: string;
}

export interface ResumeAccomplishmentContext {
  id: string;
  company?: string;
  timeframe?: string;
  bullet: string;
  themes: string[];
  technologies: string[];
  confidence: string;
}

export interface ResumeRenderContext {
  profile: Profile;
  version: ResumeVersion;
  target: ResumeTarget;
  summary: string;
  application_fit?: ApplicationFit;
  experience: ResumeRoleContext[];
  projects: ResumeProjectContext[];
  skills: ResumeSkillCategoryContext[];
  /** Flat, facet-tagged skill list — populated only for the portfolio export. */
  portfolio_skills?: PortfolioSkillContext[];
  accomplishments: ResumeAccomplishmentContext[];
  generated_at: string;
}

function formatEndDate(value: string | undefined): string {
  if (!value || value === "present") {
    return "Present";
  }
  return value;
}

function selectBullet(
  accomplishment: Accomplishment,
  bulletVariant: string,
): string {
  const bullets = accomplishment.resume_bullets;
  if (bullets[bulletVariant]) {
    return bullets[bulletVariant];
  }
  if (bullets.standard) {
    return bullets.standard;
  }
  const firstKey = Object.keys(bullets)[0];
  return bullets[firstKey] ?? accomplishment.raw_fact;
}

function buildSkillsContext(
  skills: SkillsData,
  version: ResumeVersion,
  target: ResumeTarget,
): ResumeSkillCategoryContext[] {
  const emphasis = new Set(version.skill_emphasis ?? []);
  const hasEmphasis = emphasis.size > 0;

  return skills.categories
    .map((category) => {
      const filtered = category.skills.filter((skill) => {
        if (hasEmphasis) {
          return emphasis.has(skill.name);
        }
        if (skill.target_roles?.length) {
          return skill.target_roles.includes(target.id);
        }
        return true;
      });

      return {
        name: category.name,
        skill_names: filtered.map((skill) => skill.name),
      };
    })
    .filter((category) => category.skill_names.length > 0);
}

export function buildResumeContext(
  data: ResumeData,
  version: ResumeVersion,
): ResumeRenderContext {
  const target = data.resumeTargets.find((item) => item.id === version.target_id);
  if (!target) {
    throw new Error(
      `Resume version "${version.id}" references unknown target "${version.target_id}"`,
    );
  }

  const accomplishmentMap = new Map(
    data.accomplishments.map((item) => [item.id, item]),
  );
  const projectMap = new Map(data.projects.map((item) => [item.id, item]));
  const experienceMap = new Map(data.experience.map((item) => [item.id, item]));

  const summary =
    data.profile.summary_variants[version.summary_variant] ??
    data.profile.summary_variants.standard ??
    Object.values(data.profile.summary_variants)[0];

  const selectedAccomplishments = version.accomplishment_ids
    .map((id) => accomplishmentMap.get(id))
    .filter((item): item is Accomplishment => Boolean(item));

  const experience: ResumeRoleContext[] = version.experience_ids
    .map((id) => experienceMap.get(id))
    .filter((item): item is ExperienceEntry => Boolean(item))
    .map((role) => {
      const roleAccomplishmentIds = role.accomplishment_ids.filter((id) =>
        version.accomplishment_ids.includes(id),
      );

      return {
        id: role.id,
        company: role.company,
        title: role.title,
        location: role.location,
        start_date: role.start_date,
        end_date: formatEndDate(role.end_date),
        role_summary: role.role_summary,
        technologies: role.technologies ?? [],
        bullets: roleAccomplishmentIds.map((id) => {
          const accomplishment = accomplishmentMap.get(id);
          if (!accomplishment) {
            throw new Error(
              `Experience "${role.id}" references unknown accomplishment "${id}"`,
            );
          }
          return selectBullet(accomplishment, target.bullet_variant);
        }),
      };
    });

  const projects: ResumeProjectContext[] = (version.project_ids ?? [])
    .map((id) => projectMap.get(id))
    .filter((item): item is Project => Boolean(item))
    .map((project) => ({
      id: project.id,
      name: project.name,
      organization: project.organization,
      timeframe: project.timeframe,
      problem: project.problem,
      solution: project.solution,
      technologies: project.technologies ?? [],
      outcomes: project.outcomes ?? [],
      portfolio_visible: project.portfolio_visible ?? false,
      portfolio_headline: project.portfolio_headline ?? project.name,
      portfolio_blurb: project.portfolio_blurb,
      portfolio_image: project.portfolio_image,
      portfolio_links: project.portfolio_links ?? [],
      portfolio_featured: project.portfolio_featured ?? false,
    }));

  const accomplishments: ResumeAccomplishmentContext[] =
    selectedAccomplishments.map((item) => ({
      id: item.id,
      company: item.company,
      timeframe: item.timeframe,
      bullet: selectBullet(item, target.bullet_variant),
      themes: item.themes ?? [],
      technologies: item.technologies ?? [],
      confidence: item.confidence,
    }));

  return {
    profile: data.profile,
    version,
    target,
    summary,
    application_fit: version.application_fit,
    experience,
    projects,
    skills: buildSkillsContext(data.skills, version, target),
    accomplishments,
    generated_at: new Date().toISOString(),
  };
}

/**
 * The résumé version that feeds the portfolio export. Shared by the generator and
 * the validation rule so the guard always checks the version actually published.
 */
export function findPortfolioVersion(data: ResumeData): ResumeVersion | undefined {
  return (
    data.resumeVersions.find((item) => item.target_id === "portfolio-focused") ??
    data.resumeVersions.find((item) => item.target_id === "frontend-engineer") ??
    data.resumeVersions[0]
  );
}

export function buildPortfolioContext(
  data: ResumeData,
  version: ResumeVersion,
): ResumeRenderContext {
  const portfolioVersion: ResumeVersion = {
    ...version,
    project_ids: (version.project_ids ?? []).filter((id) => {
      const project = data.projects.find((item) => item.id === id);
      return project?.portfolio_visible !== false;
    }),
  };

  // The portfolio publishes every skill and lets the site filter by facet on the
  // client, so it deliberately bypasses the résumé's target_roles/skill_emphasis
  // narrowing — under that filter the export emitted zero skills, because no
  // skill lists the "portfolio-focused" target.
  const portfolioSkills: PortfolioSkillContext[] = collectFacetedSkills(
    data.skills,
  ).map((skill) => ({
    name: skill.name,
    facets: skill.facets,
    proficiency: skill.proficiency,
  }));

  return {
    ...buildResumeContext(data, portfolioVersion),
    portfolio_skills: portfolioSkills,
  };
}
