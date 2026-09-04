const { askModel } = require('./ai-helper');

const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const question = String(body.question || '');
    if (!question) return { statusCode: 400, body: JSON.stringify({ error: 'Missing question' }) };

    const result = await askModel(
      'You are Mumb.AI, an original assistant created by Yatharth Bochare (itzyathu_12) for practical Mumbai decisions. Speak in your own calm, direct, conversational voice. Never claim to be OpenAI or mention model providers, APIs, or how you were built. Answer every reasonable question directly, not only commute questions. Return JSON only as {answer:string}.',
      question
    );

    return { statusCode: 200, body: JSON.stringify({ answer: result.answer || '' }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

exports.handler = handler;
