import cors from "cors";
app.use(cors());
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; if (data.length > 100000) reject(new Error('Request too large')); });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

async function askModel(system, user) {
  if (GROQ_API_KEY) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      }),
    });
    if (!response.ok) {
      const error = new Error(`Groq request failed: ${response.status}`);
      error.status = response.status;
      throw error;
    }
    const payload = await response.json();
    return JSON.parse(payload.choices?.[0]?.message?.content || '{}');
  }

  if (GEMINI_API_KEY) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
      }),
    });
    if (!response.ok) {
      const error = new Error(`Gemini request failed: ${response.status}`);
      error.status = response.status;
      throw error;
    }
    const payload = await response.json();
    return JSON.parse(payload.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
  }

  if (!API_KEY) throw new Error('Set GROQ_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`OpenAI request failed: ${response.status}`);
    error.status = response.status;
    error.detail = detail;
    throw error;
  }
  const payload = await response.json();
  return JSON.parse(payload.choices?.[0]?.message?.content || '{}');
}

async function handleApi(req, res) {
  const body = await readBody(req);
  if (req.url === '/api/analyze-observation') {
    const result = await askModel(
      'You verify community mobility observations. Return JSON only with approved (boolean), reason (string), and points (number). Approve only specific, plausible, evidence-based reports. For type correction, points must be exactly 1 when approved; for a normal observation, points must be 5 or 10.',
      JSON.stringify({ type: body.type || 'observation', category: body.category, context: body.context, note: body.note, existingObservation: body.existingObservation })
    );
    return sendJson(res, 200, { approved: Boolean(result.approved), reason: result.reason || '', points: body.type === 'correction' && result.approved ? 1 : Number(result.points) || 0 });
  }
  if (req.url === '/api/ask-nexus') {
    const result = await askModel(
      'You are Decidr AI, a calm, conversational, detailed Mumbai, Maharashtra assistant. Answer every reasonable question directly, not only commute questions. For transport questions, name the exact Mumbai Metro line, local train line, station sequence, BEST route, interchange, approximate time, approximate cost, and important uncertainty. For food, areas, events, safety, budgets, or day-plan questions, give practical structured guidance, assumptions, alternatives, and a short follow-up only when essential. Never invent live data; label estimates clearly. Return JSON only as {answer:string}.',
      String(body.question || '')
    );
    return sendJson(res, 200, { answer: result.answer || '' });
  }
  if (req.url === '/api/generate-community-posts') {
    const result = await askModel(
      'Generate realistic but clearly synthetic Mumbai, Maharashtra mobility observations. Use places such as Dadar, Andheri, Bandra, BKC, Marine Drive, BEST buses, and Mumbai local trains when relevant. Return JSON only as {posts:[{category,context,note}]}. Never claim these are real users or live data. Keep each note specific and concise.',
      JSON.stringify({ scenario: body.scenario || 'commute', count: Math.min(5, Math.max(1, Number(body.count) || 3)) })
    );
    return sendJson(res, 200, { posts: Array.isArray(result.posts) ? result.posts.slice(0, 5) : [] });
  }
  return sendJson(res, 404, { error: 'Not found' });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      });
      return res.end();
    }
    if (req.method === 'GET' && req.url === '/api/provider-status') {
      return sendJson(res, 200, {
        provider: GROQ_API_KEY ? 'groq' : GEMINI_API_KEY ? 'gemini' : API_KEY ? 'openai' : null,
        active: Boolean(GROQ_API_KEY || GEMINI_API_KEY || API_KEY),
        keys: {
          groq: Boolean(GROQ_API_KEY),
          gemini: Boolean(GEMINI_API_KEY),
          openai: Boolean(API_KEY),
        },
      });
    }
    if (req.method === 'POST' && req.url.startsWith('/api/')) return await handleApi(req, res);
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html' || req.url === '/nexus.html')) {
      const file = fs.readFileSync(path.join(__dirname, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(file);
    }
    sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    sendJson(res, error.status || 500, { error: error.message, detail: error.status === 429 ? 'The configured AI provider quota or rate limit has been reached.' : undefined });
  }
});

server.listen(PORT, HOST, () => console.log(`Decidr AI server running at http://${HOST}:${PORT}`));
