import { writeFileSync } from "node:fs";
import { stringify } from "yaml";

/** Stable YAML stringify options for data/*.yaml rewrites. */
const STRINGIFY_OPTIONS = {
  lineWidth: 100,
  defaultStringType: "PLAIN" as const,
  defaultKeyType: "PLAIN" as const,
};

/** Writes a YAML document to disk with consistent formatting. */
export function writeYamlFile(path: string, data: unknown): void {
  const body = stringify(data, STRINGIFY_OPTIONS).replace(/\s+$/, "\n");
  writeFileSync(path, body, "utf8");
}

/**
 * Formats one or more list items as YAML suitable for appending to an existing
 * array document (each item starts with `- `).
 */
export function stringifyYamlListItems(items: unknown[]): string {
  return stringify(items, STRINGIFY_OPTIONS).replace(/\s+$/, "\n");
}
