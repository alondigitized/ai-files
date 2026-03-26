import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const fontsDir = join(process.cwd(), 'src/assets/fonts');
const interRegular = readFileSync(join(fontsDir, 'Inter-Regular.ttf'));
const interBold = readFileSync(join(fontsDir, 'Inter-Bold.ttf'));

function loadCardImageAsDataUri(slug: string): string | null {
  const imagePath = join(process.cwd(), 'public', 'images', 'cards', `${slug}.png`);
  if (!existsSync(imagePath)) return null;
  const buffer = readFileSync(imagePath);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

interface StoryMeta {
  slug: string;
  title: string;
  deck: string;
  chapter: number;
  story: string;
  storyDark: string;
}

export async function generateOGImage(story: StoryMeta): Promise<Buffer> {
  const cardImageUri = loadCardImageAsDataUri(story.slug);
  const hasImage = cardImageUri !== null;

  const maxDeck = hasImage ? 100 : 130;
  const truncatedDeck = story.deck.length > maxDeck
    ? story.deck.slice(0, maxDeck).replace(/\s+\S*$/, '') + '...'
    : story.deck;

  const headerBlock = {
    type: 'div',
    props: {
      style: { display: 'flex', flexDirection: 'column' as const, gap: '20px' },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '20px',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                  },
                  children: [
                    { type: 'span', props: { style: { color: '#888' }, children: 'THE' } },
                    { type: 'span', props: { style: { color: '#ff4d4d' }, children: 'AI' } },
                    { type: 'span', props: { style: { color: '#888' }, children: 'FILES' } },
                  ],
                },
              },
              {
                type: 'span',
                props: {
                  style: {
                    fontSize: '16px',
                    fontWeight: 700,
                    color: story.story,
                    letterSpacing: '0.12em',
                  },
                  children: `CHAPTER ${String(story.chapter).padStart(2, '0')}`,
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              width: '100%',
              height: '2px',
              background: `linear-gradient(90deg, ${story.story}, transparent)`,
            },
          },
        },
      ],
    },
  };

  const contentBlock = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '24px',
        flex: 1,
        justifyContent: 'center',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              fontSize: hasImage ? '44px' : '52px',
              fontWeight: 700,
              color: '#e8e8e8',
              lineHeight: 1.15,
            },
            children: story.title,
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: hasImage ? '20px' : '22px',
              color: '#888',
              lineHeight: 1.5,
            },
            children: truncatedDeck,
          },
        },
      ],
    },
  };

  const footerBlock = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      children: [
        {
          type: 'span',
          props: {
            style: {
              fontSize: '16px',
              color: '#555',
              letterSpacing: '0.05em',
            },
            children: 'theaifiles.app',
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              width: '40px',
              height: '4px',
              background: story.story,
              borderRadius: '2px',
            },
          },
        },
      ],
    },
  };

  const textColumn = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'space-between',
        width: hasImage ? '720px' : '1200px',
        height: '630px',
        padding: hasImage ? '60px 40px 60px 70px' : '60px 70px',
      },
      children: [headerBlock, contentBlock, footerBlock],
    },
  };

  const imageColumn = hasImage ? {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        width: '480px',
        height: '630px',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 50px 40px 0',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              width: '420px',
              height: '420px',
              borderRadius: '24px',
              border: `3px solid ${story.story}`,
              overflow: 'hidden',
            },
            children: [
              {
                type: 'img',
                props: {
                  src: cardImageUri,
                  width: 420,
                  height: 420,
                },
              },
            ],
          },
        },
      ],
    },
  } : null;

  const rootChildren = hasImage ? [textColumn, imageColumn] : [textColumn];

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'row',
          background: `linear-gradient(135deg, #0d0d0d 0%, ${story.storyDark} 100%)`,
          fontFamily: 'Inter',
        },
        children: rootChildren,
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
        { name: 'Inter', data: interBold, weight: 700, style: 'normal' },
      ],
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  });
  return resvg.render().asPng();
}

export async function generateDefaultOGImage(): Promise<Buffer> {
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          background: 'linear-gradient(135deg, #0d0d0d 0%, #1a0000 100%)',
          fontFamily: 'Inter',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '48px',
                fontWeight: 700,
                letterSpacing: '0.08em',
              },
              children: [
                { type: 'span', props: { style: { color: '#e8e8e8' }, children: 'THE' } },
                { type: 'span', props: { style: { color: '#ff4d4d' }, children: 'AI' } },
                { type: 'span', props: { style: { color: '#e8e8e8' }, children: 'FILES' } },
              ],
            },
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize: '22px',
                color: '#888',
              },
              children: 'True stories from the age of AI',
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
        { name: 'Inter', data: interBold, weight: 700, style: 'normal' },
      ],
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  });
  return resvg.render().asPng();
}
