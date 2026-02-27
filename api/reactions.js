const { Redis } = require('@upstash/redis');

const kv = new Redis({
  url: process.env.theaifiles_KV_REST_API_URL,
  token: process.env.theaifiles_KV_REST_API_TOKEN,
});

const ALLOWED = ['thumbsUp', 'interesting', 'mindBlown'];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://theaifiles.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const getKey = slug => `reactions:${slug}`;
  const parseCounts = raw => ({
    thumbsUp:    parseInt(raw?.thumbsUp    ?? '0', 10),
    interesting: parseInt(raw?.interesting ?? '0', 10),
    mindBlown:   parseInt(raw?.mindBlown   ?? '0', 10),
  });

  if (req.method === 'GET') {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: 'slug required' });
    const raw = await kv.hgetall(getKey(slug));
    return res.status(200).json(parseCounts(raw));
  }

  if (req.method === 'POST') {
    const { slug, reaction } = req.body ?? {};
    if (!slug || !ALLOWED.includes(reaction))
      return res.status(400).json({ error: 'invalid params' });
    await kv.hincrby(getKey(slug), reaction, 1);
    const raw = await kv.hgetall(getKey(slug));
    return res.status(200).json({ success: true, counts: parseCounts(raw) });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
