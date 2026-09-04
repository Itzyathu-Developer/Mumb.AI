function envValue(primary, fallbacks = []) {
  if (process.env[primary]) return process.env[primary];
  for (const key of fallbacks) {
    if (process.env[key]) return process.env[key];
  }
  return undefined;
}

const GEMINI_API_KEY = envValue('GEMINI_API_KEY', ['GEMINI_KEY', 'GOOGLE_API_KEY', 'GOOGLE_API_SECRET']);
const GROQ_API_KEY = envValue('GROQ_API_KEY', ['GROQ_KEY', 'GROQ_SECRET']);
const GROQ_MODEL = process.env.GROQ_MODEL || '';

async function getGroqModel() {
  if (GROQ_MODEL) return GROQ_MODEL;
  const response = await fetchJson('https://api.groq.com/openai/v1/models', {
    headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
  }, 'Groq');
  const models = Array.isArray(response.data) ? response.data : [];
  const preferred = [
    'openai/gpt-oss-20b',
    'llama-4-scout-17b-16e-instruct',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
  ];
  const availableIds = new Set(models.map(model => model.id));
  const selected = preferred.find(model => availableIds.has(model));
  if (selected) return selected;
  const fallback = models.find(model => /instruct|chat/i.test(model.id) && !/whisper|guard|safeguard|embed/i.test(model.id));
  if (fallback?.id) return fallback.id;
  throw new Error('No supported chat model is available for this Groq API key');
}

async function fetchJson(url, options, provider) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${provider} request failed: ${res.status}${body ? ` ${body}` : ''}`);
  }
  return res.json();
}

function parseJson(text) {
  if (typeof text !== 'string') return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function normalizeModelResult(payload, rawText) {
  const parsed = payload && typeof payload === 'object' ? payload : parseJson(rawText) || {};
  if (Object.keys(parsed).length) return parsed;
  if (typeof rawText === 'string' && rawText.trim()) {
    return { answer: rawText.trim() };
  }
  return { answer: '' };
}

async function requestGroq(system, user) {
  const payload = {
    model: await getGroqModel(),
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
  };
  const response = await fetchJson('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(payload),
  }, 'Groq');

  const rawText = response.choices?.[0]?.message?.content || response.choices?.[0]?.message?.content?.parts?.[0]?.text || '';
  return normalizeModelResult(parseJson(rawText), rawText);
}

async function requestGemini(system, user) {
  const response = await fetchJson(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
      }),
    },
    'Gemini'
  );

  const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return normalizeModelResult(parseJson(rawText), rawText);
}

async function askModel(system, user) {
  if (GROQ_API_KEY) return requestGroq(system, user);
  if (GEMINI_API_KEY) return requestGemini(system, user);
  throw new Error('Set GROQ_API_KEY or GEMINI_API_KEY');
}

module.exports = { askModel };
