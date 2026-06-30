import { assertValidResumeData, validateResumeData } from "./lib/validate.js";

function main(): void {
  const issues = validateResumeData();

  if (issues.length === 0) {
    console.log("✓ Résumé data validation passed.");
    return;
  }

  console.error("✗ Résumé data validation failed:\n");
  for (const issue of issues) {
    console.error(`  - [${issue.path}] ${issue.message}`);
  }
  process.exit(1);
}

main();
