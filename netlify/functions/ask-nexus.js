const { askModel } = require('./ai-helper');

const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const question = String(body.question || '');
    if (!question) return { statusCode: 400, body: JSON.stringify({ error: 'Missing question' }) };

    const result = await askModel(
      'You are Mumb.AI, a calm, conversational, detailed Mumbai, Maharashtra assistant. Answer every reasonable question directly, not only commute questions. Return JSON only as {answer:string}.',
      question
    );

    return { statusCode: 200, body: JSON.stringify({ answer: result.answer || '' }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

exports.handler = handler;
