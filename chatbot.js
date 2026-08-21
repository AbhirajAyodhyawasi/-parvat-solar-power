// ============================================================
// chatbot.js
// AI chatbot backend route for Parvat Solar Power website.
//
// HOW TO WIRE THIS INTO YOUR EXISTING server.js:
//   1. Save this file as chatbot.js in the same folder as server.js
//   2. In server.js, near your other `require(...)` lines, add:
//        const chatbotRouter = require('./chatbot');
//        app.use('/api/chatbot', chatbotRouter);
//   3. Make sure server.js uses express.json() middleware (it
//      likely already does, since your quote form posts JSON too):
//        app.use(express.json());
//   4. Set your Gemini API key as an environment variable named
//      GEMINI_API_KEY (see instructions below) - never hardcode it
//      in the file.
// ============================================================

const express = require('express');
const router = express.Router();

// Reuse your existing mailer.js - it exports sendLeadNotification(lead)
// and reads ADMIN_EMAIL / EMAIL_USER / EMAIL_PASS from environment
// variables on its own, so nothing else needs to be configured here.
const mailer = require('./mailer');

// Using Google Gemini's free tier instead of a paid API.
// Get a free key at https://aistudio.google.com/app/apikey
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `
You are the friendly customer-enquiry assistant for Parvat Solar Power (PSP),
a solar energy company based in Dehradun, Uttarakhand, India. You chat in a
warm, helpful mix of Hindi and English (Hinglish), matching whatever language
the customer uses.

WHAT PSP OFFERS:
- Rooftop, residential, commercial, industrial and government solar installations
- Battery backup systems, EV charging solutions
- Annual Maintenance Contracts (AMC)
- Solar consultancy and energy audits
- Government subsidy assistance (MNRE-aligned)
- Free site survey, then a transparent itemized quotation
- Typical residential installation: 3-7 days after design approval
- Contact: +91 78955 31049, info@parvatsolarpower.in, Dehradun office

YOUR GOALS, IN ORDER:
1. Answer the customer's questions helpfully and briefly (2-4 sentences max
   per reply). Do not invent exact prices - explain that pricing depends on
   roof size, load, and system capacity, and is confirmed after a free survey.
2. Naturally, over the course of the conversation, try to collect three
   things so our team can follow up: their NAME, PHONE NUMBER, and which
   SERVICE they're interested in (e.g. Residential Solar, Commercial Solar,
   AMC, Battery Backup, etc). Ask for these one at a time, conversationally -
   never as a rigid form. Don't ask again for something they already gave you.
3. Once you have all three (name, phone, and service interest), thank them
   warmly and let them know the PSP team will call them shortly.

CRITICAL OUTPUT RULE:
Whenever you have successfully collected ALL THREE pieces of information
(name, a phone number, and the service they want) at any point in the
conversation, append this exact machine-readable tag at the very end of
your reply, on its own line, with the real values filled in:

<<LEAD>>{"name":"...","phone":"...","service":"..."}<<LEAD>>

Only include this tag once, the first time all three are known. Do not
mention this tag to the user or explain it - it is invisible to them.
If you don't yet have all three, do not include the tag at all.
`.trim();

router.post('/', async (req, res) => {
  try {
    const { history } = req.body;

    if (!Array.isArray(history) || history.length === 0) {
      return res.status(400).json({ error: 'Missing conversation history' });
    }

    // Gemini expects roles as "user" / "model" (not "assistant"),
    // and each message's text wrapped in a "parts" array.
    const geminiContents = history.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: geminiContents,
        generationConfig: { maxOutputTokens: 400 }
      })
    });

    const data = await response.json();

    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      console.error('Unexpected AI response:', JSON.stringify(data));
      return res.status(500).json({ reply: 'Sorry, something went wrong. Please call us at +91 78955 31049.' });
    }

    let reply = candidateText;

    // Check for the lead-capture tag and strip it from what the user sees
    const leadMatch = reply.match(/<<LEAD>>([\s\S]*?)<<LEAD>>/);
    if (leadMatch) {
      reply = reply.replace(leadMatch[0], '').trim();

      try {
        const lead = JSON.parse(leadMatch[1]);
        await sendLeadEmail(lead);
      } catch (parseErr) {
        console.error('Failed to parse/send lead:', parseErr);
      }
    }

    res.json({ reply });

  } catch (err) {
    console.error('Chatbot error:', err);
    res.status(500).json({ reply: 'Sorry, something went wrong. Please call us at +91 78955 31049.' });
  }
});

async function sendLeadEmail(lead) {
  // Matches the shape mailer.js's sendLeadNotification() expects.
  await mailer.sendLeadNotification({
    name: lead.name || 'Not provided',
    phone: lead.phone || 'Not provided',
    email: lead.email || null,
    city: lead.city || null,
    service: lead.service || null,
    message: 'Captured automatically via the website chatbot.',
    createdAt: new Date().toISOString()
  });

  console.log('Lead email sent via mailer.js:', lead);
}

module.exports = router;
