import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const stories = require('./src/data/stories.json');
const wipSlugs = stories.filter(s => s.wip).map(s => s.slug);

// Update this to your production domain
const SITE = 'https://theaifiles.app';

export default defineConfig({
  site: SITE,
  integrations: [
    sitemap({
      changefreq: 'weekly',
      filter: (page) => !wipSlugs.some(slug => page.includes(`/stories/${slug}`)),
      serialize(item) {
        if (item.url === `${SITE}/`) return { ...item, priority: 1.0 };
        if (item.url.includes('/stories/')) return { ...item, priority: 0.9 };
        return { ...item, priority: 0.7 };
      },
    }),
  ],
});
