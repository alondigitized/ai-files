import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const fontsDir = join(process.cwd(), 'src/assets/fonts');
const interRegular = readFileSync(join(fontsDir, 'Inter-Regular.ttf'));
const interBold = readFileSync(join(fontsDir, 'Inter-Bold.ttf'));

interface StoryMeta {
  title: string;
  deck: string;
  chapter: number;
  story: string;
  storyDark: string;
}

export async function generateOGImage(story: StoryMeta): Promise<Buffer> {
  const truncatedDeck = story.deck.length > 130
    ? story.deck.slice(0, 130).replace(/\s+\S*$/, '') + '...'
    : story.deck;

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 70px',
          background: `linear-gradient(135deg, #0d0d0d 0%, ${story.storyDark} 100%)`,
          fontFamily: 'Inter',
        },
        children: [
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column', gap: '20px' },
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
                            {
                              type: 'span',
                              props: {
                                style: { color: '#888' },
                                children: 'THE',
                              },
                            },
                            {
                              type: 'span',
                              props: {
                                style: { color: '#ff4d4d' },
                                children: 'AI',
                              },
                            },
                            {
                              type: 'span',
                              props: {
                                style: { color: '#888' },
                                children: 'FILES',
                              },
                            },
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
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                flex: 1,
                justifyContent: 'center',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '52px',
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
                      fontSize: '22px',
                      color: '#888',
                      lineHeight: 1.5,
                    },
                    children: truncatedDeck,
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
