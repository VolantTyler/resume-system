# Portfolio Site Integration (Milestone 5)

This repo publishes a single generated artifact for `tylerstahl.dev` (or any other
portfolio site) to consume:

```txt
output/portfolio/resume-content.json
```

It is produced by `scripts/generate-portfolio-json.ts` as part of `npm run generate`
/ `npm run build`, or standalone via:

```bash
npm run generate:portfolio
```

The shape of that file is documented as a JSON Schema at
`schemas/portfolio.schema.json` (documentation only — not enforced automatically at
generation time, same convention as the other files in `schemas/`).

## Which résumé version feeds the portfolio JSON

`generate-portfolio-json.ts` selects the résumé version whose `target_id` is
`portfolio-focused` (defined in `data/resume_targets.yaml`, instantiated as
`portfolio-v1` in `data/resume_versions.yaml`). This keeps the portfolio export
intentional rather than incidentally reusing whichever version happens to be listed
first. Within that version, only projects with `portfolio_visible: true` in
`data/projects.yaml` are included in `featuredProjects`.

To change what shows up on the portfolio site, edit `data/resume_versions.yaml`'s
`portfolio-v1` entry (which accomplishments/experience/projects/skills to include),
not the generator script.

## Recommended consumption pattern

This repo does not push anything to `tylerstahl.dev` — the site is expected to pull
`resume-content.json` on its own schedule. A few options, roughly in order of
simplicity:

1. **Fetch at build time from GitHub.** If this repo (or just `output/`) is public,
   the site's build step can fetch the raw file directly, e.g.:

   ```bash
   curl -sSL \
     https://raw.githubusercontent.com/VolantTyler/resume-system/main/output/portfolio/resume-content.json \
     -o data/resume-content.json
   ```

   This is the lowest-effort option and keeps the site in sync automatically on
   every deploy, as long as `output/` stays committed to `main`.

2. **CI job that syncs on change.** Add a GitHub Action to this repo that, on push
   to `main` affecting `output/portfolio/resume-content.json`, copies the file into
   the `tylerstahl.dev` repo (via a PR or direct commit with a deploy key) or
   triggers a rebuild/redeploy webhook on the site.

3. **Small read-only API.** If the site prefers a URL instead of a static fetch,
   host `resume-content.json` behind a lightweight endpoint (e.g. a Vercel/Cloudflare
   redirect to the raw GitHub URL, or a tiny serverless function) so the contract
   isn't tied to GitHub's raw-content URL scheme.

Option 1 requires no new code in this repo and is the current recommendation until
there's a concrete reason to add CI plumbing.

## Versioning and change detection

Every generation run stamps the file with:

- `generatedAt` — ISO timestamp of the generation run
- `versionId` — the `resume_versions.yaml` entry used (`portfolio-v1`)
- `targetId` — the `resume_targets.yaml` entry used (`portfolio-focused`)

A consuming site can use `generatedAt` to detect whether cached content is stale, or
simply always re-fetch since the file is small.

## Status

- [x] Stable, documented JSON contract (`schemas/portfolio.schema.json`)
- [x] Dedicated `portfolio-focused` résumé version driving the export
- [x] Generation wired into `npm run generate` / `npm run build`, plus standalone
      `npm run generate:portfolio`
- [ ] Site-side wiring in the `tylerstahl.dev` codebase (outside this repo's scope —
      see "Recommended consumption pattern" above)
