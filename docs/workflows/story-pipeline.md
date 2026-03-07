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
[7. Fact Check]      fact-checker
   |                 → factcheck-[slug].md (pass/fail + corrections)
   v
[8. Art Brief]       art-director
   |                 → canvas-brief.json
   v
[9. Canvas]          canvas-artist
   |                 → canvas JS block (inline script)
   v
[10. Publish]        publish-story skill
                     → article-package.json + all site files updated
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

## Stage 7 — Fact Check

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

## Stage 10 — Publish Package

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
| `factcheck-[slug].md` | 7 | Fact-check report |
| `canvas-brief.json` | 8 | Art direction brief |

Only the final Astro page, stories.json entry, and llms.txt update get committed.
