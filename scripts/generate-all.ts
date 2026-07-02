import { generateAllPdfs } from "./generate-pdf.js";
import { generatePortfolioJson } from "./generate-portfolio-json.js";
import { generateAllResumes } from "./generate-resume.js";
import { ChromeNotFoundError } from "./lib/chrome.js";
import { validateResumeData } from "./lib/validate.js";

async function main(): Promise<void> {
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

  try {
    const pdfPaths = await generateAllPdfs();
    console.log(`✓ Generated ${pdfPaths.length} résumé PDF(s).`);
  } catch (error) {
    if (error instanceof ChromeNotFoundError) {
      console.warn(`⚠ Skipped PDF export: ${error.message}`);
    } else {
      throw error;
    }
  }
}

main();
