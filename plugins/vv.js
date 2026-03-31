// plugins/vv.js — View Once Retriever
// ✅ prefix cmd + non-prefix trigger (vv, wtf, v)
// ✅ RegExp pattern handled by fixed command.js

'use strict';

const { cmd } = require('../command');

// ══════════════════════════════════════════
//  PREFIX command  →  .vv / .viewonce
// ══════════════════════════════════════════
cmd({
    pattern: 'vv',
    alias: ['viewonce', 'retrieve'],
    react: '💫',
    desc: 'Retrieve View Once media',
    category: 'tools',
    filename: __filename
},
async (conn, mek, m, { reply }) => {
    try {
        if (!mek.quoted) return reply('🍁 Reply to a view-once message!');
        const buffer = await mek.quoted.download();
        const type   = mek.quoted.mtype;
        const target = mek.sender;

        if (type === 'imageMessage') {
            return conn.sendMessage(target, { image: buffer, caption: mek.quoted.msg?.caption || '' }, { quoted: mek });
        }
        if (type === 'videoMessage') {
            return conn.sendMessage(target, { video: buffer, caption: mek.quoted.msg?.caption || '' }, { quoted: mek });
        }
        if (type === 'audioMessage') {
            return conn.sendMessage(target, { audio: buffer, mimetype: 'audio/mpeg', ptt: false }, { quoted: mek });
        }
        return reply('❌ Unsupported message type.');
    } catch (err) {
        console.error('[vv prefix]', err.message);
        reply('❌ Failed to retrieve message.');
    }
});

// ══════════════════════════════════════════
//  NON-PREFIX listener  →  vv / wtf / v
//  Uses  on:'body'  so command.js never
//  tries  .toLowerCase()  on a RegExp
// ══════════════════════════════════════════
cmd({
    on: 'body',
    desc: 'View-once non-prefix trigger',
    category: 'tools',
    filename: __filename,
    dontAddCommandList: true
},
async (conn, mek, m, { body, from }) => {
    try {
        // Match exact keywords (case-insensitive), no prefix
        const trigger = /^(vv|wtf|v)$/i.test((body || '').trim());
        if (!trigger) return;
        if (!mek.quoted) return; // silent if no quoted msg

        const buffer = await mek.quoted.download();
        const type   = mek.quoted.mtype;
        const target = mek.sender;

        if (type === 'imageMessage') {
            return conn.sendMessage(target, { image: buffer, caption: mek.quoted.msg?.caption || '' });
        }
        if (type === 'videoMessage') {
            return conn.sendMessage(target, { video: buffer, caption: mek.quoted.msg?.caption || '' });
        }
        if (type === 'audioMessage') {
            return conn.sendMessage(target, { audio: buffer, mimetype: 'audio/mpeg', ptt: false });
        }
    } catch (err) {
        // Silent — don't expose to users
        console.error('[vv non-prefix]', err.message);
    }
});
