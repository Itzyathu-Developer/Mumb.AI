function envValue(primary, fallbacks = []) {
  if (process.env[primary]) return process.env[primary];
  for (const key of fallbacks) {
    if (process.env[key]) return process.env[key];
  }
  return undefined;
}

const handler = async () => {
  const groq = Boolean(envValue('GROQ_API_KEY', ['GROQ_KEY', 'GROQ_SECRET']));
  const gemini = Boolean(envValue('GEMINI_API_KEY', ['GEMINI_KEY', 'GOOGLE_API_KEY', 'GOOGLE_API_SECRET']));
  const openai = Boolean(envValue('OPENAI_API_KEY', ['OPENAI_KEY', 'OPENAI_SECRET']));
  return {
    statusCode: 200,
    body: JSON.stringify({
      provider: groq ? 'groq' : gemini ? 'gemini' : openai ? 'openai' : null,
      active: groq || gemini || openai,
      hasGroq: groq,
      hasGemini: gemini,
      hasOpenAI: openai,
    }),
  };
};

exports.handler = handler;
