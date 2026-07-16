import { pathToFileURL } from "node:url";
import nunjucks from "nunjucks";
import { buildResumeContext } from "./lib/build-resume-context.js";
import { renderHtmlToPdf } from "./lib/pdf.js";
import { assertValidResumeData } from "./lib/validate.js";
import {
  TEMPLATE_FILES,
  TEMPLATES_DIR,
  resumeVersionOutputDir,
} from "./lib/paths.js";
import type { ResumeVersion } from "./lib/schemas.js";

const env = nunjucks.configure(TEMPLATES_DIR, {
  autoescape: false,
  trimBlocks: true,
  lstripBlocks: true,
});

export async function generatePdfForVersion(version: ResumeVersion): Promise<string> {
  const data = assertValidResumeData();
  const context = buildResumeContext(data, version);
  const html = env.render(TEMPLATE_FILES.resumeHtml, context);

  const outputDir = resumeVersionOutputDir(version.output_folder);
  const pdfPath = `${outputDir}/${version.output_slug}.pdf`;
  await renderHtmlToPdf(html, pdfPath);

  return pdfPath;
}

export async function generateAllPdfs(): Promise<string[]> {
  const data = assertValidResumeData();
  const paths: string[] = [];

  for (const version of data.resumeVersions) {
    paths.push(await generatePdfForVersion(version));
  }

  return paths;
}

async function main(): Promise<void> {
  const paths = await generateAllPdfs();
  console.log(`✓ Generated ${paths.length} résumé PDF(s):`);
  for (const path of paths) {
    console.log(`  - ${path}`);
  }
}

// Unlike the cheap template-based generators, this launches a real browser
// per version, so only run `main` when this file is the entrypoint — not
// as a side effect of other modules importing `generateAllPdfs`.
const isEntrypoint =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
  main().catch((error: unknown) => {
    console.error("✗ PDF generation failed.");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
