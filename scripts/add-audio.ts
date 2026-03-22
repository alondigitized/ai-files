#!/usr/bin/env npx tsx
/**
 * add-audio.ts
 *
 * Generates NotebookLM Brief audio narrations for AI Files stories using
 * Playwright browser automation. Replaces the manual browser-extension workflow.
 *
 * Usage:
 *   npx tsx scripts/add-audio.ts --auth                  # Save Google auth (headed)
 *   npx tsx scripts/add-audio.ts sydney                  # Single story
 *   npx tsx scripts/add-audio.ts sydney captcha           # Multiple stories
 *   npx tsx scripts/add-audio.ts --all                   # All stories without audio
 *   npx tsx scripts/add-audio.ts --all --commit          # Process + git commit+push
 *   npx tsx scripts/add-audio.ts --dry-run --all         # List what would be processed
 *
 * Flags:
 *   --auth      Save Google session only (headed browser)
 *   --all       Process all stories missing audio
 *   --commit    Git add, commit, and push after processing
 *   --headed    Run browser visibly (useful for debugging)
 *   --force     Process even if audio field already exists
 *   --dry-run   List slugs without processing
 *
 * Exit codes:
 *   0 = all succeeded
 *   1 = some failures
 */

import { readFileSync, writeFileSync, existsSync, statSync, unlinkSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createInterface } from 'readline';

const __dirname = typeof import.meta.dirname === 'string'
  ? import.meta.dirname
  : dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── Config ──────────────────────────────────────────────────────────────────

const AUTH_PATH = join(ROOT, '.claude', 'notebooklm-auth.json');
const STORIES_PATH = join(ROOT, 'src', 'data', 'stories.json');
const AUDIO_DIR = join(ROOT, 'public', 'audio');
const SITE_URL = 'https://theaifiles.app';
const NOTEBOOKLM_URL = 'https://notebooklm.google.com/';
const FFMPEG = 'ffmpeg';
const GENERATION_TIMEOUT = 300_000; // 5 min
const GENERATION_POLL = 5_000;      // 5s

// ─── Types ───────────────────────────────────────────────────────────────────

interface StoryEntry {
  slug: string;
  audio?: string;
  [key: string]: unknown;
}

interface ProcessResult {
  slug: string;
  status: 'success' | 'skipped' | 'failed';
  message: string;
  duration?: string;
  size?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readStories(): StoryEntry[] {
  return JSON.parse(readFileSync(STORIES_PATH, 'utf-8'));
}

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

// Use a copy of the Chrome profile to avoid "already in use" lock conflicts
const CHROME_PROFILE = join(process.env.HOME || '', 'Library/Application Support/Google/Chrome');
const PW_PROFILE = join(ROOT, '.claude', 'pw-chrome-profile');

async function launchWithProfile(headed: boolean): Promise<{ context: any; isNew: boolean }> {
  const { chromium } = await import('playwright');

  // Copy Chrome profile on first run so we get existing Google login session
  if (!existsSync(PW_PROFILE)) {
    console.log('  Copying Chrome profile for first-time setup...');
    execSync(`cp -R "${CHROME_PROFILE}" "${PW_PROFILE}"`, { stdio: 'pipe' });
    // Remove lock files that would conflict
    const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];
    for (const f of lockFiles) {
      const p = join(PW_PROFILE, f);
      if (existsSync(p)) unlinkSync(p);
    }
  }

  const context = await chromium.launchPersistentContext(PW_PROFILE, {
    channel: 'chrome',
    headless: !headed,
    slowMo: 100,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  return { context, isNew: false };
}

async function ensureAuth(context: any): Promise<void> {
  const page = await context.newPage();
  await page.goto(NOTEBOOKLM_URL);
  await page.waitForLoadState('networkidle');

  const isAuthed = await page.getByText(/create new/i).isVisible({ timeout: 15000 }).catch(() => false);
  await page.close();

  if (!isAuthed) {
    console.log('\n  Not logged into Google. Please log in in the browser window.');
    const authPage = await context.newPage();
    await authPage.goto('https://accounts.google.com');
    await prompt('  Press Enter after you have logged in...');
    await authPage.close();

    // Verify
    const checkPage = await context.newPage();
    await checkPage.goto(NOTEBOOKLM_URL);
    await checkPage.waitForLoadState('networkidle');
    const ok = await checkPage.getByText(/create new/i).isVisible({ timeout: 10000 }).catch(() => false);
    await checkPage.close();

    if (!ok) {
      console.error('  Auth verification failed.');
      process.exit(1);
    }
    console.log('  Auth verified successfully.\n');
  }
}

// ─── NotebookLM Automation ──────────────────────────────────────────────────

async function createNotebookWithSource(page: any, slug: string): Promise<void> {
  // Navigate to NotebookLM home
  await page.goto(NOTEBOOKLM_URL);
  await page.waitForLoadState('networkidle');

  // Click "Create new notebook"
  await page.getByText(/create new notebook/i).first().click();
  await page.waitForURL(/notebook\/.*addSource/, { timeout: 15000 });

  // Click "Websites" source option
  await page.getByRole('button', { name: /websites/i }).click();
  await page.waitForTimeout(1000);

  // Type the story URL
  const storyUrl = `${SITE_URL}/stories/${slug}`;
  const urlInput = page.locator('textarea, input[type="url"]').first();
  await urlInput.fill(storyUrl);

  // Click Insert
  await page.getByRole('button', { name: /insert/i }).click();

  // Wait for source to be ingested (URL disappears from the dialog, source appears in panel)
  await page.waitForURL(/notebook\/[^?]+$/, { timeout: 30000 });
  await page.waitForTimeout(2000);
}

async function generateBriefAudio(page: any): Promise<void> {
  // Click Audio Overview arrow to open customization
  await page.locator('text=Audio Overview').first().click();
  await page.waitForTimeout(2000);

  // Use JS injection to select Brief (proven reliable — Material radio buttons)
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('*')) {
      if (el.textContent?.trim() === 'Brief' &&
          (el.closest('[role="radiogroup"]') || el.closest('[role="radio"]'))) {
        (el as HTMLElement).click();
        break;
      }
    }
  });
  await page.waitForTimeout(500);

  // Click Generate
  await page.getByRole('button', { name: /generate/i }).click();
}

async function waitForGeneration(page: any): Promise<void> {
  // Wait for the audio to appear — indicated by a Play button in the Studio panel
  await page.waitForFunction(() => {
    // Check for play button (generation complete)
    const playBtn = document.querySelector('button[aria-label*="Play"]');
    if (playBtn) return true;
    // Check for any audio element with Brief label
    const studioText = document.querySelector('[class*="studio"], [role="complementary"]');
    if (studioText && /Brief.*source/i.test(studioText.textContent || '')) return true;
    return false;
  }, { timeout: GENERATION_TIMEOUT, polling: GENERATION_POLL });
}

async function downloadAudio(page: any, slug: string): Promise<string> {
  const rawPath = join(AUDIO_DIR, `${slug}-raw.m4a`);

  // Click the 3-dot menu
  const moreBtn = page.locator('button[aria-label*="More"], button[aria-label*="more"]')
    .filter({ has: page.locator('text=more_vert').or(page.locator('[data-icon="more_vert"]')) })
    .first();

  // Fallback: try finding any More button near the audio area
  const moreBtnAlt = page.locator('button').filter({ hasText: /^$/ })
    .locator('visible=true')
    .last();

  // Try primary, then fallback
  const btnToClick = await moreBtn.isVisible({ timeout: 3000 }).catch(() => false)
    ? moreBtn : moreBtnAlt;

  // Set up download listener before clicking
  const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

  await btnToClick.click();
  await page.waitForTimeout(500);

  // Click Download menu item
  await page.getByText('Download').click();

  // Wait for and save the download
  const download = await downloadPromise;
  await download.saveAs(rawPath);

  return rawPath;
}

// ─── ffmpeg Processing ──────────────────────────────────────────────────────

function optimizeAudio(inputPath: string, outputPath: string): { duration: string; size: string } {
  execSync(
    `${FFMPEG} -y -i "${inputPath}" -c:a aac -b:a 96k -movflags +faststart "${outputPath}" 2>&1`,
    { stdio: 'pipe' }
  );

  // Get duration
  const probeOutput = execSync(
    `ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outputPath}"`,
    { encoding: 'utf-8' }
  ).trim();
  const durationSec = parseFloat(probeOutput);
  const duration = fmt(durationSec);

  const stats = statSync(outputPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(1);

  // Clean up raw file
  unlinkSync(inputPath);

  return { duration, size: `${sizeMB}MB` };
}

// ─── stories.json Update ────────────────────────────────────────────────────

function updateStoriesJson(slug: string): void {
  let content = readFileSync(STORIES_PATH, 'utf-8');

  // Check if audio field already exists for this slug
  const audioPattern = new RegExp(`"slug":\\s*"${slug}"[\\s\\S]*?"audio":`);
  if (audioPattern.test(content)) {
    // Replace existing audio value
    content = content.replace(
      new RegExp(`("slug":\\s*"${slug}"[\\s\\S]*?"audio":\\s*)"[^"]*"`),
      `$1"/audio/${slug}.m4a"`
    );
  } else {
    // Insert audio field after slug line
    content = content.replace(
      `"slug": "${slug}",`,
      `"slug": "${slug}",\n    "audio": "/audio/${slug}.m4a",`
    );
  }

  writeFileSync(STORIES_PATH, content, 'utf-8');
}

// ─── Process a Single Story ─────────────────────────────────────────────────

async function processStory(page: any, slug: string): Promise<ProcessResult> {
  try {
    console.log(`\n  [${'='.repeat(50)}]`);
    console.log(`  Processing: ${slug}`);
    console.log(`  [${'='.repeat(50)}]`);

    console.log(`  [1/5] Creating notebook + adding source...`);
    await createNotebookWithSource(page, slug);

    console.log(`  [2/5] Selecting Brief format + generating...`);
    await generateBriefAudio(page);

    console.log(`  [3/5] Waiting for generation (up to 5 min)...`);
    await waitForGeneration(page);

    console.log(`  [4/5] Downloading audio...`);
    const rawPath = await downloadAudio(page, slug);

    console.log(`  [5/5] Optimizing with ffmpeg...`);
    const outputPath = join(AUDIO_DIR, `${slug}.m4a`);
    const { duration, size } = optimizeAudio(rawPath, outputPath);

    updateStoriesJson(slug);

    console.log(`  Done: ${slug} (${duration}, ${size})`);
    return { slug, status: 'success', message: 'Generated and optimized', duration, size };

  } catch (err: any) {
    console.error(`  FAILED: ${slug} — ${err.message}`);
    await page.screenshot({ path: join(ROOT, `debug-${slug}.png`) }).catch(() => {});
    return { slug, status: 'failed', message: err.message };
  }
}

// ─── Reporter ───────────────────────────────────────────────────────────────

function reportResults(results: ProcessResult[]): void {
  const succeeded = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');
  const skipped = results.filter(r => r.status === 'skipped');

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  add-audio: batch complete`);
  console.log(`${'─'.repeat(60)}\n`);

  for (const r of results) {
    const icon = r.status === 'success' ? '[DONE]' : r.status === 'skipped' ? '[SKIP]' : '[FAIL]';
    const detail = r.duration ? ` (${r.duration}, ${r.size})` : '';
    console.log(`  ${icon}  ${r.slug}${detail}`);
    if (r.status === 'failed') console.log(`         ${r.message}`);
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${succeeded.length} succeeded  |  ${failed.length} failed  |  ${skipped.length} skipped`);
  console.log(`${'─'.repeat(60)}\n`);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: npx tsx scripts/add-audio.ts [slug|--all|--auth]');
    console.log('  npx tsx scripts/add-audio.ts --auth            Save Google auth');
    console.log('  npx tsx scripts/add-audio.ts sydney             Single story');
    console.log('  npx tsx scripts/add-audio.ts --all              All without audio');
    console.log('  npx tsx scripts/add-audio.ts --all --commit     Process + push');
    console.log('  npx tsx scripts/add-audio.ts --dry-run --all    List only');
    process.exit(1);
  }

  const flags = {
    auth: args.includes('--auth'),
    all: args.includes('--all'),
    commit: args.includes('--commit'),
    headed: args.includes('--headed'),
    force: args.includes('--force'),
    dryRun: args.includes('--dry-run'),
  };

  const stories = readStories();

  // Determine slugs to process
  let slugs: string[];
  if (flags.all) {
    slugs = stories.filter(s => !s.audio).map(s => s.slug);
  } else {
    slugs = args.filter(a => !a.startsWith('--'));
    for (const slug of slugs) {
      if (!stories.find(s => s.slug === slug)) {
        console.error(`Unknown slug: ${slug}`);
        process.exit(1);
      }
    }
  }

  // Skip stories that already have audio (unless --force)
  if (!flags.force && !flags.auth) {
    slugs = slugs.filter(slug => {
      const story = stories.find(s => s.slug === slug);
      if (story?.audio) {
        console.log(`  [SKIP]  ${slug} — already has audio`);
        return false;
      }
      return true;
    });
  }

  if (flags.dryRun) {
    console.log(`\nWould process ${slugs.length} stories:`);
    slugs.forEach(s => console.log(`  - ${s}`));
    process.exit(0);
  }

  // Launch browser with Chrome profile (reuses existing Google login)
  const useHeaded = flags.headed || flags.auth;
  const { context } = await launchWithProfile(useHeaded);

  await ensureAuth(context);

  if (flags.auth) {
    console.log('Auth verified successfully.');
    await context.close();
    process.exit(0);
  }

  if (slugs.length === 0) {
    console.log('\nNo stories to process.');
    await context.close();
    process.exit(0);
  }

  console.log(`\nProcessing ${slugs.length} stories...\n`);

  const page = await context.newPage();
  const results: ProcessResult[] = [];

  for (const slug of slugs) {
    const result = await processStory(page, slug);
    results.push(result);

    // Brief pause between stories
    if (slugs.indexOf(slug) < slugs.length - 1) {
      await page.waitForTimeout(3000);
    }
  }

  reportResults(results);

  // Optional commit
  if (flags.commit && results.some(r => r.status === 'success')) {
    const successSlugs = results.filter(r => r.status === 'success').map(r => r.slug);
    const audioFiles = successSlugs.map(s => `public/audio/${s}.m4a`).join(' ');
    execSync(`git add src/data/stories.json ${audioFiles}`, { cwd: ROOT });
    const msg = successSlugs.length === 1
      ? `Add NotebookLM audio narration for ${successSlugs[0]} story`
      : `Add NotebookLM audio narration for ${successSlugs.length} stories`;
    execSync(`git commit -m "${msg}\n\nCo-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"`, { cwd: ROOT });
    execSync(`git push`, { cwd: ROOT });
    console.log('Committed and pushed.');
  }

  await context.close();
  process.exit(results.some(r => r.status === 'failed') ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
