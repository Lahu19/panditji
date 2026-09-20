'use strict';
/**
 * /api/panditji-ai
 *
 * Acts as a secure proxy to Gemini Flash.
 * The real Gemini endpoint and API key are NEVER sent to the browser —
 * the frontend only ever sees "/api/panditji-ai".
 */
const express = require('express');
const https   = require('https');
const router  = express.Router();

const GEMINI_MODEL    = 'gemini-2.0-flash-latest';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * POST /api/panditji-ai/chat
 *
 * Body: { prompt: string, history?: [{role, text}] }
 * Returns: { answer: string, model: "panditji-ai", ... }
 */
router.post('/chat', async (req, res) => {
  try {
    const { prompt, history = [] } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'prompt is required and must be a non-empty string.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'AI service is not configured on the server.' });
    }

    // Build the contents array (supports multi-turn history)
    const contents = [
      // System persona injected as the first user turn
      {
        role: 'user',
        parts: [{ text: 'You are PanditJi AI, a helpful spiritual and ritual assistant for the Find-MU-PANDIT platform. Help users with puja bookings, rituals, pandit selection, and Hindu ceremony guidance.' }],
      },
      {
        role: 'model',
        parts: [{ text: 'Namaste 🙏 I am PanditJi AI. How may I assist you with your puja or ceremony today?' }],
      },
      // Prior conversation turns
      ...history.map(({ role, text }) => ({
        role: role === 'assistant' ? 'model' : 'user',
        parts: [{ text }],
      })),
      // Current user message
      { role: 'user', parts: [{ text: prompt.trim() }] },
    ];

    const payload = JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    // Call Gemini via Node https (no extra deps needed)
    const geminiRes = await callGemini(apiKey, payload);

    // Extract the text reply
    const candidate = geminiRes?.candidates?.[0];
    const answer    = candidate?.content?.parts?.map(p => p.text).join('') || '';

    return res.json({
      answer,
      model: 'panditji-ai',           // ← what the browser sees
      finishReason: candidate?.finishReason || 'STOP',
    });

  } catch (err) {
    console.error('[panditji-ai] error:', err.message);
    return res.status(502).json({ error: 'AI service temporarily unavailable. Please try again.' });
  }
});

/**
 * GET /api/panditji-ai/info
 * Returns public branding info — never leaks the real provider.
 */
router.get('/info', (_req, res) => {
  res.json({
    name:        'PanditJi AI',
    version:     '1.0.0',
    description: 'AI assistant for spiritual guidance and puja booking support.',
    model:       'panditji-ai',        // ← custom branding
    endpoints: {
      chat: 'POST /api/panditji-ai/chat',
      info: 'GET  /api/panditji-ai/info',
    },
  });
});

/* ── Helpers ─────────────────────────────────────────────────────────── */

function callGemini(apiKey, payload) {
  return new Promise((resolve, reject) => {
    const url     = new URL(`${GEMINI_ENDPOINT}?key=${apiKey}`);
    const options = {
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (geminiRes) => {
      let data = '';
      geminiRes.on('data', chunk => (data += chunk));
      geminiRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (geminiRes.statusCode >= 400) {
            reject(new Error(parsed?.error?.message || `Gemini HTTP ${geminiRes.statusCode}`));
          } else {
            resolve(parsed);
          }
        } catch {
          reject(new Error('Failed to parse Gemini response'));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

module.exports = router;
