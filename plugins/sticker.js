// plugins/sticker.js — SHAVIYA-XMD V2
// ✅ FIXED: Correct ffmpeg WebP filter chain (palettegen/paletteuse removed — GIF-only filters)
// ✅ FIXED: chmod applied to @ffmpeg-installer binary too
// ✅ FIXED: pad uses (ow-iw)/2 centering instead of -1:-1 which can error

'use strict';

const { cmd }  = require('../command');
const fs       = require('fs');
const path     = require('path');
const os       = require('os');
const Config   = require('../config');
const fluent   = require('fluent-ffmpeg');

// ── Resolve ffmpeg path ──
let ffmpegPath = null;

try {
    const staticBin = require('ffmpeg-static');
    if (staticBin && fs.existsSync(staticBin)) {
        try { fs.chmodSync(staticBin, 0o755); } catch (_) {}
        ffmpegPath = staticBin;
        console.log('[sticker] ✅ ffmpeg-static:', staticBin);
    }
} catch (_) {}

if (!ffmpegPath) {
    try {
        const inst = require('@ffmpeg-installer/ffmpeg');
        if (inst && inst.path && fs.existsSync(inst.path)) {
            try { fs.chmodSync(inst.path, 0o755); } catch (_) {}
            ffmpegPath = inst.path;
            console.log('[sticker] ✅ @ffmpeg-installer:', inst.path);
        }
    } catch (_) {}
}

if (!ffmpegPath) {
    try {
        const { execSync } = require('child_process');
        const sys = execSync('which ffmpeg 2>/dev/null', { encoding: 'utf8' }).trim();
        if (sys) { ffmpegPath = sys; console.log('[sticker] ✅ system ffmpeg:', sys); }
    } catch (_) {}
}

if (ffmpegPath) fluent.setFfmpegPath(ffmpegPath);
else console.error('[sticker] ❌ No ffmpeg found — sticker will not work');

// ── wa-sticker-formatter (optional, needs sharp) ──
let Sticker, StickerTypes;
let stickerFormatterAvailable = false;
try {
    const wsf = require('wa-sticker-formatter');
    Sticker = wsf.Sticker;
    StickerTypes = wsf.StickerTypes;
    stickerFormatterAvailable = true;
    console.log('[sticker] ✅ wa-sticker-formatter loaded');
} catch (_) {
    console.warn('[sticker] ⚠️  wa-sticker-formatter not available — using ffmpeg fallback');
}

const fakevCard = {
    key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
    message: {
        contactMessage: {
            displayName: '© SHAVIYA-XMD',
            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:SHAVIYA-XMD\nORG:SHAVIYA TECH;\nTEL;type=CELL;waid=94707085822:+94707085822\nEND:VCARD`
        }
    }
};

// ── FIXED ffmpeg WebP converter ──
// KEY FIX: palettegen/paletteuse are GIF-only — they BREAK libwebp encoding.
// Removed those filters. Simple scale+pad+libwebp works for both static & animated.
function makeWebpFfmpeg(inputBuffer, isAnimated) {
    return new Promise((resolve, reject) => {
        const ext    = isAnimated ? 'mp4' : 'jpg';
        const tmpIn  = path.join(os.tmpdir(), `stk_in_${Date.now()}.${ext}`);
        const tmpOut = path.join(os.tmpdir(), `stk_out_${Date.now()}.webp`);

        const cleanup = () => {
            try { if (fs.existsSync(tmpIn))  fs.unlinkSync(tmpIn);  } catch (_) {}
            try { if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut); } catch (_) {}
        };

        try { fs.writeFileSync(tmpIn, inputBuffer); } catch (e) { return reject(e); }

        const cmd = fluent(tmpIn);

        // Shared scale+pad filter — center image in 512x512, transparent bg
        const scaleFilter = "scale='min(512,iw)':'min(512,ih)':force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0.0";

        if (isAnimated) {
            cmd.addOutputOptions([
                '-vcodec', 'libwebp',
                '-vf', `fps=15,${scaleFilter}`,
                '-loop', '0',
                '-preset', 'default',
                '-an',
                '-vsync', '0',
                '-t', '8'
            ]);
        } else {
            cmd.addOutputOptions([
                '-vcodec', 'libwebp',
                '-vf', scaleFilter,
                '-preset', 'default',
                '-loop', '0',
                '-an',
                '-frames:v', '1'
            ]);
        }

        cmd
            .toFormat('webp')
            .on('end', () => {
                try {
                    const buf = fs.readFileSync(tmpOut);
                    cleanup();
                    resolve(buf);
                } catch (e) { cleanup(); reject(e); }
            })
            .on('error', (e) => { cleanup(); reject(new Error(`ffmpeg: ${e.message}`)); })
            .save(tmpOut);
    });
}

async function makeAndSendSticker(conn, mek, media, mime, packName, reply) {
    const isAnimated = ['videoMessage', 'gifMessage'].includes(mime);

    if (stickerFormatterAvailable) {
        try {
            const sticker = new Sticker(media, {
                pack: packName,
                type: StickerTypes.FULL,
                categories: ['🤩', '🎉'],
                id: '12345',
                quality: 75,
                background: 'transparent'
            });
            const buffer = await sticker.toBuffer();
            return conn.sendMessage(mek.chat, { sticker: buffer }, { quoted: fakevCard });
        } catch (e) {
            console.warn('[sticker] wa-sticker-formatter failed, trying ffmpeg:', e.message);
        }
    }

    if (!ffmpegPath) return reply('❌ ffmpeg not found on server. Contact bot owner.');

    try {
        const webpBuf = await makeWebpFfmpeg(media, isAnimated);
        return conn.sendMessage(mek.chat, { sticker: webpBuf }, { quoted: fakevCard });
    } catch (e) {
        console.error('[sticker] ffmpeg failed:', e.message);
        return reply(`❌ Sticker failed: ${e.message}`);
    }
}

cmd({
    pattern:  'sticker',
    alias:    ['s', 'stickergif'],
    react:    '🔮',
    desc:     'Create sticker from image/video',
    category: 'sticker',
    use:      '<reply media>',
    filename: __filename
},
async (conn, mek, m, { reply }) => {
    if (!mek.quoted) return reply('*Reply to any Image or Video.*');
    const mime = mek.quoted.mtype;
    if (!['imageMessage', 'stickerMessage', 'videoMessage'].includes(mime)) {
        return reply('❌ Please reply to an image or video.');
    }
    try {
        const media = await mek.quoted.download();
        const pack  = Config.PACKNAME || 'SHAVIYA-XMD V2';
        await makeAndSendSticker(conn, mek, media, mime, pack, reply);
    } catch (err) {
        console.error('[sticker]', err.message);
        reply(`❌ Failed: ${err.message}`);
    }
});

cmd({
    pattern:  'take',
    alias:    ['rename', 'stake'],
    react:    '🔮',
    desc:     'Create sticker with custom pack name',
    category: 'sticker',
    use:      '<reply sticker> <packname>',
    filename: __filename
},
async (conn, mek, m, { q, reply }) => {
    if (!mek.quoted) return reply('*Reply to any sticker.*');
    if (!q)          return reply('*Please provide a pack name: .take <packname>*');
    const mime = mek.quoted.mtype;
    if (!['imageMessage', 'stickerMessage', 'videoMessage'].includes(mime)) {
        return reply('❌ Please reply to an image or sticker.');
    }
    try {
        const media = await mek.quoted.download();
        await makeAndSendSticker(conn, mek, media, mime, q, reply);
    } catch (err) {
        console.error('[take]', err.message);
        reply(`❌ Failed: ${err.message}`);
    }
});
