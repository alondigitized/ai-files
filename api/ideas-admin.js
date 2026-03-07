const { Redis } = require('@upstash/redis');

const kv = new Redis({
  url: process.env.theaifiles_KV_REST_API_URL,
  token: process.env.theaifiles_KV_REST_API_TOKEN,
});

function checkKey(key) {
  const adminKey = (process.env.theaifiles_ADMIN_KEY ?? '').trim();
  return adminKey && key === adminKey;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://theaifiles.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  // GET ?key=SECRET — return all pending ideas
  if (req.method === 'GET') {
    const { key } = req.query;
    if (!checkKey(key)) return res.status(401).json({ error: 'unauthorized' });

    const ids = await kv.lrange('ideas:pending', 0, -1);
    const ideas = [];
    for (const id of ids) {
      const hash = await kv.hgetall(`idea:${id}`);
      if (hash) {
        ideas.push({ id, text: hash.text, submittedAt: hash.submittedAt, votes: parseInt(hash.votes ?? '0', 10) });
      }
    }
    return res.status(200).json(ideas);
  }

  // POST { id, action: 'approve'|'reject', key: SECRET }
  if (req.method === 'POST') {
    const { id, action, key } = req.body ?? {};
    if (!checkKey(key)) return res.status(401).json({ error: 'unauthorized' });
    if (!id || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'id and action (approve|reject) required' });
    }

    if (action === 'approve') {
      await kv.zadd('ideas:approved', { score: 0, member: id });
      await kv.lrem('ideas:pending', 0, id);
    } else {
      await kv.lrem('ideas:pending', 0, id);
      await kv.del(`idea:${id}`);
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
