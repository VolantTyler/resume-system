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

  const { paths: resumePaths, results } = await generateAllResumes();
  const judged = results.filter((result) => result.judged).length;
  const passed = results.filter((result) => result.judged && result.passed).length;
  console.log(
    `✓ Generated ${resumePaths.length} résumé files (${judged} judged, ${passed} passed).`,
  );
  for (const result of results) {
    if (!result.judged) {
      continue;
    }
    const last = result.rounds[result.rounds.length - 1];
    const score = last.judgeResult?.verdict.overall_score;
    console.log(
      `  - ${result.version.id}: ${score ?? "?"}/10 · ${result.rounds.length} round(s) · ${result.passed ? "pass" : "needs review"}`,
    );
  }
  if (results.some((result) => result.logFile)) {
    console.log(`  Judge log: ${results.find((result) => result.logFile)?.logFile}`);
  }

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
