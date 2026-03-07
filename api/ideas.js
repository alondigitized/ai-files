const { Redis } = require('@upstash/redis');

const kv = new Redis({
  url: process.env.theaifiles_KV_REST_API_URL,
  token: process.env.theaifiles_KV_REST_API_TOKEN,
});

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '').trim();
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://theaifiles.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  // GET ?limit=N — return top N approved ideas sorted by votes desc
  if (req.method === 'GET') {
    const limit = Math.min(parseInt(req.query.limit ?? '10', 10), 50);
    const results = await kv.zrange('ideas:approved', 0, limit - 1, {
      rev: true,
      withScores: true,
    });

    // results is [id, score, id, score, ...] or [{member, score}, ...]
    // Upstash returns array of {member, score} objects when withScores: true
    const ideas = [];
    for (const item of results) {
      const id = item.member ?? item;
      const score = item.score ?? 0;
      const hash = await kv.hgetall(`idea:${id}`);
      if (hash) {
        ideas.push({
          id,
          text: hash.text,
          votes: parseInt(hash.votes ?? score ?? '0', 10),
          submittedAt: hash.submittedAt,
        });
      }
    }
    return res.status(200).json(ideas);
  }

  if (req.method === 'POST') {
    const body = req.body ?? {};

    // Upvote action
    if (body.action === 'vote') {
      const { id } = body;
      if (!id) return res.status(400).json({ error: 'id required' });

      // Verify idea is in approved set
      const score = await kv.zscore('ideas:approved', id);
      if (score === null) return res.status(404).json({ error: 'idea not found' });

      await kv.zincrby('ideas:approved', 1, id);
      const newVotes = await kv.hincrby(`idea:${id}`, 'votes', 1);
      return res.status(200).json({ votes: newVotes });
    }

    // Submit new idea
    const text = stripHtml(body.text ?? '');
    if (!text || text.length < 1 || text.length > 280) {
      return res.status(400).json({ error: 'text must be 1–280 characters' });
    }

    const id = generateId();
    await kv.hset(`idea:${id}`, {
      text,
      submittedAt: new Date().toISOString(),
      votes: '0',
    });
    await kv.lpush('ideas:pending', id);

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
