import { z } from "zod";

export const confidenceSchema = z.enum(["high", "medium", "low"]);

export const educationEntrySchema = z.object({
  institution: z.string().min(1),
  credential: z.string().min(1),
  note: z.string().optional(),
});

export const profileSchema = z.object({
  name: z.string().min(1),
  headline: z.string().min(1),
  location: z.string().optional(),
  portfolio_url: z.string().url().optional(),
  github_url: z.string().url().optional(),
  linkedin_url: z.string().url().optional(),
  summary_variants: z.record(z.string().min(1)).refine(
    (value) => Object.keys(value).length > 0,
    "At least one summary variant is required",
  ),
  target_roles: z.array(z.string().min(1)).min(1),
  education: z.array(educationEntrySchema).optional(),
});

export const accomplishmentSchema = z.object({
  id: z.string().min(1),
  company: z.string().optional(),
  role: z.string().optional(),
  timeframe: z.string().optional(),
  category: z.string().optional(),
  themes: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
  raw_fact: z.string().min(1),
  context: z.string().optional(),
  resume_bullets: z
    .record(z.string().min(1))
    .refine(
      (value) => Object.keys(value).length > 0,
      "At least one resume bullet variant is required",
    ),
  evidence: z.array(z.string()).optional(),
  target_roles: z.array(z.string().min(1)).min(1),
  confidence: confidenceSchema,
  source_notes: z.array(z.string()).optional(),
});

export const accomplishmentsSchema = z.array(accomplishmentSchema).min(1);

export const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  organization: z.string().min(1),
  timeframe: z.string().optional(),
  problem: z.string().optional(),
  solution: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  outcomes: z.array(z.string()).optional(),
  related_accomplishment_ids: z.array(z.string()).optional(),
  portfolio_visible: z.boolean().optional(),
  resume_relevance: z.string().optional(),
});

export const projectsSchema = z.array(projectSchema);

export const experienceEntrySchema = z.object({
  id: z.string().min(1),
  company: z.string().min(1),
  title: z.string().min(1),
  location: z.string().optional(),
  start_date: z.string().min(1),
  end_date: z.union([z.string(), z.literal("present")]).optional(),
  role_summary: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  major_projects: z.array(z.string()).optional(),
  accomplishment_ids: z.array(z.string().min(1)),
  project_ids: z.array(z.string()).optional(),
});

export const experienceSchema = z.array(experienceEntrySchema).min(1);

export const skillEntrySchema = z.object({
  name: z.string().min(1),
  aliases: z.array(z.string()).optional(),
  evidence_ids: z.array(z.string()).optional(),
  proficiency: z.string().optional(),
  target_roles: z.array(z.string()).optional(),
});

export const skillsSchema = z.object({
  categories: z
    .array(
      z.object({
        name: z.string().min(1),
        skills: z.array(skillEntrySchema),
      }),
    )
    .min(1),
});

export const resumeTargetSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  summary_variant: z.string().min(1),
  bullet_variant: z.string().min(1),
  emphasis: z.array(z.string()).optional(),
  deprioritize: z.array(z.string()).optional(),
});

export const resumeTargetsSchema = z.array(resumeTargetSchema).min(1);

const applicationFitStrengthSchema = z.object({
  criterion: z.string().min(1),
  resume_reference: z.string().min(1),
});

const applicationFitWeaknessSchema = z.object({
  criterion: z.string().min(1),
  indirect_address: z.string().min(1),
});

export const applicationFitSchema = z.object({
  role_reference: z.string().min(1).optional(),
  overall: z.string().min(1),
  strengths: z.array(applicationFitStrengthSchema).min(1).max(5),
  weaknesses: z.array(applicationFitWeaknessSchema).min(1).max(5),
});

export const resumeVersionSchema = z.object({
  id: z.string().min(1),
  target_id: z.string().min(1),
  label: z.string().min(1),
  summary_variant: z.string().min(1),
  experience_ids: z.array(z.string().min(1)),
  accomplishment_ids: z.array(z.string().min(1)).min(1),
  project_ids: z.array(z.string()).optional(),
  skill_emphasis: z.array(z.string()).optional(),
  application_fit: applicationFitSchema.optional(),
  output_slug: z.string().min(1),
  revision_history: z
    .array(
      z.object({
        date: z.string(),
        note: z.string(),
      }),
    )
    .optional(),
});

export const resumeVersionsSchema = z.array(resumeVersionSchema).min(1);

export type Profile = z.infer<typeof profileSchema>;
export type Accomplishment = z.infer<typeof accomplishmentSchema>;
export type Project = z.infer<typeof projectSchema>;
export type ExperienceEntry = z.infer<typeof experienceEntrySchema>;
export type SkillsData = z.infer<typeof skillsSchema>;
export type ResumeTarget = z.infer<typeof resumeTargetSchema>;
export type ApplicationFit = z.infer<typeof applicationFitSchema>;
export type ResumeVersion = z.infer<typeof resumeVersionSchema>;

export interface ResumeData {
  profile: Profile;
  accomplishments: Accomplishment[];
  projects: Project[];
  experience: ExperienceEntry[];
  skills: SkillsData;
  resumeTargets: ResumeTarget[];
  resumeVersions: ResumeVersion[];
}

export interface ValidationIssue {
  path: string;
  message: string;
}
