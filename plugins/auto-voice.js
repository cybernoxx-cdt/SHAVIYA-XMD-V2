// ============================================
//   plugins/auto-reactions.js - SHAVIYA-XMD V4
//   Auto Voice + Auto Sticker + Auto Reply
//   ✅ ffmpeg-static — no system ffmpeg needed
//   ✅ Works on Heroku / Railway / Render
// ============================================

'use strict';

const fs     = require('fs');
const path   = require('path');
const axios  = require('axios');
const ffmpeg = require('fluent-ffmpeg');

// ✅ Use bundled ffmpeg-static — no system install needed
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

const {
    generateWAMessageFromContent,
    proto,
    prepareWAMessageMedia,
} = require('@whiskeysockets/baileys');

const { cmd }                               = require('../command');
const { getSetting, setSetting, getConfig } = require('../lib/settings');

// ── File paths ────────────────────────────────
const VOICE_FILE   = path.join(__dirname, '../ranumitha_data/autovoice.json');
const STICKER_FILE = path.join(__dirname, '../ranumitha_data/autosticker.json');
const REPLY_FILE   = path.join(__dirname, '../ranumitha_data/autoreply.json');
const TMP_DIR      = path.join(__dirname, '../ranumitha_data/tmp');

if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// ── Safe JSON loader ──────────────────────────
function loadJson(filePath) {
    try {
        if (!fs.existsSync(filePath)) return {};
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch { return {}; }
}

// ══════════════════════════════════════════════
//   Convert ANY audio → OGG Opus buffer
//   ✅ Uses ffmpeg-static (bundled)
// ══════════════════════════════════════════════
async function toOpusBuffer(audioUrl) {
    const ext       = (audioUrl.split('?')[0].split('.').pop()) || 'mp3';
    const tmpInput  = path.join(TMP_DIR, `in_${Date.now()}.${ext}`);
    const tmpOutput = path.join(TMP_DIR, `out_${Date.now()}.ogg`);

    try {
        const res = await axios.get(audioUrl, {
            responseType: 'arraybuffer',
            timeout: 20000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        fs.writeFileSync(tmpInput, Buffer.from(res.data));

        await new Promise((resolve, reject) => {
            ffmpeg(tmpInput)
                .audioCodec('libopus')
                .audioBitrate('64k')
                .audioFrequency(48000)
                .audioChannels(1)
                .outputOptions(['-f ogg', '-avoid_negative_ts make_zero'])
                .output(tmpOutput)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });

        return fs.readFileSync(tmpOutput);
    } finally {
        try { if (fs.existsSync(tmpInput))  fs.unlinkSync(tmpInput);  } catch {}
        try { if (fs.existsSync(tmpOutput)) fs.unlinkSync(tmpOutput); } catch {}
    }
}

// ══════════════════════════════════════════════
//   Send REAL PTT Voice Note
// ══════════════════════════════════════════════
async function sendVoiceNote(conn, jid, audioBuffer, quotedMsg) {
    const uploaded = await prepareWAMessageMedia(
        { audio: audioBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true },
        { upload: conn.waUploadToServer }
    );

    const msg = generateWAMessageFromContent(
        jid,
        {
            audioMessage: {
                ...uploaded.audioMessage,
                ptt: true,
                mimetype: 'audio/ogg; codecs=opus',
            }
        },
        { quoted: quotedMsg, userJid: conn.user?.id }
    );

    await conn.relayMessage(jid, msg.message, { messageId: msg.key.id });
    return msg;
}

// ══════════════════════════════════════════════
//   .autovoice on/off
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
                    await robin.sendPresenceUpdate('recording', from);
                    const audioBuffer = await toOpusBuffer(voiceData[text]);
                    await sendVoiceNote(robin, from, audioBuffer, mek);
                    break;
                }
            }
        } catch (e) { console.log('[AUTO-VOICE] Error:', e.message); }

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
        } catch (e) { console.log('[AUTO-STICKER] Error:', e.message); }

        // ── 3. Auto Reply ──────────────────────
        try {
            const replyData = loadJson(REPLY_FILE);
            for (const text in replyData) {
                if (bodyLower === text.trim().toLowerCase()) {
                    await m.reply(replyData[text]);
                    break;
                }
            }
        } catch (e) { console.log('[AUTO-REPLY] Error:', e.message); }

    } catch (e) {
        console.log('[AUTO-REACTIONS] Error:', e.message);
    }
});
