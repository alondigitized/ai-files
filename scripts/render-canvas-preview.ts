#!/usr/bin/env npx tsx
/**
 * render-canvas-preview.ts
 *
 * Local preview helper for canvas animations. Extracts the canvas script
 * from an Astro story page and wraps it in a standalone HTML page you can
 * open in a browser to preview the animation without running the full
 * Astro dev server.
 *
 * Usage:
 *   npx tsx scripts/render-canvas-preview.ts [slug]
 *   npx tsx scripts/render-canvas-preview.ts air-canada
 *   npx tsx scripts/render-canvas-preview.ts --brief canvas-brief.json
 *
 * Output:
 *   dist/canvas-preview-[slug].html
 *   Then: open dist/canvas-preview-[slug].html
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readJSON<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

interface StoryEntry {
  slug: string;
  story: string;
  storyDark: string;
  title: string;
}

function getStoryMeta(slug: string): StoryEntry | null {
  const jsonPath = join(ROOT, 'src/data/stories.json');
  if (!existsSync(jsonPath)) return null;
  const stories = readJSON<StoryEntry[]>(jsonPath);
  return stories.find(s => s.slug === slug) ?? null;
}

// ─── Extraction ───────────────────────────────────────────────────────────────

function extractFromAstroPage(slug: string): {
  css: string;
  canvasHtml: string;
  script: string;
} | null {
  const pagePath = join(ROOT, `src/pages/stories/${slug}.astro`);
  if (!existsSync(pagePath)) {
    console.error(`No Astro page found: src/pages/stories/${slug}.astro`);
    return null;
  }

  const source = readFileSync(pagePath, 'utf-8');

  // Extract <style is:global> block (story-specific styles)
  const styleMatch = source.match(/<style is:global>([\s\S]*?)<\/style>/);
  const css = styleMatch ? styleMatch[1].trim() : '';

  // Extract canvas wrapper HTML
  const canvasWrapMatch = source.match(/<div class="phantom-wrap">[\s\S]*?<\/div>/);
  const canvasHtml = canvasWrapMatch ? canvasWrapMatch[0].trim() : `<div class="phantom-wrap">
  <canvas class="${slug}-canvas" aria-hidden="true"></canvas>
</div>`;

  // Extract <script> block (the canvas IIFE)
  // Find scripts after </StoryLayout> — the canvas script
  const afterLayout = source.split('</StoryLayout>')[1] ?? '';
  const scriptMatch = afterLayout.match(/<script>([\s\S]*?)<\/script>/);
  const script = scriptMatch ? scriptMatch[1].trim() : '';

  if (!script) {
    console.warn(`Warning: No canvas script found in ${slug}.astro after </StoryLayout>`);
  }

  return { css, canvasHtml, script };
}

// ─── HTML Generator ───────────────────────────────────────────────────────────

function buildPreviewHtml(slug: string, meta: StoryEntry | null, extracted: {
  css: string;
  canvasHtml: string;
  script: string;
}): string {
  const storyColor = meta?.story ?? '#ff4d4d';
  const storyDark = meta?.storyDark ?? '#1a0000';
  const title = meta?.title ?? slug;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Canvas Preview — ${title}</title>
  <style>
    /* ── Design system tokens ── */
    :root {
      --bg: #0d0d0d;
      --surface: #161616;
      --surface2: #1e1e1e;
      --border: #2a2a2a;
      --accent: #ff4d4d;
      --text: #e8e8e8;
      --muted: #888;
      --green: #00ff88;
      --blue: #4da6ff;
      --story: ${storyColor};
      --story-dark: ${storyDark};
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      min-height: 100vh;
    }

    .preview-header {
      padding: 24px 32px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .preview-slug {
      font-size: 11px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--muted);
    }

    .preview-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--text);
    }

    .story-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--story);
      flex-shrink: 0;
    }

    .canvas-section {
      padding: 48px 0;
    }

    .phantom-wrap {
      width: 100%;
      margin: 0;
      line-height: 0;
    }

    /* Story-specific styles extracted from Astro page */
    ${extracted.css}

    .preview-meta {
      padding: 24px 32px;
      border-top: 1px solid var(--border);
      display: flex;
      gap: 32px;
      font-size: 12px;
      color: var(--muted);
    }

    .meta-item strong {
      color: var(--text);
      display: block;
      margin-bottom: 2px;
    }
  </style>
</head>
<body>
  <div class="preview-header">
    <div class="story-dot"></div>
    <div>
      <div class="preview-slug">${slug}</div>
      <div class="preview-title">${title}</div>
    </div>
  </div>

  <div class="canvas-section">
    ${extracted.canvasHtml}
  </div>

  <div class="preview-meta">
    <div class="meta-item">
      <strong>Slug</strong>
      ${slug}
    </div>
    <div class="meta-item">
      <strong>Story color</strong>
      ${storyColor}
    </div>
    <div class="meta-item">
      <strong>Generated</strong>
      ${new Date().toISOString()}
    </div>
    <div class="meta-item">
      <strong>Source</strong>
      src/pages/stories/${slug}.astro
    </div>
  </div>

  <script>
  ${extracted.script || `
    // No canvas script extracted. If the Astro page exists, check that
    // the canvas script is placed after </StoryLayout> in the source file.
    console.warn('render-canvas-preview: no canvas script found for "${slug}"');
  `}
  </script>
</body>
</html>`;
}

// ─── Brief-mode Generator ─────────────────────────────────────────────────────

interface CanvasBrief {
  thesis: string;
  emotionalRegister: string;
  visualMetaphor: string;
  palette: { background: string; accent: string; secondary: string };
}

function buildBriefPreviewHtml(slug: string, brief: CanvasBrief): string {
  // For brief-mode, produce an info page since we can't generate code from a brief here.
  // The actual code generation is done by the canvas-artist agent.
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Canvas Brief — ${slug}</title>
  <style>
    :root { --bg: #0d0d0d; --text: #e8e8e8; --muted: #888; --border: #2a2a2a; }
    body { background: var(--bg); color: var(--text); font-family: monospace; padding: 40px; max-width: 720px; }
    h1 { font-size: 18px; margin-bottom: 32px; }
    .field { margin-bottom: 24px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-bottom: 6px; }
    .value { font-size: 14px; line-height: 1.6; }
    .swatch { display: inline-block; width: 16px; height: 16px; border-radius: 3px; margin-right: 8px; vertical-align: middle; }
    hr { border: none; border-top: 1px solid var(--border); margin: 32px 0; }
    .note { font-size: 12px; color: var(--muted); }
  </style>
</head>
<body>
  <h1>Canvas Brief: ${slug}</h1>

  <div class="field">
    <div class="label">Thesis</div>
    <div class="value">${brief.thesis}</div>
  </div>

  <div class="field">
    <div class="label">Emotional Register</div>
    <div class="value">${brief.emotionalRegister}</div>
  </div>

  <div class="field">
    <div class="label">Visual Metaphor</div>
    <div class="value">${brief.visualMetaphor}</div>
  </div>

  <div class="field">
    <div class="label">Palette</div>
    <div class="value">
      <div><span class="swatch" style="background:${brief.palette.background}"></span>${brief.palette.background} — background</div>
      <div><span class="swatch" style="background:${brief.palette.accent}"></span>${brief.palette.accent} — accent (--story)</div>
      <div><span class="swatch" style="background:${brief.palette.secondary}"></span>${brief.palette.secondary} — secondary</div>
    </div>
  </div>

  <hr />

  <div class="note">
    To generate canvas code from this brief, use the canvas-artist agent:<br />
    <code>/render-abstract-art ${slug} --from-brief canvas-brief.json</code>
  </div>
</body>
</html>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npx tsx scripts/render-canvas-preview.ts [slug]');
    console.error('       npx tsx scripts/render-canvas-preview.ts --brief canvas-brief.json');
    process.exit(1);
  }

  if (!existsSync(DIST)) {
    mkdirSync(DIST, { recursive: true });
  }

  // Brief mode
  if (args[0] === '--brief') {
    const briefPath = args[1] ?? 'canvas-brief.json';
    if (!existsSync(briefPath)) {
      console.error(`Brief file not found: ${briefPath}`);
      process.exit(1);
    }
    const brief = readJSON<CanvasBrief>(briefPath);
    const slug = briefPath.replace('canvas-brief.json', '').replace(/[-.]$/, '') || 'preview';
    const html = buildBriefPreviewHtml(slug, brief);
    const outPath = join(DIST, `canvas-preview-brief.html`);
    writeFileSync(outPath, html, 'utf-8');
    console.log(`Brief preview written: ${outPath}`);
    console.log(`Open with: open ${outPath}`);
    return;
  }

  // Slug mode
  const slug = args[0];
  const meta = getStoryMeta(slug);

  if (!meta) {
    console.warn(`Warning: No stories.json entry for "${slug}" — using placeholder colors`);
  }

  const extracted = extractFromAstroPage(slug);
  if (!extracted) {
    process.exit(1);
  }

  const html = buildPreviewHtml(slug, meta, extracted);
  const outPath = join(DIST, `canvas-preview-${slug}.html`);

  writeFileSync(outPath, html, 'utf-8');
  console.log(`Canvas preview written: ${outPath}`);
  console.log(`Open with: open ${outPath}`);
}

main();
