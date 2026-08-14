import { describe, expect, it } from "vitest";
import {
  createStubClassifyClient,
  findUnclassifiedSkills,
  formatFacetSnippet,
  parseFacetProposals,
  proposeSkillFacets,
  type SkillCandidate,
} from "../scripts/lib/classify-skills.js";
import { loadResumeData } from "../scripts/lib/load-data.js";

const candidate: SkillCandidate = {
  name: "Kubernetes",
  category: "Collaboration",
  aliases: ["k8s"],
  evidence: ["Ran the deploy pipeline for the staging cluster."],
  currentFacets: [],
};

describe("classify-skills candidate selection", () => {
  it("skips skills that inherit a category facet unless asked for all", () => {
    const data = loadResumeData();
    expect(findUnclassifiedSkills(data, false)).toEqual([]);
    expect(findUnclassifiedSkills(data, true).length).toBeGreaterThan(0);
  });

  it("surfaces a skill whose category has no default facet", () => {
    const data = loadResumeData();
    const candidates = findUnclassifiedSkills(
      {
        ...data,
        skills: {
          categories: [
            { name: "Collaboration", skills: [{ name: "Kubernetes" }] },
          ],
        },
      },
      false,
    );

    expect(candidates).toHaveLength(1);
    expect(candidates[0].currentFacets).toEqual([]);
  });
});

describe("stub classifier", () => {
  it("proposes facets from whole-word keyword matches", async () => {
    const proposals = await proposeSkillFacets([candidate], {
      client: createStubClassifyClient(),
      model: "stub",
    });

    expect(proposals).toHaveLength(1);
    expect(proposals[0].facets).toContain("devops");
    expect(proposals[0].rationale).toContain("deploy");
  });

  it("does not match a keyword inside a longer word", async () => {
    const proposals = await proposeSkillFacets(
      [
        {
          ...candidate,
          name: "Guild rapid delivery",
          aliases: [],
          evidence: ["Shipped rapid updates for the guild."],
        },
      ],
      { client: createStubClassifyClient(), model: "stub" },
    );

    // "api" inside "rapid" and "ui" inside "guild" must not cross-list this.
    expect(proposals[0].facets).not.toContain("back-end");
    expect(proposals[0].facets).not.toContain("front-end");
  });
});

describe("proposal parsing", () => {
  it("drops proposals for skills that were not asked about", () => {
    const raw = JSON.stringify({
      proposals: [
        { name: "Kubernetes", facets: ["devops"], rationale: "deploy work" },
        { name: "Invented skill", facets: ["devops"], rationale: "nope" },
      ],
    });

    const proposals = parseFacetProposals(raw, [candidate]);
    expect(proposals).toHaveLength(1);
    expect(proposals[0].name).toBe("Kubernetes");
  });

  it("rejects facets outside the fixed vocabulary", () => {
    const raw = JSON.stringify({
      proposals: [{ name: "Kubernetes", facets: ["platform"], rationale: "x" }],
    });

    expect(() => parseFacetProposals(raw, [candidate])).toThrow();
  });

  it("formats a pasteable YAML snippet", () => {
    expect(
      formatFacetSnippet({
        name: "Kubernetes",
        facets: ["devops", "back-end"],
        rationale: "x",
      }),
    ).toBe(
      ["        portfolio_facets:", "          - devops", "          - back-end"].join(
        "\n",
      ),
    );
  });
});
