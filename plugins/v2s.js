// plugins/v2s.js — Video to MP3 converter
// ✅ Uses ffmpeg-static (no system ffmpeg needed on Heroku)

'use strict';

const { cmd }          = require('../command');
const fluent           = require('fluent-ffmpeg');
const fs               = require('fs');
const path             = require('path');
const os               = require('os');

// ── Resolve ffmpeg path (ffmpeg-static first, then system) ──
let ffmpegPath = null;
try {
    const staticBin = require('ffmpeg-static');
    if (staticBin && fs.existsSync(staticBin)) {
        try { fs.chmodSync(staticBin, 0o755); } catch (_) {}
        ffmpegPath = staticBin;
        console.log('[v2s] ✅ Using ffmpeg-static:', staticBin);
    }
} catch (_) {}

if (!ffmpegPath) {
    const { execSync } = require('child_process');
    try {
        const sys = execSync('which ffmpeg 2>/dev/null', { encoding: 'utf8' }).trim();
        if (sys) { ffmpegPath = sys; console.log('[v2s] ✅ Using system ffmpeg'); }
    } catch (_) {}
}

if (ffmpegPath) {
    fluent.setFfmpegPath(ffmpegPath);
} else {
    console.error('[v2s] ❌ ffmpeg not available — v2s commands will be disabled.');
}

// ── Helper: convert buffer → mp3 buffer ─────────────────────
function videoToMp3(inputBuffer) {
    return new Promise((resolve, reject) => {
        const tmpIn  = path.join(os.tmpdir(), `v2s_in_${Date.now()}.mp4`);
        const tmpOut = path.join(os.tmpdir(), `v2s_out_${Date.now()}.mp3`);
        fs.writeFileSync(tmpIn, inputBuffer);
        fluent(tmpIn)
            .toFormat('mp3')
            .audioBitrate('128k')
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

// ── .v2s command ─────────────────────────────────────────────
cmd({
    pattern:  'v2s',
    alias:    ['video2mp3', 'videotoaudio'],
    react:    '🎵',
    desc:     'Convert video to MP3 audio',
    category: 'tools',
    filename: __filename
},
async (conn, mek, m, { reply }) => {
    try {
        if (!ffmpegPath) return reply('❌ ffmpeg is not available on this server. Contact bot owner.');
        if (!mek.quoted)                        return reply('🎥 Reply to a video message to convert.');
        if (mek.quoted.mtype !== 'videoMessage') return reply('❌ Please reply to a *video* message.');

        await reply('⏳ Converting... please wait.');

        const videoBuffer = await mek.quoted.download();
        if (!videoBuffer || !videoBuffer.length) return reply('❌ Could not download video.');

        const mp3Buffer = await videoToMp3(videoBuffer);

        await conn.sendMessage(mek.chat, {
            audio:    mp3Buffer,
            mimetype: 'audio/mpeg',
            ptt:      false
        }, { quoted: mek });

    } catch (err) {
        console.error('[v2s]', err.message);
        reply(`❌ Conversion failed: ${err.message}`);
    }
});
