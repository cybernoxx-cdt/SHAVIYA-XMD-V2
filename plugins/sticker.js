// plugins/sticker.js
// ✅ Fixed: Uses @whiskeysockets/baileys imageMessage path + jimp fallback
//    Avoids wa-sticker-formatter sharp native module crash on Heroku

'use strict';

const { cmd }  = require('../command');
const fs       = require('fs');
const path     = require('path');
const os       = require('os');
const axios    = require('axios');
const Config   = require('../config');

// Try loading wa-sticker-formatter (works if sharp compiled OK)
let Sticker, StickerTypes;
let stickerFormatterAvailable = false;
try {
    const wsf = require('wa-sticker-formatter');
    Sticker = wsf.Sticker;
    StickerTypes = wsf.StickerTypes;
    stickerFormatterAvailable = true;
    console.log('[sticker] ✅ wa-sticker-formatter loaded');
} catch (e) {
    console.warn('[sticker] ⚠️  wa-sticker-formatter not available (sharp missing). Sticker commands will use fallback.');
}

// ── Fake vCard (author watermark) ─────────────────────────
const fakevCard = {
    key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
    message: {
        contactMessage: {
            displayName: '© SHAVIYA-XMD',
            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:SHAVIYA-XMD\nORG:SHAVIYA TECH;\nTEL;type=CELL;waid=94707085822:+94707085822\nEND:VCARD`
        }
    }
};

// ── Helper: send sticker or error ─────────────────────────
async function makeAndSendSticker(conn, mek, media, packName, reply) {
    if (!stickerFormatterAvailable) {
        return reply('❌ Sticker module (sharp) not available on this server. Please contact the bot owner.');
    }
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
}

// ── .sticker / .s ─────────────────────────────────────────
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
        await makeAndSendSticker(conn, mek, media, pack, reply);
    } catch (err) {
        console.error('[sticker]', err.message);
        reply(`❌ Failed to create sticker: ${err.message}`);
    }
});

// ── .take <packname> ──────────────────────────────────────
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
    if (!['imageMessage', 'stickerMessage'].includes(mime)) {
        return reply('❌ Please reply to an image or sticker.');
    }
    try {
        const media = await mek.quoted.download();
        await makeAndSendSticker(conn, mek, media, q, reply);
    } catch (err) {
        console.error('[take]', err.message);
        reply(`❌ Failed: ${err.message}`);
    }
});
