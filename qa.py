#!/usr/bin/env python3
"""
QA script for The AI Files.
Run before every deploy: python3 qa.py
Exits with code 1 if any checks fail.
"""
import os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
STORIES_DIR = os.path.join(ROOT, 'stories')

REQUIRED_IN_CSS = [
    '.story-verify',
    '.verify-badge',
    '.sources-block',
    '.sources-list',
]

REQUIRED_IN_HTML = [
    '<div class="story-verify">',
    'class="verify-badge"',
    '<div class="sources-block">',
    'class="sources-list"',
    'target="_blank"',
    'rel="noopener"',
    '<link rel="icon"',
    '/_vercel/insights/script.js',
]

REQUIRED_IN_INDEX = [
    'beehiiv',
    '/_vercel/insights/script.js',
    '<link rel="icon"',
    'vol-section',
    'featured',
]

errors = []

def check(filepath, label):
    with open(filepath) as f:
        content = f.read()

    # Separate CSS from HTML body for targeted checks
    css_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
    css = css_match.group(1) if css_match else ''

    if 'stories/' in filepath:
        for cls in REQUIRED_IN_CSS:
            if cls not in css:
                errors.append(f'{label}: missing CSS — {cls}')
        for el in REQUIRED_IN_HTML:
            if el not in content:
                errors.append(f'{label}: missing HTML — {el}')
    else:
        for el in REQUIRED_IN_INDEX:
            if el not in content:
                errors.append(f'{label}: missing — {el}')

# Check index.html
check(os.path.join(ROOT, 'index.html'), 'index.html')

# Check all story files
story_files = sorted(f for f in os.listdir(STORIES_DIR) if f.endswith('.html'))
for filename in story_files:
    check(os.path.join(STORIES_DIR, filename), f'stories/{filename}')

# Report
if errors:
    print(f'\n❌  QA FAILED — {len(errors)} issue(s) found:\n')
    for e in errors:
        print(f'  • {e}')
    print()
    sys.exit(1)
else:
    total = 1 + len(story_files)
    print(f'✓  QA passed — {total} files checked, no issues found.')
    sys.exit(0)
