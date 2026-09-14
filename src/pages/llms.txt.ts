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

  // Pages — non-story reference pages
  lines.push('## Pages');
  lines.push('');
  lines.push(`- [The Risk Ledger](${new URL('/risk', siteURL).href}) — A sourced dashboard of every public "p(doom)" estimate (the probability that AI causes human extinction or existential catastrophe) from AI lab leaders, researchers, safety organizations, policymakers, and forecasters, each with the date, the exact question answered, and a source link. Includes aggregate survey results (2023 AI Impacts survey of 2,778 researchers, median 5%; Existential Risk Persuasion Tournament), a timeline of the July 2026 OpenAI model intrusion into Hugging Face, and a second column documenting verified positive outcomes and the safety measures introduced in response.`);
  lines.push(`- [How It Works](${new URL('/how-it-works', siteURL).href}) — The multi-agent editorial pipeline behind every story: research, source criticism, fact-checking, and security and accessibility gates.`);
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
