# TODO

Parked work items. Each entry says what the problem is, why it isn't fixed yet, and what
"done" looks like — enough that whoever picks it up doesn't have to re-derive the context.

## Run `npm run verify-claims` in CI

**Status:** parked (2026-08-19)

CI (`.github/workflows/ci.yml`) runs `npm run validate && npm test`. Neither checks whether a
rendered résumé bullet actually traces back to its source record — `validate` only enforces
Zod shapes and cross-references, and the stub judge (used whenever `RESUME_JUDGE_API_KEY` is
unset) does keyword overlap only. `npm run verify-claims` is the check that would catch claim
drift, and nothing runs it automatically.

**Why it's parked:** `verify-claims` exits 1 on findings, so adding it to CI turns the build red
the moment any claim drifts. That's the point — but it needs a decision about which finding
classes should be blocking. The starting-from-green precondition is now met: the six unsupported
claims that existed as of 2026-08-19 were resolved, and `npm run verify-claims` exits 0 across
all nine curated versions.

The checker reports three classes:

- **unsupported** — a bullet names a term not in that accomplishment's `technologies`/`themes`/
  `raw_fact`/`evidence`, and `skills.yaml` doesn't cite the accomplishment as evidence for it.
  Usually bleed-through from a job description or a neighbouring bullet.
- **inferred** — the bullet is backed by a `confidence: medium` accomplishment. Informational;
  there are many of these by design and they should not fail a build.
- **verified** — traced to source.

**Done looks like:** unsupported count is 0 on `main`, CI runs `verify-claims` as a separate
step from `validate && test` (so a claim failure is distinguishable from a test failure), and
only the unsupported class is blocking. Consider `--quiet` to keep the log readable.

## Add a first-class `certifications` field

**Status:** parked (2026-08-19)

`profileSchema` (`scripts/lib/schemas.ts`) models `education` but has no concept of a
certification. Seven certifications are currently stored as `education` entries in
`data/profile.yaml` — issuer in `institution`, certification name in `credential`, date and
pending status in `note`. That renders acceptably but conflates a degree with a course
completion, and it can't express issue/expiry dates or a credential URL.

**Why it's parked:** doing it properly touches `schemas.ts`, all three templates
(`resume.md.njk`, `resume.html.njk`, `portfolio.json.njk`), and `schemas/portfolio.schema.json`
— which is the contract `tylerstahl.dev` consumes, so it needs coordinating with that repo
rather than being changed unilaterally. See `docs/portfolio-integration.md`.

**Done looks like:** `certifications` is its own field with issuer/name/date/status (and
optionally a credential URL), the résumé templates render it as its own section, the portfolio
JSON contract is versioned alongside the change, and the seven entries move out of `education`.
