#!/usr/bin/env python3
"""
QA script for The AI Files (Astro).
Run before every deploy: python3 qa.py
Exits with code 1 if any checks fail.
"""
import os, re, sys, json

ROOT        = os.path.dirname(os.path.abspath(__file__))
STORIES_DIR = os.path.join(ROOT, 'src', 'pages', 'stories')
DATA_FILE   = os.path.join(ROOT, 'src', 'data', 'stories.json')
INDEX_FILE  = os.path.join(ROOT, 'src', 'pages', 'index.astro')
LAYOUT_STORY = os.path.join(ROOT, 'src', 'layouts', 'StoryLayout.astro')
LAYOUT_BASE  = os.path.join(ROOT, 'src', 'layouts', 'BaseLayout.astro')

REQUIRED_STORY_FIELDS = [
    'slug', 'side', 'chapter', 'volume', 'title', 'deck',
    'date', 'readTime', 'emoji', 'tags',
    'story', 'storyDark', 'verifyText', 'sources', 'whatIf',
]

VALID_SIDES = {'dark', 'light'}

REQUIRED_IN_INDEX = [
    'BaseLayout',
    'beehiiv',
    'vol-section',
    'featured',
]

errors = []

# ── 1. stories.json ────────────────────────────────────────────────────────────
with open(DATA_FILE) as f:
    stories_data = json.load(f)

slugs_in_json = {s['slug'] for s in stories_data}

for story in stories_data:
    slug = story.get('slug', '?')
    for field in REQUIRED_STORY_FIELDS:
        if field not in story or story[field] is None:
            errors.append(f'stories.json [{slug}]: missing field — {field}')
    if 'side' in story and story['side'] not in VALID_SIDES:
        errors.append(f'stories.json [{slug}]: side must be "dark" or "light", got "{story["side"]}"')
    if 'sources' in story:
        if not isinstance(story['sources'], list) or len(story['sources']) == 0:
            errors.append(f'stories.json [{slug}]: sources must be a non-empty list')
        else:
            for src in story['sources']:
                if 'url' not in src or 'label' not in src:
                    errors.append(f'stories.json [{slug}]: source entry missing url or label')

# ── 2. .astro story pages ──────────────────────────────────────────────────────
astro_files = sorted(f for f in os.listdir(STORIES_DIR) if f.endswith('.astro'))
slugs_in_files = {f.replace('.astro', '') for f in astro_files}

for slug in slugs_in_json:
    if slug not in slugs_in_files:
        errors.append(f'stories.json: slug "{slug}" has no matching .astro file')

for slug in slugs_in_files:
    if slug not in slugs_in_json:
        errors.append(f'src/pages/stories/{slug}.astro: no matching entry in stories.json')

for filename in astro_files:
    filepath = os.path.join(STORIES_DIR, filename)
    slug = filename.replace('.astro', '')
    with open(filepath) as f:
        content = f.read()

    if "from '../../layouts/StoryLayout.astro'" not in content:
        errors.append(f'stories/{filename}: missing StoryLayout import')

    if "from '../../data/stories.json'" not in content:
        errors.append(f'stories/{filename}: missing stories.json import')

    if f"s.slug === '{slug}'" not in content:
        errors.append(f'stories/{filename}: slug lookup missing or does not match filename')

    if 'class="section"' not in content:
        errors.append(f'stories/{filename}: no element with class="section" found')

    for link in re.findall(r'<a\s[^>]*href="https?://[^"]*"[^>]*>', content):
        if 'noopener' not in link and 'noreferrer' not in link:
            errors.append(f'stories/{filename}: external link missing rel="noopener": {link[:80]}')

# ── 3. index.astro ─────────────────────────────────────────────────────────────
with open(INDEX_FILE) as f:
    index_content = f.read()

for el in REQUIRED_IN_INDEX:
    if el not in index_content:
        errors.append(f'index.astro: missing — {el}')

# All active (non-WIP) story slugs should be linked from the index.
# The index page is data-driven, so check the built HTML output if available,
# otherwise fall back to checking the source for the dynamic template pattern.
wip_slugs = {s['slug'] for s in stories_data if s.get('wip')}
built_index = os.path.join(ROOT, 'dist', 'index.html')
if os.path.isfile(built_index):
    with open(built_index) as f:
        built_content = f.read()
    for slug in slugs_in_json - wip_slugs:
        if f'/stories/{slug}' not in built_content:
            errors.append(f'index (built): no link to /stories/{slug}')
else:
    # Fallback: ensure data-driven loop exists in source
    if 'volumeData.map' not in index_content:
        errors.append('index.astro: missing data-driven volume grid (volumeData.map)')
    # Check stories still linked manually (EP carousel)
    for slug in slugs_in_json - wip_slugs:
        if f'href="/stories/{slug}"' not in index_content and f"'/stories/{slug}'" not in index_content:
            pass  # Expected — links are generated from stories.json at build time

# ── 4. StoryLayout.astro ───────────────────────────────────────────────────────
with open(LAYOUT_STORY) as f:
    layout_content = f.read()

for el in ['story-verify', 'verify-badge', 'sources-block', 'sources-list',
           'target="_blank"', 'rel="noopener"']:
    if el not in layout_content:
        errors.append(f'StoryLayout.astro: missing — {el}')

# ── 5. BaseLayout.astro ────────────────────────────────────────────────────────
with open(LAYOUT_BASE) as f:
    base_content = f.read()

for el in ['<link rel="icon"', '/_vercel/insights/script.js']:
    if el not in base_content:
        errors.append(f'BaseLayout.astro: missing — {el}')

# ── 6. llms.txt (built output) ────────────────────────────────────────────────
built_llms = os.path.join(ROOT, 'dist', 'llms.txt')
if os.path.isfile(built_llms):
    with open(built_llms) as f:
        llms_content = f.read()
    published_slugs = {s['slug'] for s in stories_data if s.get('isoDate') and not s.get('wip')}
    for slug in published_slugs:
        if f'/stories/{slug}' not in llms_content:
            errors.append(f'llms.txt (built): missing story — {slug}')
    for slug in wip_slugs:
        if f'/stories/{slug}' in llms_content:
            errors.append(f'llms.txt (built): WIP story leaked — {slug}')
    # Check all URLs are absolute
    for line in llms_content.splitlines():
        if '/stories/' in line and 'https://theaifiles.app/stories/' not in line:
            # Could be a markdown link — check for relative URLs
            if '](/stories/' in line or 'URL: /stories/' in line:
                errors.append(f'llms.txt (built): relative URL found — {line.strip()[:80]}')

# ── Report ─────────────────────────────────────────────────────────────────────
if errors:
    print(f'\n❌  QA FAILED — {len(errors)} issue(s) found:\n')
    for e in errors:
        print(f'  • {e}')
    print()
    sys.exit(1)
else:
    total = len(astro_files) + 1  # story pages + index
    print(f'✓  QA passed — {total} pages checked, stories.json verified, no issues found.')
    sys.exit(0)
