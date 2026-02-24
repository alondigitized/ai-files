import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Update this to your production domain
const SITE = 'https://theaifiles.app';

export default defineConfig({
  site: SITE,
  integrations: [
    sitemap({
      changefreq: 'weekly',
      serialize(item) {
        if (item.url === `${SITE}/`) return { ...item, priority: 1.0 };
        if (item.url.includes('/stories/')) return { ...item, priority: 0.9 };
        return { ...item, priority: 0.7 };
      },
    }),
  ],
});
