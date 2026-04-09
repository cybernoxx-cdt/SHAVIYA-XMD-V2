// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//   plugins/convert.js — SHAVIYA-XMD V2
//
//   🖼️  .convert  — Sticker → Image (PNG)
//   🎵  .tomp3    — Video/Audio → MP3
//   🎙️  .toptt    — Video/Audio → Voice note (PTT)
//
//   Fixed:
//   ✅ No external data/converter dependency — uses bot's own ffmpeg
//   ✅ Correct Baileys message structure (m.quoted not match.quoted)
//   ✅ webp sticker → png via sharp (already in package.json)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

'use strict';

const fs      = require('fs');
const path    = require('path');
const os      = require('os');
const crypto  = require('crypto');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg     = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const { cmd } = require('../command');

// ── Temp file helper ─────────────────────────────────────────
function tmpFile(ext) {
    return path.join(os.tmpdir(), crypto.randomBytes(6).toString('hex') + '.' + ext);
}

// ── ffmpeg convert helper ────────────────────────────────────
function ffmpegConvert(inputBuf, inputExt, outputExt, extraArgs = []) {
    return new Promise((resolve, reject) => {
        const inPath  = tmpFile(inputExt);
        const outPath = tmpFile(outputExt);
        fs.writeFileSync(inPath, inputBuf);
        let cmd2 = ffmpeg(inPath).on('end', () => {
            try {
                const buf = fs.readFileSync(outPath);
                try { fs.unlinkSync(inPath);  } catch (_) {}
                try { fs.unlinkSync(outPath); } catch (_) {}
                resolve(buf);
            } catch (e) { reject(e); }
        }).on('error', (e) => {
            try { fs.unlinkSync(inPath);  } catch (_) {}
            try { fs.unlinkSync(outPath); } catch (_) {}
            reject(e);
        });
        if (extraArgs.length) cmd2 = cmd2.addOutputOptions(extraArgs);
        cmd2.save(outPath);
    });
}

// ── WebP → PNG (sticker to image) ───────────────────────────
async function webpToPng(webpBuf) {
    // Try sharp first (fastest)
    try {
        const sharp = require('sharp');
        return await sharp(webpBuf).png().toBuffer();
    } catch (_) {}

    // Fallback: ffmpeg
    return ffmpegConvert(webpBuf, 'webp', 'png');
}

// ── Any audio/video → MP3 ────────────────────────────────────
async function toMp3(buf, inputExt) {
    return ffmpegConvert(buf, inputExt, 'mp3', [
        '-vn',
        '-ar', '44100',
        '-ac', '2',
        '-b:a', '192k'
    ]);
}

// ── Any audio/video → OGG Opus PTT ──────────────────────────
async function toPtt(buf, inputExt) {
    return ffmpegConvert(buf, inputExt, 'ogg', [
        '-vn',
        '-c:a', 'libopus',
        '-ac', '1',
        '-ar', '48000',
        '-b:a', '64k'
    ]);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  .convert — Sticker → Image
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
cmd({
    pattern:  'convert',
    alias:    ['sticker2img', 'stoimg', 'stickertoimage', 's2i'],
    desc:     'Sticker → Image convert කරන්න',
    category: 'media',
    react:    '🖼️',
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    if (!m.quoted) return reply('🖼️ *Sticker message එකකට reply කරලා .convert දෙන්න*');
    if (m.quoted.mtype !== 'stickerMessage') return reply('❌ Sticker message විතරයි convert කරන්නේ!');

    await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

    try {
        const stickerBuf = await m.quoted.download();
        const imageBuf   = await webpToPng(stickerBuf);

        await conn.sendMessage(from, {
            image:   imageBuf,
            caption: '> © Powered by 𝑺𝑯𝑨𝑽𝑰𝒀𝑨-𝑿𝑴𝑫 𝑽𝟐 ⚡',
            mimetype: 'image/png'
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error('[CONVERT] sticker2img error:', e.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply('❌ Convert කරන්න බැරි වුණා. වෙනත් sticker එකක් try කරන්න.');
    }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  .tomp3 — Video/Audio → MP3
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
cmd({
    pattern:  'tomp3',
    alias:    ['mp3', 'extractaudio'],
    desc:     'Video/Audio → MP3 convert කරන්න',
    category: 'media',
    react:    '🎵',
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    if (!m.quoted) return reply('🎵 *Video හෝ Audio message එකකට reply කරලා .tomp3 දෙන්න*');

    const { mtype, seconds } = m.quoted;
    if (!['videoMessage', 'audioMessage'].includes(mtype))
        return reply('❌ Video හෝ Audio message විතරයි convert කරන්නේ!');
    if (seconds > 300)
        return reply('⏱️ Media too long! Max 5 minutes විතරයි.');

    await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

    try {
        const buf    = await m.quoted.download();
        const ext    = mtype === 'videoMessage' ? 'mp4' : 'm4a';
        const mp3Buf = await toMp3(buf, ext);

        await conn.sendMessage(from, {
            audio:    mp3Buf,
            mimetype: 'audio/mpeg'
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error('[CONVERT] tomp3 error:', e.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply('❌ Convert කරන්න බැරි වුණා.');
    }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  .toptt — Video/Audio → Voice note (PTT)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
cmd({
    pattern:  'toptt',
    alias:    ['ptt', 'voicenote', 'tovoice'],
    desc:     'Video/Audio → Voice note convert කරන්න',
    category: 'media',
    react:    '🎙️',
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    if (!m.quoted) return reply('🎙️ *Video හෝ Audio message එකකට reply කරලා .toptt දෙන්න*');

    const { mtype, seconds } = m.quoted;
    if (!['videoMessage', 'audioMessage'].includes(mtype))
        return reply('❌ Video හෝ Audio message විතරයි convert කරන්නේ!');
    if (seconds > 60)
        return reply('⏱️ Voice note max 1 minute! දිග media .tomp3 use කරන්න.');

    await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

    try {
        const buf    = await m.quoted.download();
        const ext    = mtype === 'videoMessage' ? 'mp4' : 'm4a';
        const pttBuf = await toPtt(buf, ext);

        await conn.sendPresenceUpdate('recording', from);
        await conn.sendMessage(from, {
            audio:    pttBuf,
            mimetype: 'audio/ogg; codecs=opus',
            ptt:      true
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error('[CONVERT] toptt error:', e.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply('❌ Voice note හදන්න බැරි වුණා.');
    }
});
