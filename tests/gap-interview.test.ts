import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { describe, expect, it } from "vitest";
import {
  runGapInterview,
  shouldOfferInterview,
  type GapInterviewIO,
} from "../scripts/lib/gap-interview.js";
import { interviewNoteFilename } from "../scripts/lib/gap-interview-session.js";
import { persistConfirmedGaps } from "../scripts/lib/persist-gap-evidence.js";
import { loadResumeData } from "../scripts/lib/load-data.js";
import {
  findGapCandidates,
  type GapCandidate,
  type MatchedTerm,
} from "../scripts/lib/tailor.js";
import type { Accomplishment, ResumeData } from "../scripts/lib/schemas.js";

function mockIo(answers: string[]): GapInterviewIO {
  const queue = [...answers];
  const logs: string[] = [];
  return {
    ask: async () => {
      const next = queue.shift();
      if (next === undefined) {
        throw new Error("mockIo ran out of answers");
      }
      return next;
    },
    say: (message) => {
      logs.push(message);
    },
  };
}

describe("shouldOfferInterview", () => {
  it("skips when there are no gaps or skip is set", () => {
    expect(
      shouldOfferInterview({ gapCount: 0, force: false, skip: false, isTty: true }),
    ).toBe("skip");
    expect(
      shouldOfferInterview({ gapCount: 2, force: true, skip: true, isTty: true }),
    ).toBe("skip");
  });

  it("runs when forced, offers on TTY, otherwise skips", () => {
    expect(
      shouldOfferInterview({ gapCount: 2, force: true, skip: false, isTty: false }),
    ).toBe("run");
    expect(
      shouldOfferInterview({ gapCount: 2, force: false, skip: false, isTty: true }),
    ).toBe("offer");
    expect(
      shouldOfferInterview({ gapCount: 2, force: false, skip: false, isTty: false }),
    ).toBe("skip");
  });
});

describe("interviewNoteFilename", () => {
  const date = new Date().toISOString().slice(0, 10);

  it("slugifies the job description filename", () => {
    const filename = interviewNoteFilename(
      "docs/job-descriptions/Example Role.md",
      () => false,
    );
    expect(filename).toBe(`${date}-gap-interview-example-role.md`);
  });

  it("appends a counter instead of reusing an existing note path", () => {
    const existing = new Set([
      `${date}-gap-interview-example-role.md`,
      `${date}-gap-interview-example-role-2.md`,
    ]);
    const filename = interviewNoteFilename(
      "docs/job-descriptions/example-role.md",
      (candidate) => existing.has(candidate),
    );
    expect(filename).toBe(`${date}-gap-interview-example-role-3.md`);
  });
});

describe("runGapInterview", () => {
  it("captures confirmations with raw facts and experience links", async () => {
    const data = loadResumeData();
    const gaps: GapCandidate[] = [
      {
        term: "Go",
        kind: "skill",
        question: "Have you used Go?",
      },
      {
        term: "Mentoring",
        kind: "responsibility",
        question: "Have you mentored?",
      },
    ];

    const result = await runGapInterview(
      gaps,
      data,
      ["full-stack-engineer"],
      mockIo([
        "y",
        "independent-rnd-applied-ai",
        "Independent R&D",
        "Built internal CLIs in Go for agent tooling experiments",
        "n",
      ]),
    );

    expect(result.confirmed).toHaveLength(1);
    expect(result.denied).toHaveLength(1);
    expect(result.confirmed[0].gap.term).toBe("Go");
    expect(result.confirmed[0].experienceId).toBe("independent-rnd-applied-ai");
    expect(result.confirmed[0].rawFact).toMatch(/Go/);
    expect(result.denied[0].term).toBe("Mentoring");
  });

  it("treats skip answers as skipped", async () => {
    const data = loadResumeData();
    const gaps: GapCandidate[] = [
      { term: "Rust", kind: "skill", question: "Have you used Rust?" },
    ];

    const result = await runGapInterview(
      gaps,
      data,
      ["full-stack-engineer"],
      mockIo(["s"]),
    );

    expect(result.skipped).toHaveLength(1);
    expect(result.confirmed).toHaveLength(0);
  });
});

describe("findGapCandidates", () => {
  it("returns kind and question metadata for undocumented JD terms", () => {
    const data = loadResumeData();
    const jobText =
      "We need someone with Go and Kubernetes experience who can lead customer discovery.";
    // Ensure these are not already matched from data.
    const matches: MatchedTerm[] = [];
    const gaps = findGapCandidates(jobText, matches);

    expect(gaps.map((g) => g.term)).toEqual(
      expect.arrayContaining(["Go", "Kubernetes", "Customer discovery"]),
    );
    const go = gaps.find((g) => g.term === "Go");
    expect(go?.kind).toBe("skill");
    expect(go?.question).toMatch(/Go/);
  });
});

describe("persistConfirmedGaps", () => {
  it("appends an accomplishment and updates skills/experience YAML", () => {
    const data = structuredClone(loadResumeData()) as ResumeData;
    const dir = mkdtempSync(join(tmpdir(), "gap-persist-"));
    const accomplishmentsPath = join(dir, "accomplishments.yaml");
    const skillsPath = join(dir, "skills.yaml");
    const experiencePath = join(dir, "experience.yaml");

    writeFileSync(accomplishmentsPath, "", "utf8");
    writeFileSync(skillsPath, "categories: []\n", "utf8");
    writeFileSync(
      experiencePath,
      `- id: independent-rnd-applied-ai
  company: Independent R&D
  title: Applied AI Developer
  start_date: 2026-02
  accomplishment_ids: []
`,
      "utf8",
    );

    // Seed in-memory collections the helper mutates.
    data.skills = { categories: [] };
    data.experience = [
      {
        id: "independent-rnd-applied-ai",
        company: "Independent R&D",
        title: "Applied AI Developer",
        start_date: "2026-02",
        accomplishment_ids: [],
      },
    ];
    data.accomplishments = [];

    const result = persistConfirmedGaps(
      data,
      [
        {
          gap: {
            term: "Go",
            kind: "skill",
            question: "Have you used Go?",
          },
          rawFact: "Built experimental CLIs in Go for agent tooling",
          context: "Independent R&D",
          experienceId: "independent-rnd-applied-ai",
          targetRoles: ["full-stack-engineer"],
        },
      ],
      {
        jobDescriptionPath: "docs/job-descriptions/example.md",
        interviewNotePath: "docs/intake/2026-07-20-gap-interview-example.md",
        date: "2026-07-20",
      },
      {
        accomplishments: accomplishmentsPath,
        skills: skillsPath,
        experience: experiencePath,
      },
    );

    expect(result.accomplishmentsAdded).toHaveLength(1);
    expect(result.accomplishmentsAdded[0].confidence).toBe("medium");
    expect(result.accomplishmentsAdded[0].technologies).toContain("Go");

    const appended = parseYaml(readFileSync(accomplishmentsPath, "utf8")) as Accomplishment[];
    expect(Array.isArray(appended)).toBe(true);
    expect(appended.some((item) => item.id.startsWith("gap-go"))).toBe(true);

    const skills = parseYaml(readFileSync(skillsPath, "utf8")) as ResumeData["skills"];
    expect(
      skills.categories.some((category) =>
        category.skills.some((skill) => skill.name === "Go"),
      ),
    ).toBe(true);

    const experience = parseYaml(
      readFileSync(experiencePath, "utf8"),
    ) as ResumeData["experience"];
    expect(experience[0].accomplishment_ids.some((id) => id.startsWith("gap-go"))).toBe(
      true,
    );
    expect(experience[0].technologies).toContain("Go");
  });
});
