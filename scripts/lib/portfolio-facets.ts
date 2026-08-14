import type { PortfolioFacet, SkillEntry, SkillsData } from "./schemas.js";

export const PORTFOLIO_FACETS: readonly PortfolioFacet[] = [
  "applied-ai",
  "front-end",
  "back-end",
  "devops",
];

/**
 * A skill with no `portfolio_facets` inherits its category's facet. Testing and
 * Collaboration have no facet of their own, so skills there must tag explicitly
 * — `validateSkillFacets` turns an untagged one into a build error rather than a
 * skill that quietly disappears from every facet filter.
 */
const CATEGORY_FACETS: Record<string, PortfolioFacet> = {
  "Applied AI": "applied-ai",
  "Front-End": "front-end",
  "Back-End": "back-end",
  DevOps: "devops",
};

export function categoryFacet(categoryName: string): PortfolioFacet | undefined {
  return CATEGORY_FACETS[categoryName];
}

export function resolveSkillFacets(
  skill: SkillEntry,
  categoryName: string,
): PortfolioFacet[] {
  if (skill.portfolio_facets?.length) {
    return [...skill.portfolio_facets];
  }
  const inherited = categoryFacet(categoryName);
  return inherited ? [inherited] : [];
}

export interface FacetedSkill {
  name: string;
  facets: PortfolioFacet[];
  proficiency?: string;
  category: string;
}

export function collectFacetedSkills(skills: SkillsData): FacetedSkill[] {
  return skills.categories.flatMap((category) =>
    category.skills.map((skill) => ({
      name: skill.name,
      facets: resolveSkillFacets(skill, category.name),
      proficiency: skill.proficiency,
      category: category.name,
    })),
  );
}
