import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import nunjucks from "nunjucks";
import { buildResumeContext } from "./lib/build-resume-context.js";
import { loadResumeData } from "./lib/load-data.js";
import { renderHtmlToPdf } from "./lib/pdf.js";
import { RESUMES_OUTPUT_DIR } from "./lib/paths.js";

const APPLICATION_FIT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{ profile.name }} — Application Fit</title>
  <style>
    :root { --text: #1a1a1a; --muted: #555; --border: #e5e7eb; }
    body {
      font-family: Georgia, "Times New Roman", serif;
      line-height: 1.5;
      color: var(--text);
      max-width: 800px;
      margin: 2rem auto;
      padding: 0 1.5rem 3rem;
    }
    h1 { font-size: 2rem; margin: 0 0 0.25rem; font-weight: 700; }
    .headline { font-size: 1.1rem; color: var(--muted); margin: 0 0 0.5rem; }
    .contact { font-size: 0.95rem; margin-bottom: 1.5rem; }
    h2 {
      font-size: 1.1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.25rem;
      margin: 1.75rem 0 0.75rem;
    }
    .fit-role { font-size: 0.9rem; color: var(--muted); font-style: italic; margin: 0 0 0.5rem; }
    .fit-overall { margin: 0 0 0.75rem; }
    .fit-subhead { font-size: 0.95rem; font-weight: 700; margin: 0.75rem 0 0.35rem; }
    ul { margin: 0.35rem 0 0.75rem; padding-left: 1.25rem; }
    li { margin-bottom: 0.25rem; }
    @media print {
      @page { size: letter; margin: 0.5in; }
      body { margin: 0; max-width: none; padding: 0; }
    }
  </style>
</head>
<body>
  <header>
    <h1>{{ profile.name }}</h1>
    <p class="headline">{{ version.label }}</p>
    {% if profile.location %}<p class="contact">{{ profile.location }}</p>{% endif %}
  </header>
  <section>
    <h2>Application Fit</h2>
    {% if application_fit.role_reference %}<p class="fit-role">{{ application_fit.role_reference }}</p>{% endif %}
    <p class="fit-overall">{{ application_fit.overall }}</p>
    <p class="fit-subhead">Strongest alignment</p>
    <ul>
      {% for item in application_fit.strengths %}
      <li><strong>{{ item.criterion }}</strong> — {{ item.resume_reference }}</li>
      {% endfor %}
    </ul>
    <p class="fit-subhead">Gaps / indirect fit</p>
    <ul>
      {% for item in application_fit.weaknesses %}
      <li><strong>{{ item.criterion }}</strong> — {{ item.indirect_address }}</li>
      {% endfor %}
    </ul>
  </section>
</body>
</html>`;

async function main(): Promise<void> {
  const versionId = process.argv[2] ?? "tyler-stahl-deloitte-fde-frontier-genai";
  const data = loadResumeData();
  const version = data.resumeVersions.find((item) => item.id === versionId);

  if (!version) {
    throw new Error(`Resume version not found: ${versionId}`);
  }
  if (!version.application_fit) {
    throw new Error(`Resume version has no application_fit block: ${versionId}`);
  }

  const context = buildResumeContext(data, version);
  const html = nunjucks.renderString(APPLICATION_FIT_HTML, context);
  const slug = `${version.output_slug}-application-fit`;
  const htmlPath = `${RESUMES_OUTPUT_DIR}/${slug}.html`;
  const pdfPath = `${RESUMES_OUTPUT_DIR}/${slug}.pdf`;

  mkdirSync(dirname(htmlPath), { recursive: true });
  writeFileSync(htmlPath, html, "utf8");
  await renderHtmlToPdf(html, pdfPath);

  console.log(`✓ Generated application-fit PDF: ${pdfPath}`);
}

main().catch((error: unknown) => {
  console.error("✗ Application-fit PDF generation failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
