import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import nunjucks from "nunjucks";
import { buildResumeContext } from "./lib/build-resume-context.js";
import {
  finalizeResumeWithJudge,
  type FinalizeResult,
  type FinalizeWithJudgeOptions,
} from "./lib/finalize-resume.js";
import {
  TEMPLATE_FILES,
  TEMPLATES_DIR,
  resumeVersionOutputDir,
} from "./lib/paths.js";
import { buildRoleBriefFromTarget, resolveTargetForVersion } from "./lib/role-brief.js";
import type { ResumeData, ResumeVersion } from "./lib/schemas.js";
import { assertValidResumeData } from "./lib/validate.js";

const env = nunjucks.configure(TEMPLATES_DIR, {
  autoescape: false,
  trimBlocks: true,
  lstripBlocks: true,
});

function writeOutput(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, "utf8");
}

export function renderResumeVersionToDir(
  data: ResumeData,
  version: ResumeVersion,
  outputDir: string,
): { markdownPath: string; htmlPath: string } {
  const context = buildResumeContext(data, version);

  const markdownPath = `${outputDir}/${version.output_slug}.md`;
  const htmlPath = `${outputDir}/${version.output_slug}.html`;

  const markdown = env.render(TEMPLATE_FILES.resumeMarkdown, context);
  const html = env.render(TEMPLATE_FILES.resumeHtml, context);

  writeOutput(markdownPath, markdown);
  writeOutput(htmlPath, html);

  return { markdownPath, htmlPath };
}

export type GenerateResumeOptions = Partial<
  Pick<
    FinalizeWithJudgeOptions,
    | "maxRounds"
    | "passScore"
    | "client"
    | "model"
    | "stub"
    | "skipJudge"
    | "writeDebug"
    | "writeLog"
    | "logFile"
    | "runsDir"
    | "applicationFitMode"
  >
> & {
  /** Override output directory (e.g. tailored/). When unset, uses output/resumes[/output_folder]. */
  outputDir?: string;
};

/**
 * Finalize one résumé version: judge + claim-safe revise, then save markdown/HTML.
 */
export async function generateResumeOutputs(
  version: ResumeVersion,
  options: GenerateResumeOptions = {},
  data: ResumeData = assertValidResumeData(),
): Promise<FinalizeResult> {
  const outputDir =
    options.outputDir ?? resumeVersionOutputDir(version.output_folder);
  const target = resolveTargetForVersion(data, version);
  const roleBrief = buildRoleBriefFromTarget(target, version);

  return finalizeResumeWithJudge(data, version, {
    trigger: "generate",
    roleBrief,
    outputDir,
    render: renderResumeVersionToDir,
    maxRounds: options.maxRounds,
    passScore: options.passScore,
    client: options.client,
    model: options.model,
    stub: options.stub,
    skipJudge: options.skipJudge,
    writeDebug: options.writeDebug,
    writeLog: options.writeLog,
    logFile: options.logFile,
    runsDir: options.runsDir,
    ...(options.applicationFitMode
      ? { applicationFitMode: options.applicationFitMode }
      : {}),
  });
}

export async function generateAllResumes(
  options: GenerateResumeOptions = {},
): Promise<{ paths: string[]; results: FinalizeResult[] }> {
  const data = assertValidResumeData();
  const results: FinalizeResult[] = [];
  const paths: string[] = [];

  for (const version of data.resumeVersions) {
    const result = await generateResumeOutputs(version, options, data);
    results.push(result);
    paths.push(result.markdownPath, result.htmlPath);
  }

  return { paths, results };
}

async function main(): Promise<void> {
  const { paths, results } = await generateAllResumes();
  const judged = results.filter((result) => result.judged).length;
  console.log(`✓ Generated ${paths.length} résumé files (${judged} judged):`);
  for (const result of results) {
    const status = result.judged
      ? `judge ${result.passed ? "pass" : "needs review"} · ${result.rounds.length} round(s)`
      : "judge skipped";
    console.log(`  - ${result.version.id} (${status})`);
    console.log(`      ${result.markdownPath}`);
    console.log(`      ${result.htmlPath}`);
    if (result.detailPath) {
      console.log(`      log: ${result.detailPath}`);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void main();
}
