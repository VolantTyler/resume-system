import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import nunjucks from "nunjucks";
import { buildResumeContext } from "./lib/build-resume-context.js";
import { assertValidResumeData } from "./lib/validate.js";
import {
  RESUMES_OUTPUT_DIR,
  TEMPLATE_FILES,
  TEMPLATES_DIR,
} from "./lib/paths.js";
import type { ResumeVersion } from "./lib/schemas.js";

const env = nunjucks.configure(TEMPLATES_DIR, {
  autoescape: false,
  trimBlocks: true,
  lstripBlocks: true,
});

function writeOutput(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, "utf8");
}

export function generateResumeOutputs(version: ResumeVersion): {
  markdownPath: string;
  htmlPath: string;
} {
  const data = assertValidResumeData();
  const context = buildResumeContext(data, version);

  const markdownPath = `${RESUMES_OUTPUT_DIR}/${version.output_slug}.md`;
  const htmlPath = `${RESUMES_OUTPUT_DIR}/${version.output_slug}.html`;

  const markdown = env.render(TEMPLATE_FILES.resumeMarkdown, context);
  const html = env.render(TEMPLATE_FILES.resumeHtml, context);

  writeOutput(markdownPath, markdown);
  writeOutput(htmlPath, html);

  return { markdownPath, htmlPath };
}

export function generateAllResumes(): string[] {
  const data = assertValidResumeData();
  const paths: string[] = [];

  for (const version of data.resumeVersions) {
    const { markdownPath, htmlPath } = generateResumeOutputs(version);
    paths.push(markdownPath, htmlPath);
  }

  return paths;
}

function main(): void {
  const paths = generateAllResumes();
  console.log(`✓ Generated ${paths.length} résumé files:`);
  for (const path of paths) {
    console.log(`  - ${path}`);
  }
}

main();
