import { generatePortfolioJson } from "./generate-portfolio-json.js";
import { generateAllResumes } from "./generate-resume.js";
import { validateResumeData } from "./lib/validate.js";

function main(): void {
  const issues = validateResumeData();
  if (issues.length > 0) {
    console.error("✗ Validation failed — aborting generation.\n");
    for (const issue of issues) {
      console.error(`  - [${issue.path}] ${issue.message}`);
    }
    process.exit(1);
  }

  console.log("✓ Validation passed.\n");

  const resumePaths = generateAllResumes();
  console.log(`✓ Generated ${resumePaths.length} résumé files.`);

  const portfolioPath = generatePortfolioJson();
  console.log(`✓ Generated portfolio JSON: ${portfolioPath}`);
}

main();
