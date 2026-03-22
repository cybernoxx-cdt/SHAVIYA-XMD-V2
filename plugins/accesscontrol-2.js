// ============================================
//   plugins/accesscontrol.js
// ============================================

const { cmd } = require('../command');
const { getSetting, setSetting } = require('../lib/settings');

// ── SET MODE ──────────────────────────────────
cmd({
    pattern: 'setmode',
    alias: ['mode'],
    desc: 'Set bot mode',
    category: 'settings',
    react: '🔐',
    filename: __filename
},
async (conn, mek, m, { isOwner, q, reply }) => {
    if (!isOwner) return reply('❌ Owner only!');

    const validModes = ['public', 'private', 'inbox', 'group', 'premium', 'privatepremium'];

    if (!q) {
        const current = getSetting('mode');
        return reply(`🔐 *Current Mode:* ${current}\n\n*Valid modes:*\n${validModes.join(' | ')}`);
    }

    if (!validModes.includes(q.toLowerCase())) {
        return reply(`❌ Invalid mode!\n\n*Valid modes:*\n${validModes.join(' | ')}`);
    }

    setSetting('mode', q.toLowerCase());
    reply(`✅ *Mode set to:* ${q.toLowerCase()}`);
});

// ── ADD PREMIUM ───────────────────────────────
cmd({
    pattern: 'addpremium',
    alias: ['ap'],
    desc: 'Add premium user',
    category: 'settings',
    react: '💎',
    filename: __filename
},
async (conn, mek, m, { isOwner, q, reply, quoted, sender }) => {
    if (!isOwner) return reply('❌ Owner only!');

    let number = q ? q.replace(/[^0-9]/g, '') :
                 quoted ? quoted.sender.split('@')[0] : null;

    if (!number) return reply('Usage: .addpremium 94712345678\nOr reply to a user message.');

    const jid = number + '@s.whatsapp.net';
    let premiumUsers = getSetting('premiumUsers') || [];

    if (premiumUsers.includes(jid)) return reply(`⚠️ @${number} is already premium!`);

    premiumUsers.push(jid);
    setSetting('premiumUsers', premiumUsers);
    reply(`✅ *@${number} added as Premium user!* 💎`);
});

// ── REMOVE PREMIUM ────────────────────────────
cmd({
    pattern: 'removepremium',
    alias: ['rp', 'delpremium'],
    desc: 'Remove premium user',
    category: 'settings',
    react: '🗑️',
    filename: __filename
},
async (conn, mek, m, { isOwner, q, reply, quoted }) => {
    if (!isOwner) return reply('❌ Owner only!');

    let number = q ? q.replace(/[^0-9]/g, '') :
                 quoted ? quoted.sender.split('@')[0] : null;

    if (!number) return reply('Usage: .removepremium 94712345678');

    const jid = number + '@s.whatsapp.net';
    let premiumUsers = getSetting('premiumUsers') || [];

    if (!premiumUsers.includes(jid)) return reply(`⚠️ @${number} is not a premium user!`);

    premiumUsers = premiumUsers.filter(u => u !== jid);
    setSetting('premiumUsers', premiumUsers);
    reply(`✅ *@${number} removed from Premium!*`);
});

// ── PREMIUM LIST ──────────────────────────────
cmd({
    pattern: 'premiumlist',
    alias: ['plist'],
    desc: 'List premium users',
    category: 'settings',
    react: '📋',
    filename: __filename
},
async (conn, mek, m, { isOwner, reply }) => {
    if (!isOwner) return reply('❌ Owner only!');

    const premiumUsers = getSetting('premiumUsers') || [];

    if (premiumUsers.length === 0) return reply('💎 No premium users found.');

    let list = `💎 *Premium Users List*\n\n`;
    premiumUsers.forEach((jid, i) => {
        list += `${i + 1}. @${jid.split('@')[0]}\n`;
    });

    await conn.sendMessage(m.chat, {
        text: list,
        mentions: premiumUsers
    }, { quoted: mek });
});

// ── MY MODE ───────────────────────────────────
cmd({
    pattern: 'mymode',
    alias: ['botmode'],
    desc: 'Check current bot mode',
    category: 'settings',
    react: '🔍',
    filename: __filename
},
async (conn, mek, m, { sender, reply }) => {
    const mode     = getSetting('mode');
    const premium  = getSetting('premiumUsers') || [];
    const isPrem   = premium.includes(sender);

    reply(`🔍 *Bot Status*\n\n🔐 *Mode:* ${mode}\n💎 *Your Status:* ${isPrem ? 'Premium ✅' : 'Free User'}`);
});
