# Daily Story Runner — Playbook

This document is the exact, self-contained instruction set the scheduled Claude session follows each day at 2:13 AM to produce one new story for The AI Files, open a pull request with a Vercel preview, and notify the user via Telegram.

> **Mission:** Draft and open a PR for exactly one new story per day. Maintain full editorial rigor. No slop. If no pitch clears the gates, skip the day and notify — do not publish a weak story to hit the cadence.

---

## 0. Environment

- **Working directory:** `/Users/alontsang/AI/helloworld`
- **Branch target:** `main`
- **Daily branch name:** `daily/YYYY-MM-DD-[slug]` where `[slug]` is the slug of the chosen pitch
- **Backlog file:** `story-backlog.json` at repo root
- **Run log:** `~/Library/Logs/theaifiles-daily-story.log` (append-only — shell script handles redirection)
- **Notification channel:** Telegram DM to allowlisted chat `8507395629`
- **Success criterion:** a PR is open against `main` with all editorial gates green AND the user has received a Telegram notification with the preview URL. Or: the day was skipped with a Telegram explanation.

---

## 1. Update the working copy

```bash
cd /Users/alontsang/AI/helloworld
git fetch origin
git checkout main
git pull --ff-only origin main
```

If the pull fails, stop immediately and send a Telegram notification: `Daily runner FAILED to sync main — manual intervention needed.` Do not proceed.

---

## 2. Refresh and reprioritize the backlog

**Read** `story-backlog.json`.

### 2a. Freshness decay

For each item currently `pending`, recompute `freshnessScore`:
- If the pitch has a `sources` entry with a date within the last 30 days → high freshness (9–10)
- 30–90 days → medium (6–8)
- 90–180 days → modest (4–6)
- Older than 180 days → decayed (2–4)
- If no source date is available, leave freshness unchanged

### 2b. Short news sweep

Perform **one** WebSearch query for fresh AI incidents in the last 24–72 hours, e.g.:
- `"AI incident OR lawsuit OR breakthrough site:*.com 2026"`
- Filter: prefer primary-source publishers (Anthropic, OpenAI, DeepMind, arXiv, court docket, major news orgs with named reporters).

If a genuinely new, high-importance pitch surfaces that beats anything currently in the backlog:
- Append it to `items[]` with `status: "pending"`, a conservative `compositeScore` (do not over-score unknowns), `priority: 1`, and the URL(s) found.
- Demote all existing items by 1 priority rank.

Hard cap: **add no more than 2 new items per daily run**. This runner is not a news aggregator — its job is to publish, not to hoard.

### 2c. Re-rank

Sort `pending` items by:
1. `compositeScore` descending
2. `freshnessScore` descending
3. `priority` ascending (lower = earlier)

Write the updated backlog back to disk. Commit the change directly to `main` with message: `chore(backlog): daily refresh YYYY-MM-DD`. Push.

---

## 3. Pick a pitch

Iterate through the sorted `pending` items in order. For each candidate, before committing to draft it:

### 3a. Check for duplicates

Search `src/data/stories.json` for any existing slug or title that overlaps with the candidate. If you find a real duplicate, mark the candidate `status: "rejected"`, `rejectionReason: "duplicate of [existing slug]"`, and move on.

### 3b. Check the gates threshold

If `compositeScore < gates.minCompositeScore` (default 7.5), mark the candidate `status: "rejected"`, `rejectionReason: "composite below threshold"`, and move on.

### 3c. Accept the candidate

Mark the accepted candidate `status: "in_progress"`, record `startedAt` as the current ISO timestamp, and commit+push the backlog update (so re-entry doesn't re-pick it).

**Attempt budget:** You may attempt **up to 3 pitches** per run. If the first fails downstream gates, mark it `rejected` with the reason, accept the next, and try again. After 3 attempts in one run, stop — do not publish, and send the skip notification in Step 10.

---

## 4. Create the daily branch

```bash
SLUG="[chosen-slug]"
DATE=$(date +%Y-%m-%d)
BRANCH="daily/${DATE}-${SLUG}"
git checkout -b "${BRANCH}"
```

---

## 5. Run the full new-story pipeline

Invoke the `new-story` skill with the candidate's thesis, sources, and working title passed as the pre-researched pitch so the assignment-editor stage is skipped cleanly.

**Every gate must pass on its own merits. Do not soften any gate to hit the daily cadence.**

- Source critic verdict must be `go` or `go-with-caveats`. A `no-go` is a hard stop for this pitch — apply `status: "rejected"` with the specific reason from the source critic, commit the backlog update, and return to Step 3 for the next candidate.
- Copy editor must return `PASS` (or `NEEDS-REVISION` followed by successful revisions applied in-place).
- Fact checker must return `PASS` or `FAIL` with only correctable errors that are then fixed in-place.
- Security scanner must return `PASS`.
- Accessibility auditor must return `PASS`.

If any structural gate fails (fabricated claim, security CRITICAL, accessibility Serious that cannot be auto-fixed in one pass), mark the pitch rejected and move on.

---

## 6. Generate the card image locally (mflux)

The new-story skill's Step 9b uses the `generate-image` skill with mflux on Apple Silicon. This runs on the Mac mini locally — do not substitute a cloud API without explicit permission.

Image must be saved to `public/images/cards/[slug].png` at 1024×1024. Z-Image Turbo is the preferred model for abstract editorial art.

---

## 7. Validate and build

```bash
npx tsx scripts/validate-story.ts "${SLUG}"
npm run build
python3 qa.py
```

- `validate-story.ts` must print `RESULT: PASS`. The only warning allowed is the `public/llms.txt not found` notice (expected — llms.txt is generated at build time).
- `npm run build` must report a clean build. Note the page count — should be `previous_count + 1`.
- `python3 qa.py` must print `QA passed`.

If any of these fail and the failure is not auto-fixable in one pass, mark the pitch rejected and move on.

---

## 8. Push the branch and open a PR

```bash
git add src/pages/stories/"${SLUG}".astro \
        src/data/stories.json \
        src/pages/index.astro \
        public/images/cards/"${SLUG}".png

# Include scripts/validate-story.ts only if it was modified (e.g., a new Vol was opened)
git diff --cached --name-only | grep -q scripts/validate-story.ts || true

git commit -m "Add ${SLUG} story

[short summary of angle from the draft]

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"

git push -u origin "${BRANCH}"

gh pr create \
  --base main \
  --head "${BRANCH}" \
  --title "[Daily $(date +%Y-%m-%d)] ${STORY_TITLE}" \
  --body "$(cat <<'BODY'
## Daily Story

**Working title:** {title}
**Slug:** `{slug}`
**Side / Volume / Chapter:** {side} Vol {vol} Ch {ch}
**Angle:** {one-sentence angle}

### Editorial gates

- [x] Source critic: **{verdict}**
- [x] Copy editor: **PASS**
- [x] Fact checker: **PASS**
- [x] Security scan: **PASS**
- [x] Accessibility audit: **PASS**
- [x] Validation script: **PASS**
- [x] Build: **{N} pages built**
- [x] qa.py: **PASS**

### Review

- [ ] Read the story on the Vercel preview (URL in the Vercel bot comment below)
- [ ] Merge if approved, close if not

Working files are not committed (draft, research bundle, fact-check report, etc. remain in the repo root as untracked).
BODY
)"
```

Replace the placeholders (`{title}`, `{slug}`, etc.) with the actual values from the drafted story.

---

## 9. Wait briefly for the Vercel preview URL

Vercel automatically deploys PR branches. Wait up to 3 minutes for the preview URL to appear.

```bash
PR_URL=$(gh pr view --json url --jq .url)

for i in 1 2 3 4 5 6; do
  PREVIEW_URL=$(gh pr view --json statusCheckRollup --jq '.statusCheckRollup[] | select(.context=="Vercel") | .targetUrl // empty' 2>/dev/null)
  if [ -n "$PREVIEW_URL" ]; then
    break
  fi
  sleep 30
done
```

If no preview URL after 3 minutes, fall back to the PR URL in the notification and note `(preview pending)`.

---

## 10. Notify via Telegram

Send a Telegram reply to the allowlisted chat `8507395629` using the `mcp__plugin_telegram_telegram__reply` tool. The message must include:

- Story title
- One-sentence thesis
- Preview URL (or PR URL if preview is still pending)
- Merge link (the PR URL)
- Compact gate summary (source-critic, fact-check, a11y all ✓)

**Example success notification:**

```
🌅 New story ready for review — {DATE}

{STORY_TITLE}
{one-sentence thesis}

Preview → {PREVIEW_URL}
Merge →   {PR_URL}

Gates: source ✓ facts ✓ a11y ✓ security ✓ build ✓
```

**Example skip notification (no pitch cleared gates):**

```
⚠️ Daily runner — {DATE}

No pitch cleared the editorial gates today.
Attempts: {N}/3
Reasons: {brief per-pitch rejection reasons}

Backlog needs fresh pitches — next run tomorrow 2:13 AM.
```

**Example sync failure notification:**

```
🛑 Daily runner — {DATE}

FAILED before drafting: {git/pull/environment error}

Manual intervention needed.
```

Do not post status updates during the run — only the single terminal notification per run. Failures mid-run should roll up into one notification at the end.

---

## 11. Update the backlog status

After a successful PR is opened, set the pitch's `status` from `in_progress` to `published`, record `publishedAt` as the current ISO timestamp, and record `prUrl`. Commit this backlog change directly to `main` (not the feature branch).

---

## 12. Exit

Exit cleanly. Return to the prompt with a short one-line summary of what happened: which pitch was drafted, the PR URL, and whether the Telegram notification succeeded. The shell wrapper captures this to the run log.

---

## Hard rules

1. **Never lower a gate.** If the story fails source-critic, fact-check, copy-edit, security, or a11y, the correct action is to reject the pitch and try the next one. Never soften a verdict.
2. **Never publish a rushed image.** The mflux generation takes 12–17 minutes on this Mac. Do not substitute a cloud API. Wait for it.
3. **Never push to `main` directly except for backlog updates** (Steps 2c and 11). All stories land via PR.
4. **Never skip the duplicate check.** The archive has 44 stories as of the last manual count; slugs must be unique and titles must not silently overlap.
5. **Never send more than one Telegram notification per run.** Roll up status into the single terminal message.
6. **Do not expand the scope of the run.** One story per day. If the runner finishes early, stop — do not draft a second story.
7. **Do not modify CLAUDE.md, SKILL.md files, or agent definitions** from inside a daily run. Those are authored by the user.

---

## Failure escalation

- **Three pitch rejections in one run** → skip day, notify with reasons
- **Three skipped days in a row** → include in that day's notification: `⚠️ 3 consecutive skipped days — backlog likely exhausted, please refill`
- **Pipeline crash mid-run** → best-effort Telegram notification with the stage it crashed at and the error summary; do not leave the branch in an in-between state — either complete the PR or delete the branch

## Observability

After each run, append a one-line summary to `~/Library/Logs/theaifiles-daily-story.log` with:
- timestamp
- chosen slug (or `SKIP`)
- outcome (`published`, `rejected:[reason]`, `skip:[reason]`, `crash:[stage]`)
- pr_url (if applicable)
- elapsed seconds

The shell wrapper handles the log redirection — you just need to print a tagged final line like:
`DAILY-RUN-SUMMARY: slug=claude-blackmail-study outcome=published pr=https://... elapsed=1847`
