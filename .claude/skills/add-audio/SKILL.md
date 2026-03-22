---
description: >
  Add a NotebookLM audio narration to an existing story. Opens the story URL in
  NotebookLM, generates a Brief audio overview, downloads and optimizes the file,
  adds it to the story's metadata, and commits + pushes.
---

# add-audio

Generate and attach a NotebookLM audio podcast to an existing story.

## Usage

```
/add-audio [slug]
```

Examples:
```
/add-audio air-canada
/add-audio microsoft-tay
```

## Prerequisites

- Chrome browser with Claude browser extension connected
- ffmpeg installed locally
- Story must already be published at `https://theaifiles.app/stories/[slug]`

## Steps

### Step 1 — Validate Input

1. Look up the slug in `src/data/stories.json`
2. Confirm the story exists and does NOT already have an `"audio"` field
3. If it already has audio, ask the user if they want to replace it

### Step 2 — Create NotebookLM Notebook

1. Open `https://notebooklm.google.com/` in Chrome via browser tools
2. Click "Create new notebook"
3. In the source dialog, click "Websites"
4. Paste the story URL: `https://theaifiles.app/stories/[slug]`
5. Click "Insert" and wait for the source to be ingested

### Step 3 — Generate Brief Audio

1. Click "Audio Overview" in the Studio panel
2. In the Customize Audio Overview dialog:
   - Select **Brief** format ("A bite-sized overview to help you grasp the core ideas from your sources quickly")
   - Leave language as English
   - Leave the focus prompt empty (or optionally customize)
3. Click **Generate**
4. Wait for generation to complete (poll with screenshots every 30s)
5. When complete, the audio will appear in the Studio panel with a title and play button

### Step 4 — Download the Audio

1. Click the 3-dot menu on the generated audio
2. Click **Download**
3. Wait for the file to appear in `~/Downloads/`
4. Identify the downloaded `.m4a` file (it will be the most recent one)

### Step 5 — Optimize and Place the File

Run ffmpeg to compress and add faststart for web streaming:

```bash
ffmpeg -y -i ~/Downloads/[downloaded-file].m4a \
  -c:a aac -b:a 96k -movflags +faststart \
  public/audio/[slug].m4a
```

Verify the output:
- Duration should be under 5 minutes for Brief format
- File size should be reasonable (typically 1-5 MB)

### Step 6 — Update stories.json

Add the `"audio"` field to the story's entry in `src/data/stories.json`:

```json
"audio": "/audio/[slug].m4a",
```

Place it after the `"deck"` field (following the existing convention from chevy-dollar).

### Step 7 — Build and Verify

```bash
npm run build
```

Confirm the build passes with no errors. The audio player is auto-rendered by `StoryLayout.astro` when the `audio` field is present — no page edits needed.

### Step 8 — Commit and Push

```bash
git add public/audio/[slug].m4a src/data/stories.json
git commit -m "Add NotebookLM audio narration for [slug] story"
git push
```

## How the Audio Player Works

`StoryLayout.astro` checks for `story.audio` and auto-renders:
- A `.listen-bar` with play/pause button, progress bar, and time display
- Styled with the story's `--story` accent color
- Label: "Listen to this story" / "Audio Overview · NotebookLM"
- All CSS is in `global.css` (`.listen-*` classes)

No changes to the story's `.astro` file are needed.

## Troubleshooting

- **NotebookLM won't ingest the URL**: The site must be publicly accessible. Verify at `https://theaifiles.app/stories/[slug]`
- **Audio too long**: Delete and regenerate with Brief format
- **ffmpeg not found**: Install via `brew install ffmpeg`
- **Download not appearing**: Check `~/Downloads/` for `.m4a` files sorted by date; the file name comes from NotebookLM's generated title
