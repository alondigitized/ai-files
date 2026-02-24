# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
      *.astro             ← One file per story (23 total)
  styles/
    global.css            ← Shared component styles
  data/
    stories.json          ← Metadata for all 23 stories

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
- **index.astro** — injects `WebSite` + `ItemList` JSON-LD covering all 23 stories
- **sitemap** — auto-generated at build time by `@astrojs/sitemap` (`sitemap-index.xml` + `sitemap-0.xml`); story pages get priority 0.9, index gets 1.0
- **robots.txt** — `Allow: /` for all bots; explicit named permissions for 15 AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.)
- **llms.txt** — plain-text GEO manifest listing all 23 stories with titles, summaries, and links for AI citation systems
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

## Adding a New Story

1. Add entry to `src/data/stories.json` with all required fields including `isoDate`
2. Create `src/pages/stories/[slug].astro` using the pattern above
3. In `src/pages/index.astro`:
   - Add the story card to the correct volume section
   - Update chapter range in the vol-section header (e.g. `Chapters 17 – 23`)
   - Update the story count in the masthead pill, nav issue label, about paragraph, and footer
   - Remove the story from "Coming Next" if it was teased there
4. Update `public/llms.txt` to add the new story to the manifest
5. Run `python3 qa.py` before deploying

## Development

```bash
npm run dev      # Start dev server at localhost:4321
npm run build    # Build to dist/
npm run preview  # Preview production build
python3 qa.py    # Run QA checks before deploying
```

## Deployment

Deployed to **Vercel** via git push. `astro build` generates `dist/` including the sitemap, RSS feed, robots.txt, and llms.txt. No manual build step needed — Vercel runs the build automatically.
