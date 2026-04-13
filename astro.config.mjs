import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const stories = require('./src/data/stories.json');
const wipSlugs = stories.filter(s => s.wip).map(s => s.slug);

// Build a slug→isoDate map for sitemap <lastmod> emission.
// Falls back to build time for non-story pages.
const slugToIsoDate = Object.fromEntries(
  stories.filter(s => s.isoDate).map(s => [s.slug, s.isoDate])
);
const buildTime = new Date().toISOString().slice(0, 10);

// Update this to your production domain
const SITE = 'https://theaifiles.app';

export default defineConfig({
  site: SITE,
  integrations: [
    sitemap({
      changefreq: 'weekly',
      filter: (page) => !wipSlugs.some(slug => page.includes(`/stories/${slug}`)),
      serialize(item) {
        // Per-story lastmod from isoDate
        const storyMatch = item.url.match(/\/stories\/([^/]+)\/?$/);
        if (storyMatch && slugToIsoDate[storyMatch[1]]) {
          const lastmod = slugToIsoDate[storyMatch[1]];
          if (item.url === `${SITE}/`) return { ...item, priority: 1.0, lastmod };
          return { ...item, priority: 0.9, lastmod };
        }

        // Non-story pages: use build time so Google knows the index refreshed
        if (item.url === `${SITE}/`) return { ...item, priority: 1.0, lastmod: buildTime };
        if (item.url.includes('/stories/')) return { ...item, priority: 0.9, lastmod: buildTime };
        return { ...item, priority: 0.7, lastmod: buildTime };
      },
    }),
  ],
});
