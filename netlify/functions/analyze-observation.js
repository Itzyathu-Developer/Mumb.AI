const { askModel } = require('./ai-helper');

const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const result = await askModel(
      'You verify community mobility observations. Return JSON only with approved (boolean), reason (string), and points (number). Approve only specific, plausible, evidence-based reports.',
      JSON.stringify(body)
    );
    return { statusCode: 200, body: JSON.stringify({ approved: Boolean(result.approved), reason: result.reason || '', points: Number(result.points) || 0 }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

exports.handler = handler;
