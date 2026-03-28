// ============================================
//   plugins/auto-voice.js - SHAVIYA-XMD V3
//   Auto Voice + Auto Sticker + Auto Reply
//   iOS + Android fully compatible voice notes
//   FFmpeg converts all audio → Opus PTT
// ============================================

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const { cmd } = require('../command');
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

// ── Download audio URL → Buffer ───────────────
async function downloadAudio(url) {
    const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    return Buffer.from(response.data);
}

// ── Convert any audio Buffer → Opus PTT Buffer ─
// This fixes iOS "no longer available / ask resend" issue.
// iOS requires: audio/ogg codec=opus, mono, 48kHz, ptt=true
// Sending raw MP3 URLs directly causes iOS to reject playback.
function convertToOpusPTT(inputBuffer) {
    return new Promise((resolve, reject) => {
        const tmpIn  = path.join(os.tmpdir(), `av_in_${Date.now()}.tmp`);
        const tmpOut = path.join(os.tmpdir(), `av_out_${Date.now()}.ogg`);

        fs.writeFileSync(tmpIn, inputBuffer);

        ffmpeg(tmpIn)
            .audioCodec('libopus')
            .audioChannels(1)          // mono — required for PTT
            .audioFrequency(48000)     // 48kHz — WhatsApp PTT standard
            .audioBitrate('64k')
            .format('ogg')
            .on('end', () => {
                try {
                    const outBuf = fs.readFileSync(tmpOut);
                    fs.unlinkSync(tmpIn);
                    fs.unlinkSync(tmpOut);
                    resolve(outBuf);
                } catch (e) { reject(e); }
            })
            .on('error', (err) => {
                try { fs.unlinkSync(tmpIn); } catch (_) {}
                try { fs.unlinkSync(tmpOut); } catch (_) {}
                reject(err);
            })
            .save(tmpOut);
    });
}

// ── Send voice note — iOS + Android safe ──────
async function sendVoiceNote(conn, from, mek, audioUrl) {
    try {
        // Step 1: Download the audio from URL
        const rawBuffer = await downloadAudio(audioUrl);

        // Step 2: Convert to Opus (fixes iOS "no longer available" bug)
        const opusBuffer = await convertToOpusPTT(rawBuffer);

        // Step 3: Send as PTT voice note using Buffer (not URL)
        // Sending as Buffer prevents iOS from getting a cached/expired URL
        await conn.sendPresenceUpdate('recording', from);
        await conn.sendMessage(
            from,
            {
                audio: opusBuffer,
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true               // marks as voice note, not audio file
            },
            { quoted: mek }
        );
        return true;
    } catch (e) {
        console.log('[AUTO-VOICE] Conversion failed, falling back to URL send:', e.message);

        // Fallback: send URL directly (works on Android, may fail on iOS)
        try {
            const isOpus = audioUrl.toLowerCase().includes('.opus');
            await conn.sendPresenceUpdate('recording', from);
            await conn.sendMessage(
                from,
                {
                    audio: { url: audioUrl },
                    mimetype: isOpus ? 'audio/ogg; codecs=opus' : 'audio/mpeg',
                    ptt: true
                },
                { quoted: mek }
            );
            return true;
        } catch (e2) {
            console.log('[AUTO-VOICE] Fallback also failed:', e2.message);
            return false;
        }
    }
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
  🔊 Auto Voice replies active (iOS + Android ✅)
  🎭 Auto Sticker replies active
  💬 Auto Reply replies active

Usage:
• *.autovoice on*  → Enable all 3
• *.autovoice off* → Disable all 3

> 𝑺𝑯𝑨𝑽𝑰𝒀𝑨-𝑿𝑴𝑫 𝑽𝟑 ⚡`
        );
    }

    const newVal = sub === 'on';
    setSetting('autoVoice', newVal);

    return reply(
`${newVal ? '✅' : '❌'} *Auto Voice ${sub.toUpperCase()}!*

${newVal ? `🔊 Auto Voice → ✅ Active (iOS + Android)
🎭 Auto Sticker → ✅ Active
💬 Auto Reply → ✅ Active` : `🔊 Auto Voice → ❌ Stopped
🎭 Auto Sticker → ❌ Stopped
💬 Auto Reply → ❌ Stopped`}

_Saved instantly — no restart needed_ ✅

> 𝑺𝑯𝑨𝑽𝑰𝒀𝑨-𝑿𝑴𝑫 𝑽𝟑 ⚡`
    );
});

// ══════════════════════════════════════════════
//   on:body — runs all 3 when autoVoice = ON
// ══════════════════════════════════════════════
cmd({ on: 'body' },
async (conn, mek, m, { from, body, isOwner }) => {
    try {
        const enabled = getSetting('autoVoice') ?? getConfig('AUTO_VOICE') ?? false;
        if (!enabled) return;
        if (isOwner) return;
        if (!body || !body.trim()) return;

        const bodyLower = body.trim().toLowerCase();

        // ── 1. Auto Voice (iOS + Android safe) ─────────────────
        try {
            const voiceData = loadJson(VOICE_FILE);
            for (const text in voiceData) {
                if (bodyLower === text.trim().toLowerCase()) {
                    await sendVoiceNote(conn, from, mek, voiceData[text]);
                    break;
                }
            }
        } catch (e) { console.log('[AUTO-VOICE]:', e.message); }

        // ── 2. Auto Sticker ─────────────────────────────────────
        try {
            const stickerData = loadJson(STICKER_FILE);
            for (const text in stickerData) {
                if (bodyLower === text.trim().toLowerCase()) {
                    await conn.sendMessage(
                        from,
                        { sticker: { url: stickerData[text] }, package: 'S_I_H_I_L_E_L' },
                        { quoted: mek }
                    );
                    break;
                }
            }
        } catch (e) { console.log('[AUTO-STICKER]:', e.message); }

        // ── 3. Auto Reply ────────────────────────────────────────
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
