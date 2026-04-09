// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//   plugins/triggervoice.js — SHAVIYA-XMD V2
//
//   🎵 Word Trigger Voice Plugin — Always ON
//   ✅ Word type කළ විට → message delete → opus voice note send
//   ✅ Groups + DM දෙකෙහිම works
//   ✅ Data: ranumitha_data/triggervoice.json
//   ✅ ffmpeg convert නැහැ — opus direct send (no audio errors)
//
//   MORE words add කරන්නේ triggervoice.json ලා:
//   {
//     "fah":   "https://github.com/.../fah.opus",
//     "hello": "https://github.com/.../hello.opus"
//   }
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

'use strict';

const fs    = require('fs');
const path  = require('path');
const axios = require('axios');
const { cmd } = require('../command');

// ── Data file ────────────────────────────────────────────────
const VOICE_FILE = path.join(__dirname, '../ranumitha_data/triggervoice.json');

function loadTriggers() {
    try {
        if (!fs.existsSync(VOICE_FILE)) return {};
        return JSON.parse(fs.readFileSync(VOICE_FILE, 'utf8'));
    } catch (_) { return {}; }
}

// ── Download opus buffer ─────────────────────────────────────
async function downloadOpus(url) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    return Buffer.from(res.data);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  on:body — every message check
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
cmd({ on: 'body', dontAddCommandList: true },
async (conn, mek, m, { from, body }) => {
    try {
        if (!body || !body.trim()) return;

        const bodyLower = body.trim().toLowerCase();
        const triggers  = loadTriggers();
        if (Object.keys(triggers).length === 0) return;

        // Word match check
        let matchedUrl = null;
        for (const word in triggers) {
            if (bodyLower === word.trim().toLowerCase()) {
                matchedUrl = triggers[word];
                break;
            }
        }
        if (!matchedUrl) return;

        // Step 1: Delete user message
        try {
            await conn.sendMessage(from, { delete: mek.key });
        } catch (_) {}

        // Step 2: Download opus buffer
        const opusBuf = await downloadOpus(matchedUrl);

        // Step 3: Send as PTT voice note (opus direct — no convert)
        await conn.sendPresenceUpdate('recording', from);
        await conn.sendMessage(from, {
            audio:    opusBuf,
            mimetype: 'audio/ogg; codecs=opus',
            ptt:      true
        }, { quoted: mek });

        console.log(`[TRIGGERVOICE] ✅ Sent voice for: "${bodyLower}"`);

    } catch (e) {
        console.log('[TRIGGERVOICE] Error:', e.message);
    }
});
