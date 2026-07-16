import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const ROOT = join(__dirname, "..", "..");
export const DATA_DIR = join(ROOT, "data");
export const DOCS_DIR = join(ROOT, "docs");
export const INTAKE_DIR = join(DOCS_DIR, "intake");
export const INTAKE_LOG_FILE = join(DOCS_DIR, "intake-log.md");
export const JOB_DESCRIPTIONS_DIR = join(DOCS_DIR, "job-descriptions");
export const TEMPLATES_DIR = join(ROOT, "templates");
export const OUTPUT_DIR = join(ROOT, "output");
export const RESUMES_OUTPUT_DIR = join(OUTPUT_DIR, "resumes");
export const TAILORED_OUTPUT_DIR = join(RESUMES_OUTPUT_DIR, "tailored");
export const PORTFOLIO_OUTPUT_DIR = join(OUTPUT_DIR, "portfolio");
export const DEBUG_OUTPUT_DIR = join(OUTPUT_DIR, "debug");

/** Curated résumé output dir: output/resumes[/output_folder]. */
export function resumeVersionOutputDir(outputFolder?: string): string {
  if (!outputFolder) {
    return RESUMES_OUTPUT_DIR;
  }
  return join(RESUMES_OUTPUT_DIR, outputFolder);
}

export const DATA_FILES = {
  profile: join(DATA_DIR, "profile.yaml"),
  experience: join(DATA_DIR, "experience.yaml"),
  projects: join(DATA_DIR, "projects.yaml"),
  accomplishments: join(DATA_DIR, "accomplishments.yaml"),
  skills: join(DATA_DIR, "skills.yaml"),
  resumeTargets: join(DATA_DIR, "resume_targets.yaml"),
  resumeVersions: join(DATA_DIR, "resume_versions.yaml"),
} as const;

export const TEMPLATE_FILES = {
  resumeMarkdown: join(TEMPLATES_DIR, "resume.md.njk"),
  resumeHtml: join(TEMPLATES_DIR, "resume.html.njk"),
  portfolioJson: join(TEMPLATES_DIR, "portfolio.json.njk"),
} as const;
