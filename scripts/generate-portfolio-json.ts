import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import nunjucks from "nunjucks";
import { buildPortfolioContext } from "./lib/build-resume-context.js";
import { assertValidResumeData } from "./lib/validate.js";
import {
  PORTFOLIO_OUTPUT_DIR,
  TEMPLATE_FILES,
  TEMPLATES_DIR,
} from "./lib/paths.js";

const env = nunjucks.configure(TEMPLATES_DIR, {
  autoescape: false,
  trimBlocks: true,
  lstripBlocks: true,
});

export function generatePortfolioJson(): string {
  const data = assertValidResumeData();

  const frontendVersion =
    data.resumeVersions.find((item) => item.target_id === "frontend-engineer") ??
    data.resumeVersions[0];

  const context = buildPortfolioContext(data, frontendVersion);
  const outputPath = `${PORTFOLIO_OUTPUT_DIR}/resume-content.json`;
  const json = env.render(TEMPLATE_FILES.portfolioJson, context);

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${json.trim()}\n`, "utf8");

  return outputPath;
}

function main(): void {
  const outputPath = generatePortfolioJson();
  console.log(`✓ Generated portfolio JSON: ${outputPath}`);
}

main();
