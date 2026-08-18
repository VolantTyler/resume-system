import { fileURLToPath } from "node:url";
import {
  createStubClassifyClient,
  findUnclassifiedSkills,
  formatFacetSnippet,
  proposeSkillFacets,
  type FacetProposal,
  type SkillCandidate,
} from "./lib/classify-skills.js";
import type { LlmClient } from "./lib/llm.js";
import { createJudgeLlmClient, resolveJudgeApiKey, resolveJudgeModel } from "./lib/llm.js";
import { PORTFOLIO_FACETS } from "./lib/portfolio-facets.js";
import { assertValidResumeData } from "./lib/validate.js";

interface CliArgs {
  all: boolean;
  stub: boolean;
  model?: string;
}

function parseArgs(argv: string[]): CliArgs {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(
      [
        "Usage: npm run classify-skills [-- options]",
        "",
        "Proposes portfolio_facets for skills that do not state them, and prints the",
        "proposals for you to confirm. It never writes to data/skills.yaml — paste the",
        "snippets you agree with.",
        "",
        `Facet vocabulary (fixed): ${PORTFOLIO_FACETS.join(", ")}`,
        "",
        "By default only skills that resolve to NO facet are proposed — the ones a",
        "category default cannot cover, which fail `npm run validate`.",
        "",
        "Options:",
        "  --all              Also propose for skills currently inheriting a category",
        "                     facet, to review cross-listings as the corpus grows",
        "  --model <model>    OpenAI-compatible model id",
        "  --stub             Force the offline keyword classifier (no API key)",
      ].join("\n"),
    );
    process.exit(0);
  }

  const options: CliArgs = { all: false, stub: false };

  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === "--all") {
      options.all = true;
    } else if (flag === "--stub") {
      options.stub = true;
    } else if (flag === "--model" && value) {
      options.model = value;
      i += 1;
    }
  }

  return options;
}

function resolveClient(args: CliArgs): { client: LlmClient; mode: "stub" | "live" } {
  if (args.stub || !resolveJudgeApiKey()) {
    return { client: createStubClassifyClient(), mode: "stub" };
  }
  return { client: createJudgeLlmClient(), mode: "live" };
}

function printProposals(
  candidates: SkillCandidate[],
  proposals: FacetProposal[],
): void {
  const byName = new Map(proposals.map((proposal) => [proposal.name, proposal]));

  for (const candidate of candidates) {
    const proposal = byName.get(candidate.name);
    const current =
      candidate.currentFacets.length > 0
        ? candidate.currentFacets.join(", ")
        : "(none — resolves to no facet today)";

    console.log("");
    console.log(`  ${candidate.name}  ·  ${candidate.category}`);
    console.log(`    current:  ${current}`);
    if (!proposal) {
      console.log("    proposed: (no proposal returned)");
      continue;
    }
    console.log(`    proposed: ${proposal.facets.join(", ")}`);
    console.log(`    why:      ${proposal.rationale}`);
    console.log(formatFacetSnippet(proposal));
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const data = assertValidResumeData();

  const candidates = findUnclassifiedSkills(data, args.all);
  if (candidates.length === 0) {
    console.log(
      args.all
        ? "✓ Every skill states portfolio_facets explicitly."
        : "✓ Every skill resolves to at least one facet. Re-run with --all to review inherited ones.",
    );
    return;
  }

  const { client, mode } = resolveClient(args);
  const model = mode === "stub" ? "stub" : resolveJudgeModel(args.model);

  if (mode === "stub") {
    console.log(
      "  No LLM API key configured — using the offline keyword classifier.",
    );
    console.log(
      "  Set RESUME_JUDGE_API_KEY or OPENAI_API_KEY for model-proposed facets.",
    );
  }

  let proposals: FacetProposal[];
  try {
    proposals = await proposeSkillFacets(candidates, { client, model });
  } catch (error) {
    console.error(`✗ ${(error as Error).message}`);
    process.exit(1);
    return;
  }

  console.log("");
  console.log(
    `Proposed facets for ${candidates.length} skill(s) (model: ${model}):`,
  );
  printProposals(candidates, proposals);

  console.log("");
  console.log("  Nothing was written. Paste the snippets you agree with into");
  console.log("  data/skills.yaml, then run: npm run validate");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void main();
}
