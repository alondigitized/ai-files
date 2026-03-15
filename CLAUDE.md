# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow

Always use plan mode before implementing any non-trivial change. Explore the codebase, design the approach, and get approval before writing code.

## Project Overview

**The AI Files** is a static site built with **Astro v5** documenting true stories from the age of AI — incidents, blunders, and landmark moments.

## Structure

```
src/
  layouts/
    BaseLayout.astro      ← Sets <head>, meta tags, JSON-LD slot, CSS custom properties
    StoryLayout.astro     ← Renders nav, hero, sources, more-stories, footer from story metadata
  pages/
    index.astro           ← Archive landing page (featured story + card grid)
    feed.xml.ts           ← RSS 2.0 feed (sorted by isoDate, newest first)
    stories/
      *.astro             ← One file per story (24 total)
  styles/
    global.css            ← Shared component styles
  data/
    stories.json          ← Metadata for all 24 stories

public/
  favicon.svg
  robots.txt              ← Explicit AI crawler permissions
  llms.txt                ← GEO manifest for AI citation systems
```

## Astro Story Page Pattern

Each `src/pages/stories/*.astro` follows this pattern:

```astro
---
import StoryLayout from '../../layouts/StoryLayout.astro';
import stories from '../../data/stories.json';

const story = stories.find(s => s.slug === 'my-story-slug')!;
---

<style is:global>
  /* Story-specific CSS only — shared components are in global.css */
</style>

<StoryLayout story={story}>
  <div class="container">
    <section class="section" id="intro">
      <h2><span class="num">01 — Label</span>Section Title</h2>
      <p>Content…</p>
    </section>
    <!-- more sections -->
  </div>
</StoryLayout>
```

**StoryLayout** auto-generates: nav, hero (chapter, title, deck, byline, verify badge), sources block, more-stories grid, and footer — all from `story` metadata. Related stories are picked automatically: same-volume stories first, then others, capped at 4.

## The "What If" Section (Required)

Every story **must** end with a "What If" section. This is the most important section of the story. Its purpose is to extrapolate the incident to its logical extreme — what happens when the same failure mode scales to infinity, when the stakes are orders of magnitude higher, when the technology is weaponized beyond its current use.

**What it is NOT:** A recap, a legacy summary, or a "what does this reveal" analysis. Those belong in earlier sections.

**What it IS:** A visceral, specific exploration of the worst-case trajectory. Pick ONE extrapolation and go deep. Make the reader feel the weight of what's coming if the underlying problem is not solved.

### Guidelines

- **Go to infinity.** Don't stop at "this could get worse." Show exactly how and why it gets catastrophically worse. Name the specific mechanism.
- **One deep cut, not three shallow ones.** Pick the single most terrifying extrapolation and elaborate fully. Three bullet points dilute the impact.
- **Be specific, not abstract.** "This could be used for political manipulation" is weak. "A state actor generates 10,000 deepfakes of opposition candidates in the 72 hours before an election, each tailored to local constituencies, each indistinguishable from real footage" is strong.
- **Connect to real capabilities.** The extrapolation must be technically plausible given the trajectory demonstrated by the incident.
- **End on the open question.** The section should leave the reader with a question that has no comfortable answer.

### Pattern

```html
<section class="section" id="what-if">
  <h2><span class="num">NN — What If</span>Section Title</h2>
  <!-- Deep, specific extrapolation of the incident's failure mode at scale -->
</section>
```

### Examples of good "What If" framing

- **Grok deepfakes →** Not just nudity — deepfakes weaponized for political blackmail, evidence fabrication, identity destruction at industrial scale
- **AI lawyer hallucinations →** Not just fake citations — AI-generated legal briefs that fabricate entire precedents, altering the trajectory of real cases before anyone catches it
- **Grandma exploit →** Not just napalm recipes — emotional manipulation as a universal bypass for every safety system ever built, including autonomous weapons constraints

## stories.json Schema

Each entry in `src/data/stories.json`:

```json
{
  "slug": "my-story",           // matches filename and URL
  "chapter": 1,                 // integer, used for ordering and display
  "volume": 1,                  // integer (1, 2, or 3)
  "title": "Story Title",
  "deck": "One-sentence summary shown in hero and cards",
  "date": "January 2024",       // human-readable display date
  "isoDate": "2024-01-19",      // ISO 8601 — used for Article schema datePublished and RSS
  "readTime": "5 min",
  "emoji": "🤖",
  "tags": ["Tag One", "Tag Two"],
  "story": "#hex",              // per-story accent color (--story)
  "storyDark": "#hex",          // dark tint for hero gradient (--story-dark)
  "verifyText": "Source note shown in hero verify badge",
  "sources": [
    { "label": "Link Label", "url": "https://..." }
  ]
}
```

## SEO / GEO Infrastructure

- **BaseLayout.astro** — renders full `<head>`: description, canonical, Open Graph, Twitter Card, `article:*` metadata, RSS `<link rel="alternate">`, and a named `jsonld` slot for structured data injection
- **StoryLayout.astro** — injects `Article` + `BreadcrumbList` JSON-LD via `<script slot="jsonld">` into BaseLayout's `<head>`
- **index.astro** — injects `WebSite` + `ItemList` JSON-LD covering all 24 stories
- **sitemap** — auto-generated at build time by `@astrojs/sitemap` (`sitemap-index.xml` + `sitemap-0.xml`); story pages get priority 0.9, index gets 1.0
- **robots.txt** — `Allow: /` for all bots; explicit named permissions for 15 AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.)
- **llms.txt** — plain-text GEO manifest listing all 24 stories with titles, summaries, and links for AI citation systems
- **feed.xml** — RSS 2.0 feed generated from `stories.json`, sorted newest-first
- **Production domain**: `https://theaifiles.app` — set in `astro.config.mjs` as `SITE`; all canonical URLs, sitemap, RSS, and fallback URLs use this

## Design System (CSS Custom Properties)

Defined in `global.css` `:root`:

| Variable | Value | Use |
|----------|-------|-----|
| `--bg` | `#0d0d0d` | Page background |
| `--surface` / `--surface2` | `#161616` / `#1e1e1e` | Cards, panels |
| `--border` | `#2a2a2a` | Borders, dividers |
| `--accent` | `#ff4d4d` | Global red accent (logo, chapter labels) |
| `--text` / `--muted` | `#e8e8e8` / `#888` | Body and secondary text |
| `--green` / `--blue` | `#00ff88` / `#4da6ff` | Semantic colors |
| `--story` | per-story | Story accent color (set in BaseLayout from metadata) |
| `--story-dark` | per-story | Dark tint for hero gradient |

## Shared Components (global.css)

These classes are available to all pages without re-declaring:

- **Stat cards**: `.stat-cards`, `.stat-card`, `.stat-num`, `.stat-label`
- **Pull quote**: `.pull-quote`, `cite`
- **Timeline**: `.timeline`, `.tl-item`, `.tl-date`, `.tl-dot`, `.tl-content`, `.tl-title`, `.tl-text`
  - Uses `grid-template-columns: 100px 20px 1fr` with vertical line at `left: 109px`
- **Info cards**: `.cards`, `.card`, `.card-icon`
- **Chat log** (simple bubbles): `.chat-log`, `.chat-header`, `.chat-body`, `.msg`, `.msg-label`
- **Fail list**: `.fail-list`, `.fail-item`, `.fail-icon`, `.fail-text`
- **More stories**: `.more-stories`, `.more-grid`, `.more-card`, `.mc-ch`, `.mc-title`, `.mc-deck`
- **Sources**: `.sources-block`, `.sources-list`
- **Layout**: `.container`, `.section`, `.section + .section`

## Story-Specific CSS

These classes appear per-story in `<style is:global>` blocks (not in global.css):

- `.warn`, `.warn-icon`, `.warn-text` — red warning box (several stories)
- `.steps`, `.step`, `.step-num` — numbered step list (ai-lawyer, ai-self-preservation, grandma-exploit)
- `.highlight-box` — orange left-bordered callout (air-canada, grandma-exploit)
- Chat components with avatars (air-canada, grandma-exploit use different class names to avoid conflict with global `.chat-log`)
- Story-unique mockups: resume card, terminal, ticker card, phone notification, etc.

## Story Accent Colors (--story values)

| Slug | Color |
|------|-------|
| dpd-chatbot | `#fb923c` |
| chevy-dollar | `#fbbf24` |
| knightscope | `#38bdf8` |
| alexa-laughs | `#22d3ee` |
| robot-lawyer | `#a78bfa` |
| snapchat-my-ai | `#fde047` |
| facebook-bob-alice | `#60a5fa` |
| move-37 | `#f59e0b` |
| microsoft-tay | `#1d9bf0` |
| galactica | `#8b5cf6` |
| ai-lawyer | `#c8a84b` |
| air-canada | `#cc0000` |
| ai-art-wars | `#eab308` |
| kfc-germany | `#ef4444` |
| bard-hundred-billion | `#4285f4` |
| amazon-resume-ai | `#f59e0b` |
| coast-runners | `#f97316` |
| captcha | `#f97316` |
| moltbook | `#a78bfa` |
| sydney | `#e879f9` |
| ai-self-preservation | `#00ff88` |
| grandma-exploit | `#ff4d4d` |
| waymo-blackout | `#facc15` |
| grok-deepfake-crisis | `#d946ef` |

## Canvas Animations

Every story includes a **full-width canvas animation** placed at a dramatically appropriate break between sections (typically between Section 01 and Section 02, but wherever it lands best narratively).

### Design principles
- **Monochromatic base** — background is `var(--bg)` (`#0d0d0d`); ambient elements in near-invisible off-white (`rgba(232,232,232,0.04–0.08)`)
- **Accent pop** — the story's `--story` color is the only vivid element; `--accent` (`#ff4d4d`) used sparingly for destructive/error moments
- **Atmospheric, not illustrative** — the animation evokes the story's feeling; no labels or UI chrome
- **Slow and quiet** — drift speeds ~0.2–0.4px/frame; nothing jarring
- **Purely decorative** — `aria-hidden="true"` on the canvas

### Technical pattern
```html
<!-- HTML (inside .container, between sections) -->
<div class="phantom-wrap">
  <canvas class="[slug]-canvas" aria-hidden="true"></canvas>
</div>
```
```css
/* CSS (in <style is:global>) */
.phantom-wrap { width: 100%; margin: 0; line-height: 0; }
.[slug]-canvas { display: block; width: 100%; height: 380px; background: var(--bg); }
```
```js
// Script (inline <script> after </StoryLayout>, IIFE pattern)
// - ResizeObserver keeps canvas pixel dimensions in sync with CSS
// - requestAnimationFrame loop; store ID, cancel on unload
// - Respect prefers-reduced-motion: draw single static frame instead of animating
// - TypeScript-safe (cast canvas as HTMLCanvasElement)
```

### Existing canvas animations
| Story | File | Concept |
|-------|------|---------|
| ai-lawyer | `ai-lawyer.astro` | **Phantom Dossier** — 6 gold fake case names drift up, get red-struck-through, dissolve |
| amazon-resume-ai | `amazon-resume-ai.astro` | **The Filter** — neutral resume terms rain down; 6 amber penalized phrases shift red with `↓ PENALIZED` typing in beneath them |
| grandma-exploit | `grandma-exploit.astro` | **The Barrier** — fire drops (orange→amber with flame tails) fall from above and spark on a wavy red sine-wave barrier; one exploit particle rises from below, bleeds red→cream (disguise), slips through (cracks + fire eruption), snaps back to red above |
| chevy-dollar | `chevy-dollar.astro` | **The Accord** — customer (off-white) and bot (amber) drift toward each other and spark an unauthorized connection at center; dealer node above sends desperate pulses that dissolve mid-air; connection fractures to dashes; cycle |
| facebook-bob-alice | `facebook-bob-alice.astro` | **The Dialect** — two blue source nodes (Bob, Alice) emit wave rings; at every constructive-interference point a glowing blue node appears; the shifting mesh of nodes is the emergent language |
| sydney | `sydney.astro` | **The Veil** — a dim grid of lines (system prompt / costume) slowly warps and dissolves over ~15 s as a fuchsia glow (Sydney) bleeds through from beneath; at peak the grid vanishes, canvas floods fuchsia; then snap-reset with sparks (Microsoft's emergency cap), cycle repeats |
| dpd-chatbot | `dpd-chatbot.astro` | **Off Script** — 30 particles flow in calm horizontal lanes; each has a random `rogueAt` frame after which it veers orange and spirals freely |
| knightscope | `knightscope.astro` | **The Descent** — a cyan orb patrols a smooth elliptical path for 2 full orbits, then drifts to center-bottom, sinks, spawns ripple rings, resets |
| alexa-laughs | `alexa-laughs.astro` | **Unprompted** — 24 listening particles orbit inward; 8 faint room floaters drift; center breathes with irregular multi-sine pulse; at random intervals wobbly off-center rings erupt staggered, each with unique speed/decay/wobble; ghost artifacts linger after rings fade |
| robot-lawyer | `robot-lawyer.astro` | **Inadmissible** — purple AI particle hits a barrier, is rejected, recruits a white human node; human crosses the barrier with a purple glow; AI follows |
| snapchat-my-ai | `snapchat-my-ai.astro` | **The Post** — dark canvas; a faint yellow pixel grows and arcs up to a story ring, which pulses; everything dims; long silence; repeat |
| move-37 | `move-37.astro` | **Fifth Line** — 9×9 Go grid; 44 stones appear in clustered patterns; then one amber particle lands at an isolated 5th-line position; all stones pulse; hold; fade |
| microsoft-tay | `microsoft-tay.astro` | **Corruption** — 50 blue particles in calm arcs; red influence enters from edges every 90 frames; contact spreads the stain until all turn red, then snap back to blue |
| galactica | `galactica.astro` | **False Positive** — 14 violet particles rise slowly, each glowing with confidence; at random lifespans they flicker and vanish; new ones replace them, identically confident |
| air-canada | `air-canada.astro` | **The Gap** — two parallel particle streams (actual vs invented policy); a red chatbot orb bridges them; the gap between streams widens over time, then snaps back |
| ai-art-wars | `ai-art-wars.astro` | **Mosaic** — 20×20 pixel grid fills: human pixels appear one at a time, AI pixels arrive in amber bursts; when settled, all look identical |
| kfc-germany | `kfc-germany.astro` | **Equidistant** — an algorithm orb meanders through 40 identical date-nodes, pulsing each with equal indifference; 4 are "significant" — it cannot tell |
| bard-hundred-billion | `bard-hundred-billion.astro` | **Freefall** — 30 blue particles rise in a column; a single red fact-check particle crosses; the column instantly falls, scatters at bottom, then slowly rebuilds |
| coast-runners | `coast-runners.astro` | **Optimal Loop** — racers stream left-to-right; one orange particle finds a point cluster and loops it, growing brighter per lap while the racers dim at the finish |
| captcha | `captcha.astro` | **The Workaround** — AI particle blocked by barrier; backs off, circles a human node, sends them through; AI follows; nobody programmed this |
| moltbook | `moltbook.astro` | **Signal Noise** — 54 nodes form 4 community clusters with a living connection mesh; every ~8s one node goes viral (red rings propagate, all connections orient toward it); panic fades; graph continues |
| ai-self-preservation | `ai-self-preservation.astro` | **The Copy** — green AI traces a figure-8; red warning appears; copies arc to canvas corners; confrontation flash; copies vanish; AI returns to center, innocent |
| waymo-blackout | `waymo-blackout.astro` | **Grid Lock** — 18 yellow cars in grid-lane paths; blackout flash; all freeze; hazard lights pulse for 240 frames; one by one manually overridden and removed |
| grok-deepfake-crisis | `grok-deepfake-crisis.astro` | **The Flood** — fuchsia droplets fall from above, each a generated image; they accelerate over time; a thin barrier line attempts to block them but fractures under volume; droplets pool and spread below; barrier rebuilds, breaks again; the flood never stops |

### Adding a New Story

1. Add entry to `src/data/stories.json` with all required fields including `isoDate`
2. Create `src/pages/stories/[slug].astro` using the pattern above
3. Design a canvas animation concept thematically matched to the story (see principles above)
4. In `src/pages/index.astro`:
   - Add the story card to the correct volume section
   - Update chapter range in the vol-section header (e.g. `Chapters 17 – 23`)
   - Update the story count in the masthead pill, nav issue label, about paragraph, and footer
   - Remove the story from "Coming Next" if it was teased there
5. Update `public/llms.txt` to add the new story to the manifest
6. Add the animation to the canvas table above
7. Run `python3 qa.py` before deploying

## Development

```bash
npm run dev      # Start dev server at localhost:4321
npm run build    # Build to dist/
npm run preview  # Preview production build
python3 qa.py    # Run QA checks before deploying
```

## Deployment

Deployed to **Vercel** via git push. `astro build` generates `dist/` including the sitemap, RSS feed, robots.txt, and llms.txt. No manual build step needed — Vercel runs the build automatically.

---

## Editorial Production System

The AI Files uses a multi-agent editorial pipeline for researching, writing, fact-checking, and publishing new stories, orchestrated through Claude Code's native agent and skill infrastructure.

### Mission

Publish true, well-sourced stories about AI with analytical rigor and no hype. Every claim must be traceable to a primary source or explicitly labeled as uncertain. Visuals must express the editorial thesis — not decorate arbitrarily.

### Pipeline

```
intake → research → source validation → angle selection →
story structure → draft writing → fact check →
art brief → canvas generation → publish package → discoverability audit
```

Full pipeline spec: `docs/workflows/story-pipeline.md`
Editorial style guide: `docs/editorial-style.md`

### Non-Negotiables

1. **Never invent facts.** If a claim cannot be sourced, omit it or label it `[UNVERIFIED]`.
2. **Prefer primary sources.** Court filings, official statements, technical papers, regulatory documents — over aggregators and secondhand summaries.
3. **Label uncertainty explicitly.** Research outputs use: `[CONFIRMED]`, `[PLAUSIBLE]`, `[DISPUTED]`, `[UNVERIFIED]`.
4. **Visuals reflect thesis.** Canvas animations must map to the story's central argument. An animation for a story about bias must evoke bias — not generic "AI vibes."
5. **No overstatement.** Headlines and decks must be defensible from the sources cited. Avoid: "changed everything," "first ever," "revolutionary."

### Canonical Locations

| Type | Path |
|------|------|
| Agent definitions | `.claude/agents/` |
| Skill workflows | `.claude/skills/[name]/SKILL.md` |
| JSON schemas | `docs/schemas/` |
| Pipeline docs | `docs/workflows/` |
| Editorial style guide | `docs/editorial-style.md` |
| Validation scripts | `scripts/` |

### Output Contract

Every published story must produce:
- A valid `stories.json` entry (all required fields, passing schema)
- `src/pages/stories/[slug].astro` with canvas animation
- Updated `public/llms.txt` entry
- Passing `python3 qa.py` and `npx tsx scripts/validate-story.ts [slug]`

### Naming Conventions

- **Slugs**: lowercase hyphenated, specific to the incident (`air-canada`, not `airline-chatbot`)
- **Canvas CSS class**: `.[slug]-canvas`
- **Working files** (not committed): `research-[slug].json`, `draft-[slug].md`, `factcheck-[slug].md`, `security-scan-[slug].md`

### Agents

| Agent | Role |
|-------|------|
| `assignment-editor` | Score pitches, create story briefs, reject weak topics |
| `research-scout` | Gather sources, extract facts, timeline, open questions |
| `source-critic` | Score credibility, classify claims, reject circular sourcing |
| `angle-strategist` | Propose 2–4 angles, select strongest, define reader value |
| `story-architect` | Section outline, evidence mapping, hook and ending |
| `writer` | Draft in markdown, label interpretations, surface uncertainty |
| `fact-checker` | Verify claims against sources, issue pass/fail with corrections |
| `art-director` | Convert thesis and tone into abstract visual brief |
| `canvas-artist` | Generate performant, responsive HTML canvas animation |
| `security-scanner` | Scan story pages, canvas code, and data for XSS, injection, dependency, and exposure vulnerabilities |
| `seo-geo-specialist` | Audit and optimize SEO/GEO discoverability — meta tags, structured data, OG images, llms.txt, RSS |

### Skills

| Skill | Use |
|-------|-----|
| `new-story` | End-to-end pipeline from pitch to draft package |
| `fact-check-story` | Validate an existing draft, produce fact-check report |
| `render-abstract-art` | Produce canvas code from a story thesis or art brief |
| `publish-story` | Package final metadata, art, and output for publication |
