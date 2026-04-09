// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//   plugins/word-trigger-voice.js — SHAVIYA-XMD V2
//
//   🎵 Word Trigger Voice / Song Sender Plugin
//   ✅ කිසියම් word එකක් type කළ විට → voice note / song send කරයි
//   ✅ User දිය word eka auto delete වෙලා voice note send වෙයි
//   ✅ Groups + DM දෙකෙහිම වැඩ කරයි
//   ✅ on/off toggle — default ON
//   ✅ Link add/remove/list commands
//
//   Commands:
//     .triggervoice on/off       → Plugin enable/disable
//     .addtrigger <word> <url>   → Word එකට link add කරන්න
//     .deltrigger <word>         → Word + link delete කරන්න
//     .listtrigger               → සියලු triggers list කරන්න
//
//   Data file: data/wordtrigger.json
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

'use strict';

const fs    = require('fs');
const path  = require('path');
const os    = require('os');
const axios = require('axios');

const { cmd }                         = require('../command');
const { getSetting, setSetting }      = require('../lib/settings');

// ── ffmpeg setup (ffmpeg-static preferred) ──────────────────
let ffmpegPath = null;
try {
    const staticBin = require('ffmpeg-static');
    if (staticBin && fs.existsSync(staticBin)) {
        try { fs.chmodSync(staticBin, 0o755); } catch (_) {}
        ffmpegPath = staticBin;
    }
} catch (_) {}

if (!ffmpegPath) {
    const { execSync } = require('child_process');
    try {
        const s = execSync('which ffmpeg 2>/dev/null', { encoding: 'utf8' }).trim();
        if (s) ffmpegPath = s;
    } catch (_) {}
}

let fluent = null;
try {
    fluent = require('fluent-ffmpeg');
    if (ffmpegPath) fluent.setFfmpegPath(ffmpegPath);
} catch (_) {}

// ── Data file path ──────────────────────────────────────────
const DATA_FILE = path.join(__dirname, '../data/wordtrigger.json');

function loadTriggers() {
    try {
        if (!fs.existsSync(DATA_FILE)) return {};
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (_) { return {}; }
}

function saveTriggers(data) {
    try {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.log('[WORD-TRIGGER] Save error:', e.message);
    }
}

// ── Audio download ──────────────────────────────────────────
async function downloadAudio(url) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    return Buffer.from(res.data);
}

// ── Convert to OGG Opus PTT (iOS + Android compatible) ─────
function convertToOpusPTT(inputBuffer) {
    return new Promise((resolve, reject) => {
        if (!ffmpegPath || !fluent) return reject(new Error('ffmpeg not available'));
        const tmpIn  = path.join(os.tmpdir(), `wt_in_${Date.now()}.tmp`);
        const tmpOut = path.join(os.tmpdir(), `wt_out_${Date.now()}.ogg`);
        fs.writeFileSync(tmpIn, inputBuffer);
        fluent(tmpIn)
            .audioCodec('libopus')
            .audioChannels(1)
            .audioFrequency(48000)
            .audioBitrate('64k')
            .format('ogg')
            .on('end', () => {
                try {
                    const buf = fs.readFileSync(tmpOut);
                    try { fs.unlinkSync(tmpIn); } catch (_) {}
                    try { fs.unlinkSync(tmpOut); } catch (_) {}
                    resolve(buf);
                } catch (e) { reject(e); }
            })
            .on('error', (e) => {
                try { fs.unlinkSync(tmpIn); } catch (_) {}
                try { fs.unlinkSync(tmpOut); } catch (_) {}
                reject(e);
            })
            .save(tmpOut);
    });
}

// ── Send voice note ─────────────────────────────────────────
async function sendVoiceNote(conn, from, mek, audioUrl) {
    // Method 1: Download + convert to opus
    try {
        const rawBuf  = await downloadAudio(audioUrl);
        const opusBuf = await convertToOpusPTT(rawBuf);
        await conn.sendPresenceUpdate('recording', from);
        await conn.sendMessage(from, {
            audio:    opusBuf,
            mimetype: 'audio/ogg; codecs=opus',
            ptt:      true
        }, { quoted: mek });
        return true;
    } catch (e) {
        console.log('[WORD-TRIGGER] Opus convert failed, trying URL fallback:', e.message);
    }

    // Method 2: Direct URL fallback
    try {
        const isOpus = audioUrl.toLowerCase().includes('.opus');
        await conn.sendPresenceUpdate('recording', from);
        await conn.sendMessage(from, {
            audio:    { url: audioUrl },
            mimetype: isOpus ? 'audio/ogg; codecs=opus' : 'audio/mpeg',
            ptt:      true
        }, { quoted: mek });
        return true;
    } catch (e2) {
        console.log('[WORD-TRIGGER] Fallback also failed:', e2.message);
        return false;
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  .triggervoice on / off
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
cmd({
    pattern:  'triggervoice',
    alias:    ['wordvoice', 'wv'],
    desc:     'Word Trigger Voice plugin on/off කරන්න',
    category: 'owner',
    react:    '🎵',
    filename: __filename
},
async (conn, mek, m, { isOwner, q, reply }) => {
    if (!isOwner) return reply('❌ *Owner only command!*');

    const sub = (q || '').toLowerCase().trim();

    if (!sub || (sub !== 'on' && sub !== 'off')) {
        // Default true — show current status
        const cur = getSetting('wordTriggerVoice') ?? true;
        const triggers = loadTriggers();
        const count = Object.keys(triggers).length;
        return reply(
            `🎵 *Word Trigger Voice Plugin*\n\n` +
            `📌 *Status:* ${cur ? '✅ ON' : '❌ OFF'}\n` +
            `📋 *Triggers:* ${count} words\n\n` +
            `*Usage:*\n` +
            `• *.triggervoice on*  → Enable\n` +
            `• *.triggervoice off* → Disable\n\n` +
            `> 𝑺𝑯𝑨𝑽𝑰𝒀𝑨-𝑿𝑴𝑫 𝑽𝟐 ⚡`
        );
    }

    const newVal = sub === 'on';
    setSetting('wordTriggerVoice', newVal);
    return reply(
        `${newVal ? '✅' : '❌'} *Word Trigger Voice ${sub.toUpperCase()}!*\n\n` +
        `_Saved instantly — no restart needed_ ✅\n\n` +
        `> 𝑺𝑯𝑨𝑽𝑰𝒀𝑨-𝑿𝑴𝑫 𝑽𝟐 ⚡`
    );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  .addtrigger <word> <audio_url>
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
cmd({
    pattern:  'addtrigger',
    alias:    ['addwv', 'addvoicetrigger'],
    desc:     'Word trigger voice link add කරන්න',
    category: 'owner',
    react:    '➕',
    filename: __filename
},
async (conn, mek, m, { isOwner, q, reply }) => {
    if (!isOwner) return reply('❌ *Owner only command!*');

    if (!q || !q.trim()) {
        return reply(
            `➕ *Add Word Trigger*\n\n` +
            `*Usage:* *.addtrigger <word> <audio_url>*\n\n` +
            `*Example:*\n` +
            `*.addtrigger hello https://files.catbox.moe/abc.mp3*\n\n` +
            `_"hello" type කළ විට ඒ audio eka voice note ලෙස send වෙයි_ 🎵\n\n` +
            `> 𝑺𝑯𝑨𝑽𝑰𝒀𝑨-𝑿𝑴𝑫 𝑽𝟐 ⚡`
        );
    }

    const parts = q.trim().split(/\s+/);
    if (parts.length < 2) {
        return reply(
            `❗ *Word සහ URL දෙකම දෙන්න!*\n\n` +
            `*Usage:* *.addtrigger <word> <url>*\n\n` +
            `> 𝑺𝑯𝑨𝑽𝑰𝒀𝑨-𝑿𝑴𝑫 𝑽𝟐 ⚡`
        );
    }

    const word = parts[0].toLowerCase().trim();
    const url  = parts[1].trim();

    // Basic URL check
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return reply(
            `❗ *Valid URL එකක් දෙන්න!*\n` +
            `URL https:// හෝ http:// වලින් ආරම්භ විය යුතුය.\n\n` +
            `> 𝑺𝑯𝑨𝑽𝑰𝒀𝑨-𝑿𝑴𝑫 𝑽𝟐 ⚡`
        );
    }

    const triggers = loadTriggers();
    const isUpdate = !!triggers[word];
    triggers[word] = url;
    saveTriggers(triggers);

    return reply(
        `${isUpdate ? '🔄 Updated' : '✅ Added'} *Word Trigger!*\n\n` +
        `📝 *Word:* \`${word}\`\n` +
        `🔗 *URL:* ${url}\n\n` +
        `_"${word}" type කළ විට voice note send වෙයි_ 🎵\n\n` +
        `> 𝑺𝑯𝑨𝑽𝑰𝒀𝑨-𝑿𝑴𝑫 𝑽𝟐 ⚡`
    );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  .deltrigger <word>
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
cmd({
    pattern:  'deltrigger',
    alias:    ['removetrigger', 'delwv'],
    desc:     'Word trigger voice link delete කරන්න',
    category: 'owner',
    react:    '🗑️',
    filename: __filename
},
async (conn, mek, m, { isOwner, q, reply }) => {
    if (!isOwner) return reply('❌ *Owner only command!*');

    if (!q || !q.trim()) {
        return reply(
            `🗑️ *Delete Word Trigger*\n\n` +
            `*Usage:* *.deltrigger <word>*\n\n` +
            `*Example:* *.deltrigger hello*\n\n` +
            `> 𝑺𝑯𝑨𝑽𝑰𝒀𝑨-𝑿𝑴𝑫 𝑽𝟐 ⚡`
        );
    }

    const word = q.trim().toLowerCase();
    const triggers = loadTriggers();

    if (!triggers[word]) {
        return reply(
            `❗ *"${word}" trigger නැහැ!*\n\n` +
            `*.listtrigger* command ගහලා list check කරන්න.\n\n` +
            `> 𝑺𝑯𝑨𝑽𝑰𝒀𝑨-𝑿𝑴𝑫 𝑽𝟐 ⚡`
        );
    }

    delete triggers[word];
    saveTriggers(triggers);

    return reply(
        `🗑️ *Trigger Deleted!*\n\n` +
        `📝 *Word:* \`${word}\` removed successfully.\n\n` +
        `> 𝑺𝑯𝑨𝑽𝑰𝒀𝑨-𝑿𝑴𝑫 𝑽𝟐 ⚡`
    );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  .listtrigger
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
cmd({
    pattern:  'listtrigger',
    alias:    ['triggerslist', 'wvlist'],
    desc:     'සියලු word trigger list කරන්න',
    category: 'owner',
    react:    '📋',
    filename: __filename
},
async (conn, mek, m, { isOwner, reply }) => {
    if (!isOwner) return reply('❌ *Owner only command!*');

    const triggers = loadTriggers();
    const words    = Object.keys(triggers);

    if (words.length === 0) {
        return reply(
            `📋 *Word Trigger List*\n\n` +
            `_Triggers නැහැ!_\n\n` +
            `*.addtrigger <word> <url>* command ගහලා add කරන්න.\n\n` +
            `> 𝑺𝑯𝑨𝑽𝑰𝒀𝑨-𝑿𝑴𝑫 𝑽𝟐 ⚡`
        );
    }

    const lines = words.map((w, i) =>
        `*${i + 1}.* \`${w}\`\n   🔗 ${triggers[w]}`
    ).join('\n\n');

    return reply(
        `📋 *Word Trigger List* (${words.length} triggers)\n\n` +
        `${lines}\n\n` +
        `> 𝑺𝑯𝑨𝑽𝑰𝒀𝑨-𝑿𝑴𝑫 𝑽𝟐 ⚡`
    );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  on:body — Message listener (main logic)
//  ✅ Word match → delete user's message → send voice note
//  ✅ Groups + DM දෙකෙහිම වැඩ කරයි
//  ✅ Default: ON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
cmd({ on: 'body', dontAddCommandList: true },
async (conn, mek, m, { from, body, isOwner }) => {
    try {
        // ── Plugin enabled check (default true) ──────────────
        const enabled = getSetting('wordTriggerVoice') ?? true;
        if (!enabled) return;

        // ── Skip if no message body ───────────────────────────
        if (!body || !body.trim()) return;

        const bodyLower = body.trim().toLowerCase();

        // ── Skip commands (prefix වලින් start වෙන ඒවා) ───────
        // Don't skip — triggers should work even with prefix chars
        // But skip bot's own messages
        const botNumber = conn.user?.id?.split(':')[0] + '@s.whatsapp.net';
        const sender    = mek.key?.participant || mek.key?.remoteJid;
        if (sender === botNumber) return;

        // ── Load trigger data ─────────────────────────────────
        const triggers = loadTriggers();
        if (Object.keys(triggers).length === 0) return;

        // ── Check for matching word ───────────────────────────
        let matchedUrl = null;
        let matchedWord = null;

        for (const word in triggers) {
            // Exact match (full message == trigger word)
            if (bodyLower === word.trim().toLowerCase()) {
                matchedUrl  = triggers[word];
                matchedWord = word;
                break;
            }
        }

        if (!matchedUrl) return;

        // ── Step 1: Delete user's message ────────────────────
        try {
            await conn.sendMessage(from, {
                delete: mek.key
            });
        } catch (delErr) {
            // Delete fail වුනත් voice note send කරනවා
            console.log('[WORD-TRIGGER] Delete failed (no admin?):', delErr.message);
        }

        // ── Step 2: Send voice note ───────────────────────────
        const sent = await sendVoiceNote(conn, from, mek, matchedUrl);

        if (!sent) {
            console.log(`[WORD-TRIGGER] Voice send failed for word: "${matchedWord}"`);
        } else {
            console.log(`[WORD-TRIGGER] ✅ Voice sent for word: "${matchedWord}"`);
        }

    } catch (e) {
        console.log('[WORD-TRIGGER] Error:', e.message);
    }
});
