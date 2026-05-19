const express = require('express');
const authMiddleware = require('../middleware/auth');
const models = require('../models');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const router = express.Router();

// Shared model config — same as openrouter.js
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

// GET /api/ai/analyze/stream?missionId=X  - SSE streaming AI mission analysis
router.get('/analyze/stream', authMiddleware, async (req, res) => {
  const { missionId } = req.query;

  if (!missionId) {
    return res.status(400).json({ error: 'missionId query parameter is required' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    send('status', { step: 1, message: 'Fetching mission data...' });

    const mission = await models.Mission.findByPk(missionId);
    if (!mission) {
      send('error', { message: `Mission ${missionId} not found` });
      return res.end();
    }

    send('status', { step: 2, message: 'Mission data retrieved. Starting AI analysis...' });

    // Fetch related data
    const drone = mission.droneId ? await models.Drone.findByPk(mission.droneId) : null;

    send('status', { step: 3, message: 'Preparing analysis prompt...' });

    const systemPrompt = `You are an expert drone mission analyst. Provide a detailed mission analysis with sections:
1) Mission Overview
2) Performance Analysis
3) Risk Assessment
4) Safety Evaluation
5) Recommendations

Use markdown formatting. Be specific, actionable, and data-driven.`;
    const userPrompt = `Analyze this mission:\n${JSON.stringify({ mission: mission.toJSON(), drone: drone ? drone.toJSON() : null }, null, 2)}`;

    send('status', { step: 4, message: `Calling AI model (${OPENROUTER_MODEL}, streaming)...` });

    if (!OPENROUTER_API_KEY) {
      send('error', { message: 'OpenRouter API key not configured' });
      return res.end();
    }

    // Call OpenRouter with streaming
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:3001',
        'X-Title': 'AI Drone Operations',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      send('error', { message: `AI API error: ${response.status}` });
      return res.end();
    }

    send('status', { step: 5, message: 'Streaming analysis...' });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              send('chunk', { text: delta });
            }
          } catch (_) {
            // skip malformed SSE lines
          }
        }
      }
    }

    send('done', { message: 'Analysis complete', missionId });
  } catch (error) {
    send('error', { message: error.message });
  } finally {
    res.end();
  }
});

module.exports = router;
