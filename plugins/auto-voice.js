// ============================================
//   plugins/auto-reactions.js - SHAVIYA-XMD V2
//   Auto Voice + Auto Sticker + Auto Reply
//   ONE switch — .autovoice on/off controls ALL
// ============================================

'use strict';

const fs   = require('fs');
const path = require('path');
const { cmd }             = require('../command');
const { getSetting, setSetting, getConfig } = require('../lib/settings');

// ── File paths ────────────────────────────────
const VOICE_FILE   = path.join(__dirname, '../ranumitha_data/autovoice.json');
const STICKER_FILE = path.join(__dirname, '../ranumitha_data/autosticker.json');
const REPLY_FILE   = path.join(__dirname, '../ranumitha_data/autoreply.json');

// ── Safe JSON loader ──────────────────────────
function loadJson(filePath) {
    try {
        if (!fs.existsSync(filePath)) return {};
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) { return {}; }
}

// ══════════════════════════════════════════════
//   .autovoice on/off — controls ALL 3
// ══════════════════════════════════════════════
cmd({
    pattern:  'autovoice',
    alias:    ['autovc', 'auto-voice'],
    desc:     'Auto Voice + Sticker + Reply — one switch',
    category: 'owner',
    react:    '🔊',
    filename: __filename
},
async (conn, mek, m, { isOwner, q, reply }) => {
    if (!isOwner) return reply('❌ *Owner only command!*');

    const sub = (q || '').toLowerCase().trim();

    if (!sub || (sub !== 'on' && sub !== 'off')) {
        const current = getSetting('autoVoice') ?? false;
        return reply(
`🔊 *Auto Voice Status*

📌 *Current:* ${current ? '✅ ON' : '❌ OFF'}

✅ When ON:
  🔊 Auto Voice replies active
  🎭 Auto Sticker replies active
  💬 Auto Reply replies active

Usage:
• *.autovoice on*  → Enable all 3
• *.autovoice off* → Disable all 3`
        );
    }

    const newVal = sub === 'on';
    setSetting('autoVoice', newVal);

    return reply(
`${newVal ? '✅' : '❌'} *Auto Voice ${sub.toUpperCase()}!*

${newVal ? `🔊 Auto Voice → ✅ Active
🎭 Auto Sticker → ✅ Active
💬 Auto Reply → ✅ Active` : `🔊 Auto Voice → ❌ Stopped
🎭 Auto Sticker → ❌ Stopped
💬 Auto Reply → ❌ Stopped`}

_Saved instantly — no restart needed_ ✅`
    );
});

// ══════════════════════════════════════════════
//   on:body — runs all 3 when autoVoice = ON
// ══════════════════════════════════════════════
cmd({ on: 'body' },
async (robin, mek, m, { from, body, isOwner }) => {
    try {
        // One setting controls all 3
        const enabled = getSetting('autoVoice') ?? getConfig('AUTO_VOICE') ?? false;
        if (!enabled) return;
        if (isOwner) return;
        if (!body || !body.trim()) return;

        const bodyLower = body.trim().toLowerCase();

        // ── 1. Auto Voice ──────────────────────
        try {
            const voiceData = loadJson(VOICE_FILE);
            for (const text in voiceData) {
                if (bodyLower === text.trim().toLowerCase()) {
                    const audioUrl = voiceData[text];
                    const isOpus   = audioUrl.toLowerCase().includes('.opus');
                    const mimetype = isOpus ? 'audio/ogg; codecs=opus' : 'audio/mpeg';
                    await robin.sendPresenceUpdate('recording', from);
                    await robin.sendMessage(
                        from,
                        { audio: { url: audioUrl }, mimetype, ptt: true },
                        { quoted: mek }
                    );
                    break;
                }
            }
        } catch (e) { console.log('[AUTO-VOICE]:', e.message); }

        // ── 2. Auto Sticker ────────────────────
        try {
            const stickerData = loadJson(STICKER_FILE);
            for (const text in stickerData) {
                if (bodyLower === text.trim().toLowerCase()) {
                    await robin.sendMessage(
                        from,
                        { sticker: { url: stickerData[text] }, package: 'S_I_H_I_L_E_L' },
                        { quoted: mek }
                    );
                    break;
                }
            }
        } catch (e) { console.log('[AUTO-STICKER]:', e.message); }

        // ── 3. Auto Reply ──────────────────────
        try {
            const replyData = loadJson(REPLY_FILE);
            for (const text in replyData) {
                if (bodyLower === text.trim().toLowerCase()) {
                    await m.reply(replyData[text]);
                    break;
                }
            }
        } catch (e) { console.log('[AUTO-REPLY]:', e.message); }

    } catch (e) {
        console.log('[AUTO-REACTIONS]:', e.message);
    }
});
