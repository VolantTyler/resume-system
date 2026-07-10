import type { ResumeData, ResumeTarget, ResumeVersion } from "./schemas.js";
import type { JobDescription } from "./tailor.js";

/**
 * A role brief is either a real job description or a synthetic brief built from
 * a curated résumé target. The judge evaluates against this text.
 */
export type RoleBrief = JobDescription;

export function buildRoleBriefFromTarget(
  target: ResumeTarget,
  version: ResumeVersion,
): RoleBrief {
  const lines = [
    `# ${target.label}`,
    "",
    `Curated résumé version: ${version.label} (\`${version.id}\`)`,
    `Target id: \`${target.id}\``,
    "",
    "## Emphasis",
    "",
  ];

  if (target.emphasis?.length) {
    for (const item of target.emphasis) {
      lines.push(`- ${item}`);
    }
  } else {
    lines.push("- (no explicit emphasis listed)");
  }

  if (target.deprioritize?.length) {
    lines.push("", "## Deprioritize", "");
    for (const item of target.deprioritize) {
      lines.push(`- ${item}`);
    }
  }

  lines.push(
    "",
    "## Evaluation focus",
    "",
    "- Prefer accomplishments and skills that match the emphasis above.",
    "- Flag weak evidence alignment; never invent claims.",
    "- Suggest claim-safe reordering and skill emphasis only.",
  );

  return {
    sourcePath: `resume_targets.yaml#${target.id}`,
    title: target.label,
    text: lines.join("\n"),
  };
}

export function resolveTargetForVersion(
  data: ResumeData,
  version: ResumeVersion,
): ResumeTarget {
  const target = data.resumeTargets.find((item) => item.id === version.target_id);
  if (!target) {
    throw new Error(
      `Résumé version "${version.id}" references unknown target_id "${version.target_id}"`,
    );
  }
  return target;
}
