import type { APIRoute, GetStaticPaths } from 'astro';
import stories from '../../data/stories.json';
import { generateOGImage, generateDefaultOGImage } from '../../utils/og-image';

export const getStaticPaths: GetStaticPaths = () => {
  const paths = stories
    .filter((s: any) => !s.wip)
    .map((s: any) => ({ params: { slug: s.slug } }));
  paths.push({ params: { slug: 'default' } });
  paths.push({ params: { slug: 'risk' } });
  return paths;
};

// Non-story pages with their own OG card
const PAGE_CARDS: Record<string, Parameters<typeof generateOGImage>[0]> = {
  risk: {
    slug: 'risk',
    title: 'The Risk Ledger',
    deck: 'Every public p(doom) estimate, from the people building AI — and the other column: what has already gone right.',
    chapter: 0,
    label: 'P(DOOM) · BOTH COLUMNS',
    story: '#5eead4',
    storyDark: '#05201b',
  },
};

export const GET: APIRoute = async ({ params }) => {
  let png: Buffer;

  if (params.slug === 'default') {
    png = await generateDefaultOGImage();
  } else if (params.slug && PAGE_CARDS[params.slug]) {
    png = await generateOGImage(PAGE_CARDS[params.slug]);
  } else {
    const story = stories.find((s: any) => s.slug === params.slug);
    if (!story) return new Response('Not found', { status: 404 });
    png = await generateOGImage(story as any);
  }

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
