const crypto = require('crypto');
const { getStore } = require('@netlify/blobs');
const { Redis } = require('@upstash/redis');

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function normalizeEmail(email) { return String(email || '').trim().toLowerCase(); }
function createCode() { return String(crypto.randomInt(100000, 1000000)); }
function getVerificationStore() {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    return {
      setJSON: (key, value) => redis.set(key, value, { ex: CODE_TTL_MS / 1000 }),
      get: key => redis.get(key),
      delete: key => redis.del(key),
    };
  }

  const options = { name: 'email-verification', consistency: 'strong' };
  if (process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN) {
    options.siteID = process.env.NETLIFY_SITE_ID;
    options.token = process.env.NETLIFY_AUTH_TOKEN;
  }
  return getStore(options);
}

async function sendVerificationEmail(email, code) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.VERIFICATION_FROM_EMAIL;
  if (!apiKey || !from) throw new Error('Email delivery is not configured');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from, to: [email], subject: 'Your Mumb.AI verification code',
      text: `Your Mumb.AI verification code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your Mumb.AI verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>This code expires in 10 minutes.</p>`,
    }),
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
}

exports.handler = async event => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  let input;
  try { input = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid request' }); }
  const email = normalizeEmail(input.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: 'Enter a valid email address.' });
  const key = crypto.createHash('sha256').update(email).digest('hex');

  if (input.action === 'send') {
    const code = createCode();
    try {
      const store = getVerificationStore();
      await store.setJSON(key, { code, expiresAt: Date.now() + CODE_TTL_MS, attempts: 0 });
      await sendVerificationEmail(email, code);
      return json(200, { ok: true });
    } catch (error) {
      console.error('Verification email failed:', error.message);
      return json(503, { error: 'We could not send the verification email. Check the email configuration and try again.' });
    }
  }

  if (input.action === 'verify') {
    try {
      const store = getVerificationStore();
      const record = await store.get(key, { type: 'json' });
      if (!record || record.expiresAt < Date.now()) return json(400, { error: 'That code has expired. Request a new one.' });
      if (record.attempts >= MAX_ATTEMPTS) return json(429, { error: 'Too many incorrect attempts. Request a new code.' });
      if (String(input.code || '').trim() !== record.code) {
        await store.setJSON(key, { ...record, attempts: record.attempts + 1 });
        return json(400, { error: 'That verification code is incorrect.' });
      }
      await store.delete(key);
      return json(200, { ok: true, verifiedEmail: email });
    } catch (error) {
      console.error('Verification lookup failed:', error.message);
      return json(503, { error: 'Verification is temporarily unavailable. Check the Netlify Blobs configuration and try again.' });
    }
  }
  return json(400, { error: 'Unknown verification action' });
};