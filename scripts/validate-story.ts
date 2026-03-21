#!/usr/bin/env npx tsx
/**
 * validate-story.ts
 *
 * Validates a story against the article-package schema and checks site
 * integration (stories.json entry, Astro page, llms.txt entry).
 *
 * Usage:
 *   npx tsx scripts/validate-story.ts [slug]
 *   npx tsx scripts/validate-story.ts air-canada
 *   npx tsx scripts/validate-story.ts --package article-package.json
 *
 * Exit codes:
 *   0 = all checks pass
 *   1 = validation failures found
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = typeof import.meta.dirname === 'string' ? import.meta.dirname : dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoryEntry {
  slug: string;
  chapter: number;
  volume: number;
  title: string;
  deck: string;
  date: string;
  isoDate: string;
  readTime: string;
  emoji: string;
  tags: string[];
  story: string;
  storyDark: string;
  verifyText: string;
  sources: { label: string; url: string }[];
}

interface ValidationResult {
  check: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pass(check: string, message: string): ValidationResult {
  return { check, status: 'pass', message };
}

function fail(check: string, message: string): ValidationResult {
  return { check, status: 'fail', message };
}

function warn(check: string, message: string): ValidationResult {
  return { check, status: 'warn', message };
}

function readJSON<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

// ─── Checks ───────────────────────────────────────────────────────────────────

function checkStoriesJson(slug: string): ValidationResult[] {
  const results: ValidationResult[] = [];
  const jsonPath = join(ROOT, 'src/data/stories.json');

  if (!existsSync(jsonPath)) {
    return [fail('stories.json exists', `Not found: ${jsonPath}`)];
  }

  const stories = readJSON<StoryEntry[]>(jsonPath);
  const entry = stories.find(s => s.slug === slug);

  if (!entry) {
    return [fail('stories.json entry', `No entry with slug "${slug}" found in stories.json`)];
  }

  results.push(pass('stories.json entry', `Found entry for "${slug}"`));

  // Required string fields
  const requiredStrings: (keyof StoryEntry)[] = [
    'title', 'deck', 'date', 'isoDate', 'readTime', 'emoji', 'story', 'storyDark', 'verifyText'
  ];

  for (const field of requiredStrings) {
    const val = entry[field];
    if (!val || (typeof val === 'string' && val.trim() === '')) {
      results.push(fail(`stories.json:${field}`, `Field "${field}" is missing or empty`));
    } else {
      results.push(pass(`stories.json:${field}`, `"${field}" present`));
    }
  }

  // isoDate format
  if (entry.isoDate && !/^\d{4}-\d{2}-\d{2}$/.test(entry.isoDate)) {
    results.push(fail('stories.json:isoDate', `isoDate "${entry.isoDate}" is not ISO 8601 (YYYY-MM-DD)`));
  }

  // Hex color format
  const hexPattern = /^#[0-9a-fA-F]{3,6}$/;
  if (entry.story && !hexPattern.test(entry.story)) {
    results.push(fail('stories.json:story', `"story" color "${entry.story}" is not a valid hex`));
  }
  if (entry.storyDark && !hexPattern.test(entry.storyDark)) {
    results.push(fail('stories.json:storyDark', `"storyDark" color "${entry.storyDark}" is not a valid hex`));
  }

  // Tags
  if (!entry.tags || entry.tags.length === 0) {
    results.push(fail('stories.json:tags', 'No tags defined'));
  } else if (entry.tags.length > 5) {
    results.push(warn('stories.json:tags', `${entry.tags.length} tags — consider trimming to ≤ 5`));
  } else {
    results.push(pass('stories.json:tags', `${entry.tags.length} tag(s)`));
  }

  // Sources
  if (!entry.sources || entry.sources.length === 0) {
    results.push(fail('stories.json:sources', 'No sources defined'));
  } else {
    for (const [i, src] of entry.sources.entries()) {
      if (!src.label || !src.url) {
        results.push(fail(`stories.json:sources[${i}]`, `Source at index ${i} missing label or url`));
      }
    }
    results.push(pass('stories.json:sources', `${entry.sources.length} source(s)`));
  }

  // Deck length
  if (entry.deck && entry.deck.length > 160) {
    results.push(warn('stories.json:deck', `Deck is ${entry.deck.length} chars (recommended ≤ 160)`));
  }

  // Side
  const side = (entry as any).side;
  if (!side) {
    results.push(fail('stories.json:side', 'Field "side" is missing'));
  } else if (!['dark', 'light'].includes(side)) {
    results.push(fail('stories.json:side', `"side" must be "dark" or "light", got "${side}"`));
  } else {
    results.push(pass('stories.json:side', `Side is "${side}"`));
  }

  // Volume
  if (![1, 2, 3, 4, 5].includes(entry.volume)) {
    results.push(fail('stories.json:volume', `Volume ${entry.volume} is not 1, 2, 3, 4, or 5`));
  } else {
    results.push(pass('stories.json:volume', `Volume ${entry.volume}`));
  }

  // Chapter uniqueness
  const entrySide = (entry as any).side ?? 'dark';
  const chapterConflicts = stories.filter(s =>
    s.chapter === entry.chapter &&
    s.slug !== slug &&
    ((s as any).side ?? 'dark') === entrySide
  );
  if (chapterConflicts.length > 0) {
    results.push(fail('stories.json:chapter', `Chapter ${entry.chapter} is also used by: ${chapterConflicts.map(s => s.slug).join(', ')}`));
  } else {
    results.push(pass('stories.json:chapter', `Chapter ${entry.chapter} is unique within ${entrySide} side`));
  }

  return results;
}

function checkAstroPage(slug: string): ValidationResult[] {
  const results: ValidationResult[] = [];
  const pagePath = join(ROOT, `src/pages/stories/${slug}.astro`);

  if (!existsSync(pagePath)) {
    return [fail('astro page exists', `Not found: src/pages/stories/${slug}.astro`)];
  }

  results.push(pass('astro page exists', `Found src/pages/stories/${slug}.astro`));

  const content = readFileSync(pagePath, 'utf-8');

  // Check imports
  if (!content.includes("import StoryLayout from '../../layouts/StoryLayout.astro'")) {
    results.push(fail('astro:StoryLayout import', 'Missing StoryLayout import'));
  } else {
    results.push(pass('astro:StoryLayout import', 'StoryLayout imported'));
  }

  if (!content.includes("import stories from '../../data/stories.json'")) {
    results.push(fail('astro:stories import', 'Missing stories.json import'));
  } else {
    results.push(pass('astro:stories import', 'stories.json imported'));
  }

  // Check slug reference
  if (!content.includes(`s.slug === '${slug}'`)) {
    results.push(fail('astro:slug reference', `Missing stories.find(s => s.slug === '${slug}')`));
  } else {
    results.push(pass('astro:slug reference', 'Correct slug reference found'));
  }

  // Check canvas
  const canvasClass = `${slug}-canvas`;
  if (!content.includes(canvasClass)) {
    results.push(fail('astro:canvas', `Canvas class ".${canvasClass}" not found — canvas animation may be missing`));
  } else {
    results.push(pass('astro:canvas', `Canvas class ".${canvasClass}" found`));
  }

  // Check aria-hidden on canvas
  if (content.includes('<canvas') && !content.includes('aria-hidden="true"')) {
    results.push(warn('astro:canvas-aria', 'Canvas element found but aria-hidden="true" not detected'));
  }

  // Check prefers-reduced-motion
  if (content.includes('requestAnimationFrame') && !content.includes('prefers-reduced-motion')) {
    results.push(warn('astro:reduced-motion', 'Animation found but prefers-reduced-motion check not detected'));
  }

  // Check ResizeObserver
  if (content.includes('requestAnimationFrame') && !content.includes('ResizeObserver')) {
    results.push(warn('astro:resize-observer', 'Animation found but ResizeObserver not detected — canvas may not resize correctly'));
  }

  // Check for leftover placeholder
  if (content.includes('<!-- CANVAS:')) {
    results.push(warn('astro:canvas-placeholder', 'Canvas placeholder comment still present — was the canvas inserted?'));
  }

  // Check section structure
  const sectionCount = (content.match(/class="section"/g) ?? []).length;
  if (sectionCount === 0) {
    results.push(warn('astro:sections', 'No .section elements found — check story content structure'));
  } else {
    results.push(pass('astro:sections', `${sectionCount} section element(s) found`));
  }

  return results;
}

function checkLlmsTxt(slug: string): ValidationResult[] {
  const llmsPath = join(ROOT, 'public/llms.txt');

  if (!existsSync(llmsPath)) {
    return [warn('llms.txt exists', 'public/llms.txt not found')];
  }

  const content = readFileSync(llmsPath, 'utf-8');

  if (content.includes(`/stories/${slug}`)) {
    return [pass('llms.txt entry', `Story URL found in llms.txt`)];
  } else {
    return [fail('llms.txt entry', `No entry for /stories/${slug} in public/llms.txt`)];
  }
}

function checkIndexAstro(slug: string): ValidationResult[] {
  const indexPath = join(ROOT, 'src/pages/index.astro');

  if (!existsSync(indexPath)) {
    return [warn('index.astro exists', 'src/pages/index.astro not found')];
  }

  const content = readFileSync(indexPath, 'utf-8');

  if (content.includes(slug)) {
    return [pass('index.astro entry', `Slug "${slug}" referenced in index.astro`)];
  } else {
    return [fail('index.astro entry', `Slug "${slug}" not found in index.astro — story card may be missing`)];
  }
}

// ─── Reporter ─────────────────────────────────────────────────────────────────

function report(results: ValidationResult[], slug: string): boolean {
  const passes = results.filter(r => r.status === 'pass');
  const failures = results.filter(r => r.status === 'fail');
  const warnings = results.filter(r => r.status === 'warn');

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  validate-story: ${slug}`);
  console.log(`${'─'.repeat(60)}\n`);

  for (const r of results) {
    const icon = r.status === 'pass' ? '[PASS]' : r.status === 'fail' ? '[FAIL]' : '[WARN]';
    console.log(`${icon}  ${r.check}`);
    if (r.status !== 'pass') {
      console.log(`       ${r.message}`);
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${passes.length} passed  |  ${failures.length} failed  |  ${warnings.length} warnings`);

  if (failures.length === 0) {
    console.log(`  RESULT: PASS — story "${slug}" is ready for publication`);
  } else {
    console.log(`  RESULT: FAIL — fix ${failures.length} issue(s) before publishing`);
  }
  console.log(`${'─'.repeat(60)}\n`);

  return failures.length === 0;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npx tsx scripts/validate-story.ts [slug]');
    process.exit(1);
  }

  const slug = args[0].replace(/^--slug=/, '');

  const results: ValidationResult[] = [
    ...checkStoriesJson(slug),
    ...checkAstroPage(slug),
    ...checkLlmsTxt(slug),
    ...checkIndexAstro(slug),
  ];

  const passed = report(results, slug);
  process.exit(passed ? 0 : 1);
}

main();
