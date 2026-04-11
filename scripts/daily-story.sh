#!/usr/bin/env bash
#
# daily-story.sh — launchd entrypoint for The AI Files daily story runner.
#
# Invoked by ~/Library/LaunchAgents/app.theaifiles.daily-story.plist at 2:13 AM local time.
# Starts a headless Claude Code session in the repo and instructs it to follow
# docs/workflows/daily-story-runner.md exactly.
#
# Logs to ~/Library/Logs/theaifiles-daily-story.log (rolled nightly by appending).
#
# Manual invocation (for testing):
#   bash scripts/daily-story.sh
#
# Dry run (prints what would happen without launching claude):
#   DRY_RUN=1 bash scripts/daily-story.sh

set -u
set -o pipefail

REPO="/Users/alontsang/AI/helloworld"
LOG="${HOME}/Library/Logs/theaifiles-daily-story.log"
LOCK="${HOME}/Library/Logs/theaifiles-daily-story.lock"
DATE_TAG=$(date +%Y-%m-%d_%H%M%S)

mkdir -p "$(dirname "$LOG")"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a "$LOG"
}

log "=== daily-story.sh start ${DATE_TAG} ==="

# Prevent overlapping runs (in case a previous run is still in progress)
if [ -e "$LOCK" ]; then
  log "LOCK file exists at $LOCK — previous run still in progress or crashed. Aborting."
  exit 1
fi
trap 'rm -f "$LOCK"' EXIT
touch "$LOCK"

cd "$REPO" || { log "FATAL: cannot cd to $REPO"; exit 1; }

# Make sure PATH has the tools we need (launchd runs with a minimal PATH)
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${HOME}/.local/bin:${HOME}/.bun/bin:$PATH"

# Sanity check: required binaries
for bin in claude gh git npx python3 mflux-generate-z-image-turbo; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    log "WARNING: '$bin' not on PATH — runner may fail"
  fi
done

if [ "${DRY_RUN:-0}" = "1" ]; then
  log "DRY_RUN=1 — would invoke claude with daily runner playbook. Exiting."
  exit 0
fi

# The prompt tells the headless Claude session to read and follow the playbook.
# We keep the prompt short — all logic lives in docs/workflows/daily-story-runner.md.
PROMPT='You are running the daily story runner for The AI Files.

Read /Users/alontsang/AI/helloworld/docs/workflows/daily-story-runner.md in full and follow it step by step, from Section 1 through Section 12. That document is self-contained and authoritative.

Your working directory is /Users/alontsang/AI/helloworld. Today is '"$(date '+%Y-%m-%d')"'.

Hard constraints:
- Never soften an editorial gate to hit the daily cadence. Skip the day if no pitch clears the gates.
- Open the PR against main. Do not merge.
- Send exactly one Telegram notification at the end summarizing the outcome.
- All mflux image generation runs locally on this Mac mini; do not substitute a cloud API.
- Work is complete when a PR is open with a Vercel preview and the user has received the Telegram notification, OR the day is cleanly skipped with a Telegram explanation.

Begin.'

log "Invoking claude -p (headless) with daily runner prompt"

# --dangerously-skip-permissions is necessary for unattended runs — this host is a
# trusted mac mini, the repo is scoped, and the prompt explicitly constrains the session.
# --max-budget-usd caps runaway spend per run.
claude -p \
  --dangerously-skip-permissions \
  --max-budget-usd 25 \
  --add-dir "$REPO" \
  --effort high \
  "$PROMPT" \
  >> "$LOG" 2>&1

STATUS=$?

log "claude exited with status ${STATUS}"
log "=== daily-story.sh end ${DATE_TAG} ==="
log ""

exit "$STATUS"
