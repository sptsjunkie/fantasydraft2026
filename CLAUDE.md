# Resume-Tailoring Project

This folder tailors resumes to specific job descriptions using a pipeline of agents.

> Note: this repository also contains an unrelated React/Vite app (`src/`, `public/`,
> `package.json`, etc. — a fantasy baseball draft tool). The rules below apply only to the
> resume-tailoring files (`inventory/`, `jobs/`, `templates/`). Do not modify the app when doing resume work.

## Source of truth

**`inventory/career-inventory.md` is the ONLY source of truth for any claim.**

- Never invent, embellish, or infer accomplishments, metrics, titles, dates, scope, skills, or credentials.
- Never round a number up or upgrade a role ("contributed" → "led").
- Respect each metric's **confidence** level (Verified / Estimated / Directional) when phrasing it.
- If a JD asks for something the inventory doesn't support, flag it as a gap — do not paper over it.
  The user decides whether to add it to the inventory.
- Every resume bullet must cite its inventory ID (e.g., `<!-- PS-01 -->`) in draft files.

Supporting files:
- `inventory/positioning.md` — 2–3 positioning spines (headline, summary, lead accomplishment IDs).
- `templates/resume-format.md` — layout, section order, 2-page max, bullet style rules.

## Job folders

Each application lives in its own folder: `jobs/<company-role-slug>/`
(lowercase, hyphenated, e.g. `jobs/acme-vp-pricing/`).

- **Input:** `jd.md` — the job description, pasted verbatim (plus any notes on the role, recruiter, or company at the bottom under `## Notes`).
- Everything else in the folder is produced by the pipeline.

## Pipeline

```
jd.md
  → jd-analyst          → analysis-v1.md
  → resume-tailor       → resume-v1.md
  → resume-critic ×3    → critique-v1-<lens>.md   (three lenses, run independently)
  → revise              → resume-v2.md
  → resume-fact-checker → factcheck-v2.md
```

1. **jd-analyst** — reads `jd.md`; extracts must-haves, nice-to-haves, keywords, seniority signals;
   picks the best positioning spine; maps requirements to inventory IDs; lists gaps.
2. **resume-tailor** — writes a resume from the analysis, inventory, chosen spine, and format template.
3. **resume-critic (×3 lenses)** — each critic reviews the same draft through a different lens
   (e.g., hiring manager, recruiter/ATS screen, skeptical executive). Critics suggest; they don't rewrite.
4. **revise** — the tailor incorporates critique into the next version, noting which suggestions were accepted or rejected and why.
5. **resume-fact-checker** — checks every claim in the revised resume against the inventory and the format rules;
   flags anything unsupported, inflated, or mis-hedged. Failures go back to step 4.

## Versioning

- All agent outputs are **versioned files** in the job's folder: `<artifact>-v1.md`, `-v2.md`, …
- **Never overwrite** a prior version; write the next number.
- A critique or fact-check carries the version number of the resume it reviewed
  (`critique-v2-recruiter.md` reviews `resume-v2.md`).
- Each output file starts with a short header: which inputs (and their versions) it was produced from.

Example:
```
jobs/acme-vp-pricing/
  jd.md
  analysis-v1.md
  resume-v1.md
  critique-v1-hiring-manager.md
  critique-v1-recruiter.md
  critique-v1-skeptic.md
  resume-v2.md
  factcheck-v2.md
```
