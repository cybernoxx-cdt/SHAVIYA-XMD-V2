// ============================================
//   plugins/auto-voice.js - SHAVIYA-XMD V2
//   Auto Voice : on/off toggle command +
//   runtime listener (no restart needed)
// ============================================

const fs   = require('fs');
const path = require('path');
const { cmd } = require('../command');
const { getSetting, setSetting } = require('../lib/settings');

// ── Toggle command : .autovoice on / off ──────────────────
cmd({
    pattern:  'autovoice',
    alias:    ['autovc', 'auto-voice'],
    desc:     'Auto voice reply feature on/off toggle',
    category: 'owner',
    react:    '🔊',
    filename: __filename
},
async (conn, mek, m, { isOwner, q, reply }) => {
    if (!isOwner) return reply('❌ *Owner only command!*');

    const sub = (q || '').toLowerCase().trim();

    // Status check
    if (!sub || (sub !== 'on' && sub !== 'off')) {
        const current = getSetting('autoVoice') ?? false;
        return reply(
`🔊 *Auto Voice Status*

📌 *Current:* ${current ? '✅ ON' : '❌ OFF'}

Usage:
• *.autovoice on*  → Enable auto voice replies
• *.autovoice off* → Disable auto voice replies`
        );
    }

    if (sub === 'on') {
        setSetting('autoVoice', true);
        return reply(
`✅ *Auto Voice Enabled!*

🎙️ Bot will now send voice replies automatically.`
        );
    }

    if (sub === 'off') {
        setSetting('autoVoice', false);
        return reply(
`❌ *Auto Voice Disabled!*

🔇 Bot will no longer send auto voice replies.`
        );
    }
});

// ── Auto Voice listener (on every message) ───────────────
cmd({
    on: 'body'
},
async (conn, mek, m, { from, body, isOwner }) => {
    try {
        // Check runtime setting first (persisted), fallback to config
        const config = require('../config');
        const enabled = getSetting('autoVoice') ?? (config.AUTO_VOICE === true || config.AUTO_VOICE === 'true');
        if (!enabled) return;
        if (isOwner) return;

        const filePath = path.join(__dirname, '../ranumitha_data/autovoice.json');
        if (!fs.existsSync(filePath)) return;

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        for (const text in data) {
            if (body.toLowerCase() === text.toLowerCase()) {
                await conn.sendPresenceUpdate('recording', from);
                await conn.sendMessage(
                    from,
                    { audio: { url: data[text] }, mimetype: 'audio/mpeg', ptt: true },
                    { quoted: mek }
                );
                break;
            }
        }
    } catch (err) {
        // Silent fail — don't crash bot on missing data file
    }
});
