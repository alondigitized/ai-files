import type { APIContext } from 'astro';
import stories from '../data/stories.json';

export async function GET(context: APIContext) {
  const siteURL = context.site ?? new URL('https://theaifiles.app');
  const published = stories
    .filter(s => s.isoDate && !s.wip)
    .sort((a, b) => new Date(b.isoDate!).getTime() - new Date(a.isoDate!).getTime());

  const lines: string[] = [];

  // Header
  lines.push('# The AI Files');
  lines.push('');
  lines.push('> True stories from the age of artificial intelligence — documented incidents, landmark moments, and cautionary tales.');
  lines.push('');
  lines.push('The AI Files is a longform archive of verified, sourced stories about AI incidents, research breakthroughs, and corporate failures. All stories cite primary sources and are based on documented public events, court records, or published research.');
  lines.push('');

  // Archive — bullet list
  lines.push('## Archive');
  lines.push('');
  for (const s of published) {
    const url = new URL(`/stories/${s.slug}`, siteURL).href;
    const full = (s as any).llmsDescription ?? s.deck;
    // Use first two sentences for archive list, full text in extended section
    const brief = full.split(/(?<=\.)\s+/).slice(0, 2).join(' ');
    lines.push(`- [${s.title}](${url}) — ${brief} (${s.date})`);
  }
  lines.push('');

  // Extended descriptions for stories that have llmsDescription
  const withDesc = published.filter(s => (s as any).llmsDescription);
  if (withDesc.length > 0) {
    for (const s of withDesc) {
      const url = new URL(`/stories/${s.slug}`, siteURL).href;
      lines.push(`## ${s.title}`);
      lines.push(`URL: ${url}`);
      lines.push((s as any).llmsDescription);
      lines.push('');
    }
  }

  // Footer
  lines.push('## About');
  lines.push('');
  lines.push('All stories are based on documented public events, published research, and verified reporting. Each story links to primary sources.');
  lines.push('');
  lines.push(`Site: ${siteURL.href}`);
  lines.push(`Feed: ${new URL('/feed.xml', siteURL).href}`);

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
