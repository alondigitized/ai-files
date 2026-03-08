import type { APIRoute, GetStaticPaths } from 'astro';
import stories from '../../data/stories.json';
import { generateOGImage, generateDefaultOGImage } from '../../utils/og-image';

export const getStaticPaths: GetStaticPaths = () => {
  const paths = stories
    .filter((s: any) => !s.wip)
    .map((s: any) => ({ params: { slug: s.slug } }));
  paths.push({ params: { slug: 'default' } });
  return paths;
};

export const GET: APIRoute = async ({ params }) => {
  let png: Buffer;

  if (params.slug === 'default') {
    png = await generateDefaultOGImage();
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
