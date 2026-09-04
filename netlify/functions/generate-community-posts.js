const { askModel } = require('./ai-helper');

const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const bodyPayload = JSON.stringify({ scenario: body.scenario || 'commute', count: Math.min(5, Math.max(1, Number(body.count) || 3)) });
    const result = await askModel(
      'Generate realistic but clearly synthetic Mumbai, Maharashtra mobility observations. Return JSON only as {posts:[{category,context,note}]}.',
      bodyPayload
    );
    return { statusCode: 200, body: JSON.stringify({ posts: Array.isArray(result.posts) ? result.posts.slice(0, 5) : [] }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

exports.handler = handler;
