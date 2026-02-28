const { Redis } = require('@upstash/redis');

const kv = new Redis({
  url: process.env.theaifiles_KV_REST_API_URL,
  token: process.env.theaifiles_KV_REST_API_TOKEN,
});

const ALLOWED = ['opening', 'explanation', 'stakes', 'tooLong'];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://theaifiles.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const getKey = slug => `feedback:${slug}`;
  const parseCounts = raw => ({
    opening:     parseInt(raw?.opening     ?? '0', 10),
    explanation: parseInt(raw?.explanation ?? '0', 10),
    stakes:      parseInt(raw?.stakes      ?? '0', 10),
    tooLong:     parseInt(raw?.tooLong     ?? '0', 10),
  });

  if (req.method === 'GET') {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: 'slug required' });
    const raw = await kv.hgetall(getKey(slug));
    return res.status(200).json(parseCounts(raw));
  }

  if (req.method === 'POST') {
    const { slug, dimension } = req.body ?? {};
    if (!slug || !ALLOWED.includes(dimension))
      return res.status(400).json({ error: 'invalid params' });
    await kv.hincrby(getKey(slug), dimension, 1);
    const raw = await kv.hgetall(getKey(slug));
    return res.status(200).json({ success: true, counts: parseCounts(raw) });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
