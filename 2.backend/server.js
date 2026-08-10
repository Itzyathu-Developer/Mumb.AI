const http = require('http');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1e6) reject(new Error('Too large'));
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

async function askGroq(prompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq failed: ${response.status}`);
  }

  const data = await response.json();

  return data.choices?.[0]?.message?.content || "No response";
}

const server = http.createServer(async (req, res) => {
  try {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      return sendJson(res, 204, {});
    }

    // API route
    if (req.method === 'POST' && req.url === '/api/ask') {
      const body = await readBody(req);

      const reply = await askGroq(body.prompt || '');

      return sendJson(res, 200, { reply });
    }

    // Health check
    if (req.method === 'GET' && req.url === '/') {
      return sendJson(res, 200, { status: 'Server running 🚀' });
    }

    sendJson(res, 404, { error: 'Not found' });

  } catch (err) {
    console.error(err);
    sendJson(res, 500, { error: err.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
