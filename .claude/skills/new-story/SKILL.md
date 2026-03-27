---
description: >
  Run the end-to-end editorial pipeline for a new story — from pitch evaluation
  through research, source review, angle selection, outline, draft, fact check,
  art brief, canvas generation, and publish packaging. Produces all working
  files and a final article-package.json ready for the publish-story step.
---

# new-story

Run the full editorial pipeline for a new story pitch. Each stage hands off to the appropriate agent. Stages are sequential — do not skip gates.

## Usage

```
/new-story [topic or pitch description]
```

Examples:
```
/new-story The 2016 Microsoft Tay chatbot incident
/new-story https://[article about AI incident]
/new-story AI systems in courtrooms fabricating legal citations
```

## Pipeline Steps

Execute each step in order. Do not proceed past a gate unless it clears.

---

### Step 1 — Assignment Editor `[SKIP IF PRE-RESEARCHED]`

Invoke the `assignment-editor` agent with the pitch.

**Skip condition**: If the user provides a pre-researched pitch with sources, angle, and key facts already gathered, skip this step and construct `story-brief.json` directly from the user's input. Mark it `"status": "approved"` with a note that editorial review was bypassed.

**Gate**: Produces `story-brief.json` with `status: "approved"`. If rejected, stop and present the rejection memo. Score must be ≥ 6.0.

---

### Step 2 — Research Scout

Invoke the `research-scout` agent with `story-brief.json`.

**Gate**: Produces `research-bundle.json` with ≥ 3 distinct sources and all `keyQuestions` addressed (even if answer is "not found").

---

### Step 3 — Source Critic

Invoke the `source-critic` agent with `research-bundle.json`.

**Optimization**: When invoking, share the research-scout's gathered URLs and source summaries so the critic doesn't re-fetch URLs already gathered. Include a note: "These URLs were already fetched by research-scout — verify claims against the excerpts provided before re-fetching."

**Gate**: `sourceCriticVerdict` must be "go" or "go-with-caveats". If "no-go", return to research-scout with the specific gaps to fill. Do not proceed to angle selection on a "no-go" verdict.

---

### Step 4 — Angle Strategist

Invoke the `angle-strategist` agent with the annotated research bundle and story brief.

**Gate**: Produces a selected angle with a reader value statement and rationale for rejected angles.

---

### Step 5 — Story Architect

Invoke the `story-architect` agent with the selected angle and annotated research bundle.

**Gate**: Produces `outline-[slug].md` with all sections defined, evidence mapped, hook stated, ending framed, and canvas placement noted.

---

### Step 6 — Writer

Invoke the `writer` agent with `outline-[slug].md` and the annotated research bundle.

**Gate**: Produces `draft-[slug].md` with all sections complete, canvas placeholder `<!-- CANVAS: [slug] -->` inserted, 2-3 visual reenactment blocks (chat logs, terminal mockups, chain diagrams, etc.) with their CSS, and an `llmsDescription` paragraph (2-4 sentences with key facts, names, dates, and numbers — suitable for AI citation systems via `llms.txt`).

---

### Step 7+8 — Copy Editor + Fact Checker + Art Director `[PARALLEL]`

Launch **three agents in parallel** (single message, three Agent calls):

1. **Copy Editor**: Invoke `copy-editor` with `draft-[slug].md`. Reviews prose quality, structure, style guide compliance, and "What If" section depth.
2. **Fact Checker**: Invoke `fact-checker` with `draft-[slug].md` and the annotated research bundle.
3. **Art Director**: Invoke `art-director` with the draft and `story-brief.json`.

Copy editor and fact checker evaluate different dimensions (prose quality vs. factual accuracy) so they run in parallel. The art brief depends on thesis and tone, not specific facts or prose polish — so it can proceed alongside both.

**Gate (Copy Editor)**: `editorial-review-[slug].md` verdict must be `PASS`. If `NEEDS-REVISION`, apply revisions to the draft before proceeding. Common revision triggers: weak "What If" section, abstract opening hook, pervasive style guide violations.

**Gate (Fact Checker)**: `factcheck-[slug].md` verdict must be `PASS`. If `FAIL` with only minor fixes (misattribution, quote precision, date off-by-one), apply corrections manually and verify — do not re-run the full fact-checker agent. Only re-run for structural issues (wrong narrative, fabricated claims, missing sourcing).

**Gate (Art Director)**: Produces `canvas-brief.json` with all required fields: thesis, emotionalRegister, visualMetaphor, symbolicElements, motionRules, palette.

---

### Step 9 — Canvas Artist (+ apply fact-check corrections if needed) `[PARALLEL]`

If fact-checker returned corrections, apply them to the draft AND launch the canvas-artist in parallel (single message). Canvas code doesn't depend on draft text.

Invoke the `canvas-artist` agent with `canvas-brief.json`.

**Gate**: Produces complete, labeled CSS/HTML/JS blocks ready for Astro page insertion. The assembled Astro page **must** include a `<p class="canvas-note"><strong>[Art Name]</strong> — [Description]</p>` immediately after the `.phantom-wrap` closing div, using the art name and description from the canvas-brief's `canvasAnimationDescription` field.

---

### Step 9b — Card Image Generation `[PARALLEL WITH PAGE ASSEMBLY]`

Generate a 1024x1024 story card image using the `generate-image` skill (mflux on Apple Silicon). This image is used as the story hero, index card icon, more-stories grid icon, and embedded in the auto-generated OG image.

```
/generate-image --story [slug] --size square --model turbo "concept matching the story theme"
```

Craft a prompt matching The AI Files dark-side aesthetic: deep black background, single symbolic object, atmospheric cinematic lighting, story accent color as the vivid element. Save to `public/images/cards/[slug].png`.

**Gate**: Image file exists at `public/images/cards/[slug].png` and visually fits the story's theme.

---

### Step 10 — Security Scanner + Accessibility Auditor `[PARALLEL, BACKGROUND]`

Launch **both agents in parallel** with `run_in_background: true` while assembling the Astro page. Page assembly does not depend on either scan result — only the final publish gate does.

1. **Security Scanner**: Invoke `security-scanner` with the assembled Astro page (including canvas code) and the stories.json entry.
2. **Accessibility Auditor**: Invoke `accessibility-auditor` with the assembled Astro page and shared layouts.

**Gate (Security)**: `security-scan-[slug].md` verdict must be `PASS`. No CRITICAL or HIGH findings allowed. If `FAIL`, fix the identified vulnerabilities and re-scan.

**Gate (Accessibility)**: `a11y-audit-[slug].md` verdict must be `PASS`. No Critical or Serious findings allowed. If `FAIL`, fix the identified barriers and re-audit.

Do not proceed to publish on a `FAIL` verdict from either gate.

---

### Step 11 — Package & SEO Verification

Assemble `article-package.json` from all working files. Run:

```bash
npx tsx scripts/validate-story.ts [slug]
```

**SEO checklist** (enforced by validation script, verify manually if any warnings):
- Card image exists at `public/images/cards/[slug].png` (1024x1024, used in hero, index cards, OG image)
- `llmsDescription` field present in stories.json (2-4 sentences with key facts, names, dates, numbers for AI citation systems)
- `whatIf` field present in stories.json
- `isoDate` in ISO 8601 format
- All sources have label and url
- Canvas has `IntersectionObserver` for off-screen pausing
- Canvas has `aria-hidden="true"` and `prefers-reduced-motion` support
- Build succeeds and generates: sitemap, RSS feed, llms.txt with the new story entry

If validation passes, invoke the `publish-story` skill to finalize site files.

---

## Output Summary

At completion, summarize:
- Story slug and title
- Selected angle
- Copy edit verdict
- Fact check verdict
- Security scan verdict
- Accessibility audit verdict
- Canvas concept description
- Card image generated (path)
- Location of all working files
- Validation status
- SEO verification (llmsDescription present, llms.txt entry generated)

## Notes

- Working files (`research-bundle.json`, `draft-[slug].md`, `editorial-review-[slug].md`, `factcheck-[slug].md`, `canvas-brief.json`, `security-scan-[slug].md`, `a11y-audit-[slug].md`) are not committed to the repo.
- Only the Astro page, stories.json entry, and llms.txt update are committed.
- If the pitch fails at Step 1, document the rejection and stop cleanly.
