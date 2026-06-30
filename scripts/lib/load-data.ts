import { readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import { DATA_FILES } from "./paths.js";
import {
  accomplishmentsSchema,
  experienceSchema,
  profileSchema,
  projectsSchema,
  resumeTargetsSchema,
  resumeVersionsSchema,
  skillsSchema,
  type ResumeData,
} from "./schemas.js";

function loadYamlFile<T>(path: string): T {
  const raw = readFileSync(path, "utf8");
  return parseYaml(raw) as T;
}

export function loadResumeData(): ResumeData {
  return {
    profile: profileSchema.parse(loadYamlFile(DATA_FILES.profile)),
    accomplishments: accomplishmentsSchema.parse(
      loadYamlFile(DATA_FILES.accomplishments),
    ),
    projects: projectsSchema.parse(loadYamlFile(DATA_FILES.projects)),
    experience: experienceSchema.parse(loadYamlFile(DATA_FILES.experience)),
    skills: skillsSchema.parse(loadYamlFile(DATA_FILES.skills)),
    resumeTargets: resumeTargetsSchema.parse(
      loadYamlFile(DATA_FILES.resumeTargets),
    ),
    resumeVersions: resumeVersionsSchema.parse(
      loadYamlFile(DATA_FILES.resumeVersions),
    ),
  };
}
