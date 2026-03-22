---
description: >
  Add a NotebookLM audio narration to an existing story using the Playwright
  automation script. Generates a Brief audio overview, downloads and optimizes
  the file, adds it to the story's metadata, and optionally commits + pushes.
---

# add-audio

Generate and attach a NotebookLM audio podcast to an existing story.

## Usage

```
/add-audio [slug]
/add-audio --all
```

Examples:
```
/add-audio air-canada
/add-audio --all
```

## Prerequisites

- Playwright + Chromium installed (`npm install -D playwright && npx playwright install chromium`)
- ffmpeg installed locally (`brew install ffmpeg`)
- Story must already be published at `https://theaifiles.app/stories/[slug]`
- Google auth saved (run `--auth` once)

## Steps

### Step 1 — Ensure Auth (first time only)

If `.claude/notebooklm-auth.json` does not exist:

```bash
npx tsx scripts/add-audio.ts --auth
```

This opens a headed browser. Log into your Google account, then press Enter in the terminal. Auth state is saved for future runs.

### Step 2 — Generate Audio

Single story:
```bash
npx tsx scripts/add-audio.ts [slug] --commit
```

All stories without audio:
```bash
npx tsx scripts/add-audio.ts --all --commit
```

Dry run (list what would be processed):
```bash
npx tsx scripts/add-audio.ts --dry-run --all
```

The script handles everything automatically:
1. Creates a NotebookLM notebook with the story URL as source
2. Selects Brief format and generates audio (~2-3 min)
3. Downloads the .m4a file
4. Optimizes with ffmpeg (96k AAC + faststart)
5. Updates `stories.json` with the `audio` field
6. Commits and pushes (if `--commit` flag)

### Step 3 — Verify

```bash
npm run build
```

## Script Flags

| Flag | Description |
|------|-------------|
| `--auth` | Save Google session only (headed browser) |
| `--all` | Process all stories missing audio |
| `--commit` | Git add, commit, and push after processing |
| `--headed` | Run browser visibly (debugging) |
| `--force` | Process even if audio already exists |
| `--dry-run` | List slugs without processing |

## How the Audio Player Works

`StoryLayout.astro` checks for `story.audio` and auto-renders:
- A `.listen-bar` with play/pause button, progress bar, and time display
- Styled with the story's `--story` accent color
- Label: "Listen to this story" / "Audio Overview · NotebookLM"

No changes to the story's `.astro` file are needed.

## Troubleshooting

- **Auth expired**: Run `npx tsx scripts/add-audio.ts --auth` again
- **NotebookLM won't ingest the URL**: Site must be publicly accessible
- **Generation fails**: Check `debug-[slug].png` screenshot in project root
- **ffmpeg not found**: Install via `brew install ffmpeg`
- **Use `--headed` flag** to watch the browser and debug selector issues
