// ============================================
//   plugins/tts.js - FIXED VERSION
//   "This audio is not available" error fixed
//   Uses correct mimetype + ffmpeg conversion
// ============================================

const { cmd } = require('../command');
const fs   = require('fs');
const path = require('path');
const axios = require('axios');

// ── Tmp folder ──
const tmpDir = path.join(__dirname, '../tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

// ── Supported languages ──
const languages = {
    'si': 'si', 'en': 'en', 'ta': 'ta', 'hi': 'hi',
    'ja': 'ja', 'ko': 'ko', 'zh': 'zh', 'fr': 'fr',
    'de': 'de', 'es': 'es', 'ar': 'ar', 'ru': 'ru',
    'pt': 'pt', 'it': 'it'
};

// ══════════════════════════════════════════
//   CORE: Generate TTS audio buffer
//   Uses Google Translate TTS URL directly
//   Returns raw audio buffer
// ══════════════════════════════════════════
async function generateTTS(text, lang = 'en') {
    // Split long text into chunks (Google TTS max ~200 chars)
    const chunks = [];
    const words  = text.split(' ');
    let current  = '';

    for (const word of words) {
        if ((current + ' ' + word).trim().length > 180) {
            if (current) chunks.push(current.trim());
            current = word;
        } else {
            current = (current + ' ' + word).trim();
        }
    }
    if (current) chunks.push(current.trim());

    const buffers = [];

    for (const chunk of chunks) {
        const encoded = encodeURIComponent(chunk);
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${lang}&client=tw-ob&ttsspeed=1`;

        const res = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 20000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/91.0 Safari/537.36',
                'Referer':    'https://translate.google.com/',
                'Accept':     'audio/mpeg, audio/*, */*'
            }
        });

        if (!res.data || res.data.byteLength < 100) throw new Error('Empty audio response');
        buffers.push(Buffer.from(res.data));
    }

    // Merge all chunks into one buffer
    return Buffer.concat(buffers);
}

// ══════════════════════════════════════════
//   SEND: Convert and send as voice note
//   Saves to tmp, converts with ffmpeg,
//   sends as ogg/opus (WhatsApp PTT format)
// ══════════════════════════════════════════
async function sendTTS(conn, mek, from, text, lang) {
    const id      = Date.now();
    const mp3File = path.join(tmpDir, `tts_${id}.mp3`);
    const oggFile = path.join(tmpDir, `tts_${id}.ogg`);

    try {
        // 1. Generate audio buffer
        const buffer = await generateTTS(text, lang);

        // 2. Save as mp3
        fs.writeFileSync(mp3File, buffer);

        // 3. Convert mp3 → ogg/opus using ffmpeg (WhatsApp needs this)
        await convertToOgg(mp3File, oggFile);

        // 4. Read converted file
        const audioBuffer = fs.readFileSync(oggFile);

        // 5. Send as PTT voice note
        await conn.sendMessage(from, {
            audio:    audioBuffer,
            mimetype: 'audio/ogg; codecs=opus',  // ✅ Correct WhatsApp PTT mimetype
            ptt:      true
        }, { quoted: mek });

    } finally {
        // Cleanup temp files
        try { if (fs.existsSync(mp3File)) fs.unlinkSync(mp3File); } catch {}
        try { if (fs.existsSync(oggFile)) fs.unlinkSync(oggFile); } catch {}
    }
}

// ══════════════════════════════════════════
//   FFMPEG: Convert mp3 to ogg opus
// ══════════════════════════════════════════
function convertToOgg(inputFile, outputFile) {
    return new Promise((resolve, reject) => {
        try {
            const ffmpeg = require('fluent-ffmpeg');
            try {
                const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
                ffmpeg.setFfmpegPath(ffmpegPath);
            } catch {}

            ffmpeg(inputFile)
                .audioCodec('libopus')
                .audioChannels(1)
                .audioFrequency(48000)
                .format('ogg')
                .on('end', resolve)
                .on('error', reject)
                .save(outputFile);

        } catch (e) {
            // If ffmpeg not available, use mp3 directly with correct mimetype
            fs.copyFileSync(inputFile, outputFile);
            resolve();
        }
    });
}

// ══════════════════════════════════════════
//   .tts - Main TTS command
// ══════════════════════════════════════════
cmd({
    pattern: 'tts',
    desc: 'Convert text to speech',
    category: 'tools',
    react: '🔊',
    use: '.tts <text>  |  .tts si <සිංහල>  |  .tts hi <हिंदी>',
    filename: __filename
},
async (conn, mek, m, { from, q, reply, quoted }) => {
    try {
        // Get text from command or quoted message
        let text = q || (quoted?.text) || (quoted?.caption) || null;
        if (!text) return reply(
            `🔊 *TTS Usage:*\n\n` +
            `▸ .tts Hello world\n` +
            `▸ .tts si ආයුබෝවන්\n` +
            `▸ .tts hi नमस्ते\n` +
            `▸ .tts ta வணக்கம்\n\n` +
            `*Languages:* ${Object.keys(languages).join(' • ')}`
        );

        // Detect language prefix
        let lang = 'en';
        const words = text.trim().split(' ');
        if (languages[words[0]?.toLowerCase()]) {
            lang = words[0].toLowerCase();
            text = words.slice(1).join(' ').trim();
        }

        if (!text) return reply('❌ Language code දිනාට පස්සේ text දෙන්න!\nExample: .tts si ආයුබෝවන්');
        if (text.length > 500) return reply('❌ Max 500 characters!');

        await conn.sendMessage(from, { react: { text: '🔊', key: mek.key } });

        await sendTTS(conn, mek, from, text, lang);

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.log('[TTS ERROR]:', e.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ TTS error: ${e.message}`);
    }
});

// ══════════════════════════════════════════
//   .tts2 - English TTS fast
// ══════════════════════════════════════════
cmd({
    pattern: 'tts2',
    desc: 'English Text to Speech',
    category: 'tools',
    react: '🔊',
    use: '.tts2 <text>',
    filename: __filename
},
async (conn, mek, m, { from, q, reply, quoted }) => {
    try {
        let text = q || quoted?.text || quoted?.caption || null;
        if (!text) return reply('🔊 Usage: .tts2 Hello world');
        if (text.length > 300) return reply('❌ Max 300 characters!');

        await conn.sendMessage(from, { react: { text: '🔊', key: mek.key } });
        await sendTTS(conn, mek, from, text, 'en');
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.log('[TTS2 ERROR]:', e.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ TTS2 error: ${e.message}`);
    }
});

// ══════════════════════════════════════════
//   .tts3 - Sinhala TTS dedicated
// ══════════════════════════════════════════
cmd({
    pattern: 'tts3',
    desc: 'Sinhala Text to Speech',
    category: 'tools',
    react: '🔊',
    use: '.tts3 <සිංහල text>',
    filename: __filename
},
async (conn, mek, m, { from, q, reply, quoted }) => {
    try {
        let text = q || quoted?.text || quoted?.caption || null;
        if (!text) return reply('🔊 Usage: .tts3 ආයුබෝවන් කොහොමද');
        if (text.length > 500) return reply('❌ Max 500 characters!');

        await conn.sendMessage(from, { react: { text: '🔊', key: mek.key } });
        await sendTTS(conn, mek, from, text, 'si');
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.log('[TTS3 ERROR]:', e.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ Sinhala TTS error: ${e.message}`);
    }
});
