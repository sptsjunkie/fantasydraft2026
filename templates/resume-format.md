# Resume Format

Every tailored resume follows this layout. `resume-tailor` produces it; `resume-critic`
and `resume-fact-checker` check against it.

## Hard constraints

- **Length:** 2 pages maximum. If over, cut the lowest-relevance bullets first — never shrink fonts or margins to fit.
- **Bullets:** max 2 lines each at standard formatting (~200 characters as a working limit).
- **Every bullet traces to an inventory ID.** In draft files, tag each bullet with its source,
  e.g. `<!-- PS-01 -->`. Tags are stripped from the final export only.
- **No claim without a source.** Titles, dates, metrics, and scope must match `inventory/career-inventory.md` exactly
  (rounding down is fine; rounding up is not).

## Section order

1. **Header** — Name · City, ST · phone · email · LinkedIn URL
2. **Headline** — one line, from the chosen spine in `inventory/positioning.md` (may be lightly tailored to the JD)
3. **Summary** — 3 lines max, from the chosen spine, tailored to the JD
4. **Selected Accomplishments** *(optional)* — 3–4 bullets; the strongest cross-role proof points for this JD
5. **Professional Experience** — reverse chronological
   - Line 1: **Company** — one-line company descriptor (if not well known) · Location
   - Line 2: **Title** · Dates (MMM YYYY – MMM YYYY)
   - Optional one-line scope statement (team size, budget, P&L)
   - Bullets: 3–6 for recent/relevant roles, 1–2 for older roles; roles 15+ years old may be collapsed into "Earlier Career"
6. **Education** — Degree, School, Year
7. **Skills & Certifications** — one or two lines, prioritized to the JD's keywords

## Bullet style

Formula: **Action verb + what you did + quantified result.**

- Start with a strong, specific past-tense verb (present tense for a current role's ongoing work).
  Prefer *Led, Built, Launched, Negotiated, Redesigned, Grew, Cut*; avoid *Helped, Assisted, Responsible for, Worked on*.
- Lead with the result when it is the most impressive part: "Grew ARR 40% ($12M → $17M) by …"
- Quantify with the inventory metric. Match hedging to **Metric confidence**:
  - Verified → state plainly ("cut churn 18%")
  - Estimated → state plainly or with "~" ("~$4M annual savings")
  - Directional → hedge or describe qualitatively ("materially reduced …", "roughly doubled …")
- Verb must match the inventory's *My specific actions*: "Led" only if you led it; otherwise "Co-led", "Drove X within…", etc.
- One idea per bullet. No first-person pronouns. No filler adjectives ("dynamic", "results-oriented").
- Mirror the JD's terminology where it is truthful.
