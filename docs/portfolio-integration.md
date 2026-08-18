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

## How the portfolio consumes it

**This repo pushes nothing.** It publishes a contract and knows nothing about its
consumers — no credential here has write access to the site, and the site needs no
credential to read this. Keeping the arrow pointing one way is what makes the whole
pipeline credential-free.

`VolantTyler/portfolio` pulls the file itself:

1. `.github/workflows/sync-resume.yml` in that repo runs on a manual trigger or a
   weekly cron.
2. `scripts/sync-resume-content.mjs` fetches the raw URL below and compares it to
   the committed copy, ignoring `generatedAt`. Identical content is a no-op.
3. `scripts/build-site.mjs` re-renders only the regions of `index.html` between
   `<!-- generated:NAME start -->` markers, and merges `agents.json` / `agents.md`.
4. The workflow opens a pull request against that repo using its own built-in
   `GITHUB_TOKEN`. Vercel builds a preview; a human merges.

```txt
https://raw.githubusercontent.com/VolantTyler/resume-system/main/output/portfolio/resume-content.json
```

That URL is the contract. `output/` must stay committed to `main` for it to resolve,
and note that raw.githubusercontent caches for a few minutes — a sync triggered
seconds after a merge here can still fetch the previous copy.

### What this repo owns, and what it does not

This repo carries *presentation intent* — `portfolio_visible`, `portfolio_headline`,
`portfolio_blurb`, `portfolio_image`, `portfolio_links`, `portfolio_featured`, and
`portfolio_facets`. Those describe **what to publish and how to describe it**.

It carries no knowledge of the site's markup, CSS, URLs, or build. Those live in the
portfolio repo. When adding a field, ask which side of that line it falls on.

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
- [x] Site-side wiring in the `tylerstahl.dev` codebase — see "How the portfolio
      consumes it" above
