# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The AI Files** is a static site built with **Astro v5** documenting true stories from the age of AI — incidents, blunders, and landmark moments.

The site was migrated from plain HTML to Astro. The original HTML source files are preserved in `stories/` and `index.html` for reference but the Astro source in `src/` is the canonical version.

## Structure

```
src/
  layouts/
    BaseLayout.astro      ← Sets <head>, CSS custom properties (--story, --story-dark) per story
    StoryLayout.astro     ← Renders nav, hero, sources, more-stories, footer from story metadata
  pages/
    index.astro           ← Archive landing page (featured story + card grid)
    stories/
      *.astro             ← One file per story (22 total)
  styles/
    global.css            ← Shared component styles
  data/
    stories.json          ← Metadata for all 22 stories

stories/                  ← Original HTML source files (reference only)
index.html                ← Original HTML landing page (reference only)
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

**StoryLayout** auto-generates: nav, hero (chapter, title, deck, byline, verify badge), sources block, more-stories grid, and footer — all from `story` metadata.

## stories.json Schema

Each entry in `src/data/stories.json`:

```json
{
  "slug": "my-story",           // matches filename and URL
  "chapter": 1,
  "volume": "I",
  "title": "Story Title",
  "deck": "One-sentence summary shown in hero and cards",
  "date": "2023",
  "readTime": "5 min read",
  "emoji": "🤖",
  "tags": ["Tag One", "Tag Two"],
  "story": "#hex",              // per-story accent color (--story)
  "storyDark": "#hex",          // dark tint for hero gradient (--story-dark)
  "verifyText": "Source note shown in hero verify badge",
  "sources": [
    { "label": "Link Label", "url": "https://..." }
  ],
  "moreStories": ["slug-1", "slug-2", "slug-3", "slug-4"]
}
```

## Design System (CSS Custom Properties)

Defined in `BaseLayout.astro` `:root`:

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

## Adding a New Story

1. Add entry to `src/data/stories.json` with all required fields
2. Create `src/pages/stories/[slug].astro` using the pattern above
3. Add the slug to `moreStories` arrays of related stories in stories.json
4. Update `src/pages/index.astro` to include the new story card

## Development

```bash
npm run dev      # Start dev server at localhost:4321
npm run build    # Build to dist/
npm run preview  # Preview production build
```

## Deployment

The site deploys from the `dist/` output of `astro build`. The original HTML files in `stories/` and `index.html` are no longer the deployed artifacts.
