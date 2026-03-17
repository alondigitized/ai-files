# Story Pipeline — The AI Files

This document specifies the end-to-end editorial workflow for producing a new story. Each stage has a designated agent, defined inputs, defined outputs, and explicit handoff criteria.

---

## Pipeline Overview

```
[Pitch]
   |
   v
[1. Intake]          assignment-editor
   |                 → story-brief.json (approved) or rejection memo
   v
[2. Research]        research-scout
   |                 → research-bundle.json
   v
[3. Source Review]   source-critic
   |                 → annotated claims, credibility scores, go/no-go
   v
[4. Angle]           angle-strategist
   |                 → selected angle, reader value statement
   v
[5. Architecture]    story-architect
   |                 → section outline with evidence mapping
   v
[6. Draft]           writer
   |                 → draft-[slug].md
   v
[7a. Copy Edit]      copy-editor          ← parallel with 7b
[7b. Fact Check]     fact-checker          ← parallel with 7a
   |                 → editorial-review-[slug].md (pass/needs-revision)
   |                 → factcheck-[slug].md (pass/fail + corrections)
   v
[8. Art Brief]       art-director
   |                 → canvas-brief.json
   v
[9. Canvas]          canvas-artist
   |                 → canvas JS block (inline script)
   v
[10a. Security]      security-scanner      ← parallel with 10b
[10b. Accessibility] accessibility-auditor  ← parallel with 10a
   |                 → security-scan-[slug].md (pass/fail + findings)
   |                 → a11y-audit-[slug].md (pass/fail + findings)
   v
[11. Publish]        publish-story skill
                     → article-package.json + all site files updated

[Quarterly]          ai-citation-strategist
                     → citation-audit-[date].md (site-wide)
```

---

## Stage 1 — Intake

**Agent**: `assignment-editor`
**Trigger**: A topic, headline, or URL is pitched for consideration.

**Inputs**:
- Topic description or headline
- (Optional) initial source links

**Process**:
- Search for corroboration of the core claim
- Score against five criteria (source quality, consequence, novelty, why-now, reader value)
- Classify story type: incident / milestone / pattern / anatomy
- Determine why-now

**Outputs**:
- If approved (score ≥ 6.0): `story-brief.json` conforming to `docs/schemas/story-brief.schema.json`
- If rejected (score < 6.0): rejection memo with specific reason and conditions for re-pitch

**Gate**: Do not proceed to research unless `story-brief.json` is produced and `status: "approved"`.

---

## Stage 2 — Research

**Agent**: `research-scout`
**Trigger**: Approved `story-brief.json` from Stage 1.

**Inputs**:
- `story-brief.json`
- `keyQuestions` from the brief

**Process**:
- Search for primary sources identified in `primarySourceHints`
- Expand to secondary sources for context and corroboration
- Extract: dated facts, chronological timeline, direct quotes, open questions
- Do NOT write narrative prose — extract only

**Outputs**:
- `research-bundle.json` conforming to `docs/schemas/research-bundle.schema.json`

**Gate**: Research bundle must contain ≥ 3 distinct primary or strong secondary sources before proceeding.

---

## Stage 3 — Source Review

**Agent**: `source-critic`
**Trigger**: `research-bundle.json` from Stage 2.

**Inputs**:
- `research-bundle.json`

**Process**:
- Score each source for credibility (1–5)
- Classify each claim as: `[CONFIRMED]`, `[PLAUSIBLE]`, `[DISPUTED]`, `[UNVERIFIED]`
- Flag circular sourcing (A cites B cites A)
- Flag anonymous-only claims
- Issue overall go/no-go verdict

**Outputs**:
- Annotated version of `research-bundle.json` with credibility scores and claim labels
- Go/no-go verdict with rationale

**Gate**: Proceed only if verdict is "go." If "no-go," return to research-scout with specific gaps to fill.

---

## Stage 4 — Angle Selection

**Agent**: `angle-strategist`
**Trigger**: Annotated `research-bundle.json` + approved `story-brief.json`.

**Inputs**:
- Annotated research bundle
- Story brief (especially `keyQuestions` and initial `angle`)

**Process**:
- Propose 2–4 distinct editorial angles
- For each: state the central claim, the evidence it rests on, and what it asks the reader to understand
- Select the strongest angle based on: evidence strength, novelty, reader value
- Define: what the reader will understand after reading that they did not before

**Outputs**:
- Selected angle as a single declarative sentence
- Reader value statement (1–2 sentences)
- Rationale for rejected angles

---

## Stage 5 — Story Architecture

**Agent**: `story-architect`
**Trigger**: Selected angle + annotated research bundle.

**Inputs**:
- Selected angle statement
- Annotated research bundle

**Process**:
- Build section-by-section outline (typically 3–5 sections)
- Map specific evidence items to each section
- Define: opening hook (specific scene, quote, or data point), ending (what this reveals)
- Identify where the canvas animation belongs (most dramatically resonant break)

**Outputs**:
- Section outline with section titles and evidence IDs mapped to each
- Hook sentence
- Ending frame (what the last paragraph communicates)
- Canvas placement note

---

## Stage 6 — Draft Writing

**Agent**: `writer`
**Trigger**: Approved section outline from Stage 5.

**Inputs**:
- Section outline
- Annotated research bundle
- Editorial style guide (`docs/editorial-style.md`)

**Process**:
- Write full article draft in markdown
- Follow section structure from outline
- Distinguish fact from interpretation in prose ("according to," "the company said," "it appears")
- Surface unresolved issues explicitly
- Leave canvas placement as `<!-- CANVAS: [slug] -->` placeholder comment

**Outputs**:
- `draft-[slug].md` (markdown, not Astro)

---

## Stage 7a — Copy Edit (parallel with 7b)

**Agent**: `copy-editor`
**Trigger**: `draft-[slug].md` from Stage 6.

**Inputs**:
- Draft markdown
- Editorial style guide (`docs/editorial-style.md`)

**Process**:
- Evaluate opening hook, section flow, controlling idea, prose quality
- Check style guide compliance (hype language, vague consequence, attribution precision)
- Assess "What If" section against all five depth criteria (goes to infinity, single deep cut, specificity, technical plausibility, open question)
- Issue PASS or NEEDS-REVISION

**Outputs**:
- `editorial-review-[slug].md` with section-by-section assessment and "What If" verdict
- Overall verdict: `PASS` or `NEEDS-REVISION`
- If `NEEDS-REVISION`: list of required revisions before re-review

**Gate**: Do not proceed to art until copy edit verdict is `PASS`. Runs in parallel with fact-checker — they evaluate different dimensions (prose quality vs. factual accuracy).

---

## Stage 7b — Fact Check (parallel with 7a)

**Agent**: `fact-checker`
**Trigger**: `draft-[slug].md` from Stage 6 + annotated research bundle.

**Inputs**:
- Draft markdown
- Annotated research bundle (for source cross-reference)

**Process**:
- Extract every specific factual claim from the draft
- Verify each against the research bundle sources
- Flag: overstatements, unsourced claims, date errors, misattributed quotes
- Issue pass or fail

**Outputs**:
- `factcheck-[slug].md` with claim-by-claim table: claim / source / verdict / correction
- Overall verdict: `PASS` or `FAIL`
- If `FAIL`: list of required corrections before re-check

**Gate**: Do not proceed to art until fact-check verdict is `PASS`.

---

## Stage 8 — Art Brief

**Agent**: `art-director`
**Trigger**: Passed draft + story brief.

**Inputs**:
- `draft-[slug].md` (fact-checked, passed)
- `story-brief.json`

**Process**:
- Identify the story's thesis in one sentence
- Identify the emotional register (unease, absurdity, dread, wonder, irony)
- Define the visual metaphor: what physical process maps to the story's mechanism?
- Define symbolic elements (particles, barriers, grids, nodes, etc.)
- Specify motion rules and palette constraints

**Outputs**:
- `canvas-brief.json` with: thesis, emotional register, visual metaphor, symbolic elements, motion rules, palette

---

## Stage 9 — Canvas Generation

**Agent**: `canvas-artist`
**Trigger**: `canvas-brief.json` from Stage 8.

**Inputs**:
- `canvas-brief.json`
- Existing canvas animations as reference (see CLAUDE.md canvas table)

**Process**:
- Generate HTML canvas animation as an inline `<script>` block (IIFE pattern)
- Implement ResizeObserver for responsive sizing
- Implement `prefers-reduced-motion` static fallback
- Cancel animation on page unload

**Outputs**:
- Canvas HTML/CSS/JS block ready to insert into `.astro` page
- Brief description of what the animation depicts (for CLAUDE.md canvas table)

---

## Stage 10a — Security Scan (parallel with 10b)

**Agent**: `security-scanner`
**Trigger**: Assembled Astro page with canvas code inserted, stories.json entry drafted.

**Inputs**:
- `src/pages/stories/[slug].astro` (with canvas script block)
- `src/data/stories.json` entry for the story
- Canvas JS block (inline script)

**Process**:
- Scan all `<script>` blocks for XSS vectors: `eval()`, `innerHTML`, `set:html` with dynamic data, `document.write()`
- Verify canvas script is self-contained (no network requests, no DOM manipulation outside its canvas)
- Validate all source URLs in stories.json are HTTPS and point to reputable domains
- Check for script injection in text fields (title, deck, verifyText, tags)
- Verify slug contains only lowercase alphanumeric and hyphens
- Check external scripts for SRI attributes
- Check `target="_blank"` links for `rel="noopener"`
- Grep for exposed secrets or API keys

**Outputs**:
- `security-scan-[slug].md` with finding-by-finding table, severity levels, and verdict
- Overall verdict: `PASS` or `FAIL`
- If `FAIL`: required fixes before re-scan

**Gate**: Do not proceed to publish unless security scan verdict is `PASS`. No CRITICAL or HIGH severity findings allowed.

---

## Stage 10b — Accessibility Audit (parallel with 10a)

**Agent**: `accessibility-auditor`
**Trigger**: Assembled Astro page with canvas code inserted.

**Inputs**:
- `src/pages/stories/[slug].astro` (with canvas script block)
- `src/layouts/StoryLayout.astro` and `src/layouts/BaseLayout.astro` (shared structure)
- `src/styles/global.css` (shared styles and theme variables)

**Process**:
- Verify heading hierarchy (one h1, no skipped levels)
- Calculate color contrast ratios for theme combinations (dark and light)
- Audit keyboard navigation of interactive elements (index toggle, carousel, nav)
- Verify landmark regions (nav, main, footer)
- Check canvas animations for `aria-hidden="true"` and `prefers-reduced-motion` compliance
- Verify image alt text and link labeling

**Outputs**:
- `a11y-audit-[slug].md` with WCAG criterion references, severity levels, and code-level fixes
- Overall verdict: `PASS` or `FAIL`
- If `FAIL`: required fixes before re-audit

**Gate**: Do not proceed to publish unless accessibility audit verdict is `PASS`. No Critical or Serious findings allowed. Runs in parallel with security-scanner.

**Frequency**: Per-story for new stories. Periodic site-wide audit (`a11y-audit-site.md`) for shared layout changes.

---

## Stage 11 — Publish Package

**Skill**: `publish-story`
**Trigger**: All previous stages complete.

**Process**:
- Validate final package against `docs/schemas/article-package.schema.json`
- Create `src/data/stories.json` entry
- Create `src/pages/stories/[slug].astro` from draft + canvas code
- Update `public/llms.txt`
- Update `src/pages/index.astro` (add card, update counts)
- Run `python3 qa.py` and `npx tsx scripts/validate-story.ts [slug]`

**Gate**: Both QA scripts must pass before story is marked ready for deployment.

---

## Working File Conventions

Working files are produced during the pipeline and should not be committed to the repo:

| File | Stage | Description |
|------|-------|-------------|
| `story-brief.json` | 1 | Approved pitch brief |
| `research-bundle.json` | 2–3 | Raw and annotated research |
| `draft-[slug].md` | 6 | Article draft in markdown |
| `editorial-review-[slug].md` | 7a | Copy edit / editorial review |
| `factcheck-[slug].md` | 7b | Fact-check report |
| `canvas-brief.json` | 8 | Art direction brief |
| `security-scan-[slug].md` | 10a | Security scan report |
| `a11y-audit-[slug].md` | 10b | Accessibility audit report |
| `citation-audit-[date].md` | quarterly | AI citation audit (site-wide) |

Only the final Astro page, stories.json entry, and llms.txt update get committed.

---

## Periodic Audits (Non-Pipeline)

### AI Citation Audit — Quarterly

**Agent**: `ai-citation-strategist`
**Trigger**: Manual, approximately quarterly or after significant content additions.

**Process**:
- Inventory all stories from `stories.json`
- Generate prompts a user might ask AI assistants about each incident
- Test citation visibility across ChatGPT, Claude, Gemini, Perplexity
- Analyze competitor coverage and structural gaps
- Produce prioritized fix pack

**Outputs**:
- `citation-audit-[date].md` with per-story citation rates and fix pack

This is not a gate — it produces recommendations, not pass/fail verdicts.
