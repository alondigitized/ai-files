import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import stories from '../data/stories.json';

export async function GET(context: APIContext) {
  return rss({
    title: 'The AI Files',
    description: 'True stories from the age of artificial intelligence — documented incidents, landmark moments, and cautionary tales.',
    site: context.site!,
    items: stories
      .filter(s => s.isoDate)
      .sort((a, b) => new Date(b.isoDate!).getTime() - new Date(a.isoDate!).getTime())
      .map(s => ({
        title: s.title,
        pubDate: new Date(s.isoDate!),
        description: s.deck,
        link: `/stories/${s.slug}`,
        categories: s.tags,
      })),
    customData: `<language>en-us</language>`,
  });
}
