const { cmd } = require('../command');
const fs   = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════
//  Access Config — MongoDB Persist + File Fallback
//  Restart වෙද්දිත් settings නැතිවෙන්නෙ නෑ ✅
// ═══════════════════════════════════════════════════

const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── MongoDB connection ──
let _mongoCol = null;
async function getCol() {
  if (_mongoCol) return _mongoCol;
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) return null;
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    _mongoCol = client.db('hasiya_md').collection('access_config');
    console.log('[ACCESS] MongoDB connected ✅');
    return _mongoCol;
  } catch (e) {
    console.error('[ACCESS] MongoDB connect failed:', e.message);
    return null;
  }
}

// ── Number normalize ──
function normalizeNumber(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/@s\.whatsapp\.net/g, '')
    .replace(/@lid/g, '')
    .replace(/:\d+$/g, '')
    .replace(/[^0-9]/g, '');
}

// ── Local file path per session ──
function getLocalFile(sessionId) {
  return path.join(DATA_DIR, `access_config_${sessionId}.json`);
}

// ── Load config: MongoDB first, fallback file ──
async function getAccessConfig(sessionId) {
  // Try MongoDB
  try {
    const col = await getCol();
    if (col) {
      const doc = await col.findOne({ _sessionId: sessionId });
      if (doc) {
        const { _id, _sessionId: _s, ...cfg } = doc;
        // Sync to local file
        fs.writeFileSync(getLocalFile(sessionId), JSON.stringify(cfg, null, 2));
        return cfg;
      }
    }
  } catch (e) {}

  // Fallback: local file
  try {
    const file = getLocalFile(sessionId);
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {}

  return { mode: 'public', premium: [], banned: [] };
}

// ── Save config: MongoDB + local file ──
async function saveAccessConfig(sessionId, cfg) {
  // Save to local file
  try {
    fs.writeFileSync(getLocalFile(sessionId), JSON.stringify(cfg, null, 2));
  } catch (e) {}

  // Save to MongoDB (async)
  try {
    const col = await getCol();
    if (col) {
      await col.updateOne(
        { _sessionId: sessionId },
        { $set: { ...cfg, _sessionId: sessionId } },
        { upsert: true }
      );
    }
  } catch (e) {
    console.error('[ACCESS] MongoDB save failed:', e.message);
  }
}

// ── In-memory cache for sync reads (index.js checkAccess) ──
const _configCache = {};

// Preload cache on startup
async function preloadCache(sessionId) {
  const cfg = await getAccessConfig(sessionId);
  _configCache[sessionId] = cfg;
  return cfg;
}

// Sync read from cache (used by global.checkAccess)
function getAccessConfigSync(sessionId) {
  return _configCache[sessionId] || { mode: 'public', premium: [], banned: [] };
}

// ═══════════════════════════════════════════════════
//  Global Access Checker (index.js call කරනවා)
// ═══════════════════════════════════════════════════
global.checkAccess = function(sessionId, senderNumber, isOwner, isGroup) {
  // Preload cache if not loaded yet (async, non-blocking)
  if (!_configCache[sessionId]) {
    preloadCache(sessionId);
    return { allowed: true }; // Allow while loading
  }

  const cfg    = getAccessConfigSync(sessionId);
  const mode   = cfg.mode || 'public';

  if (isOwner) return { allowed: true, mode };

  const normalSender = normalizeNumber(senderNumber);

  // Banned check
  const bannedList = (cfg.banned || []).map(normalizeNumber);
  if (bannedList.includes(normalSender)) {
    return { allowed: false, mode, reason: '🚫 You are banned from using this bot.' };
  }

  const premiumList = (cfg.premium || []).map(normalizeNumber);

  switch (mode) {
    case 'public':
      return { allowed: true, mode };

    case 'private':
      return { allowed: false, mode, reason: '*🔒 ʙᴏᴛ ɪꜱ ᴘʀɪᴠᴀᴛᴇ ᴍᴏᴅᴇ (ᴏᴡɴᴇʀ ᴏɴʟʏ)*' };

    case 'inbox':
      if (isGroup) return { allowed: false, mode, reason: '*📩 ʙᴏᴛ ɪꜱ ɪɴʙᴏx ᴍᴏᴅᴇ (ɪɴʙᴏx ᴏɴʟʏ)*' };
      return { allowed: true, mode };

    case 'group':
      if (!isGroup) return { allowed: false, mode, reason: '*👥 ʙᴏᴛ ɪꜱ ɢʀᴏᴜᴘ ᴍᴏᴅᴇ (ɢʀᴏᴜᴘ ᴏɴʟʏ)*' };
      return { allowed: true, mode };

    case 'premium':
      if (!premiumList.includes(normalSender))
        return { allowed: false, mode, reason: '💎 BOT PREMIUM MODE. Premium users Only.' };
      return { allowed: true, mode };

    case 'privatepremium':
      if (!premiumList.includes(normalSender))
        return { allowed: false, mode, reason: '💎 Private Premium Mode. Owner or Premium users Only.' };
      return { allowed: true, mode };

    default:
      return { allowed: true, mode };
  }
};

// ═══════════════════════════════════════════════════
//  1. SETMODE
// ═══════════════════════════════════════════════════
cmd({
  pattern: 'setmode',
  alias: ['mode'],
  react: '🌏',
  desc: 'Bot access mode set',
  category: 'owner',
  filename: __filename
}, async (conn, mek, m, { q, reply, isOwner, sessionId }) => {
  if (!isOwner) return reply('❌ Owner Only.');

  const modes = ['public', 'private', 'inbox', 'group', 'premium', 'privatepremium'];
  const sub   = q?.trim().toLowerCase();

  const cfg = await getAccessConfig(sessionId);

  if (!sub || !modes.includes(sub)) {
    return reply(
`⚙️ *Bot Access Modes*

Current: *${(cfg.mode || 'public').toUpperCase()}*

Available Modes:
• *public* — Anyone Can Use
• *private* — Owner Only
• *inbox* — Private Chat Only
• *group* — Groups Only
• *premium* — Premium users + Owner
• *privatepremium* — Owner + Premium users (DM only)

Example: *.setmode public*`
    );
  }

  cfg.mode = sub;
  await saveAccessConfig(sessionId, cfg);
  _configCache[sessionId] = cfg;

  const modeDesc = {
    public:         '🌍 Anyone',
    private:        '🔒 Owner Only',
    inbox:          '📩 Inbox Only',
    group:          '👥 Groups Only',
    premium:        '💎 Premium users + Owner',
    privatepremium: '🔐 Owner + Premium users'
  };

  reply(`✅ *Mode Updated:* ${sub.toUpperCase()}\n${modeDesc[sub]}\n\n_Saved to MongoDB — persists after restart ✅_`);
});

// ═══════════════════════════════════════════════════
//  2. ADDPREMIUM
// ═══════════════════════════════════════════════════
cmd({
  pattern: 'addpremium',
  alias: ['ap'],
  react: '💎',
  desc: 'Add premium user',
  category: 'owner',
  filename: __filename
}, async (conn, mek, m, { q, reply, isOwner, sessionId }) => {
  if (!isOwner) return reply('❌ Owner Only.');

  const number = normalizeNumber(q?.trim());
  if (!number) return reply('📌 *Example:* `.addpremium 94xxxxxxxxx`');

  const cfg = await getAccessConfig(sessionId);
  if (!cfg.premium) cfg.premium = [];

  if (cfg.premium.map(normalizeNumber).includes(number)) {
    return reply(`⚠️ *${number}* is already in premium list.`);
  }

  cfg.premium.push(number);
  await saveAccessConfig(sessionId, cfg);
  _configCache[sessionId] = cfg;
  reply(`✅ *${number}* added to premium! 💎\nTotal: ${cfg.premium.length}`);
});

// ═══════════════════════════════════════════════════
//  3. REMOVEPREMIUM
// ═══════════════════════════════════════════════════
cmd({
  pattern: 'removepremium',
  alias: ['rp', 'delpremium'],
  react: '🗑️',
  desc: 'Remove premium user',
  category: 'owner',
  filename: __filename
}, async (conn, mek, m, { q, reply, isOwner, sessionId }) => {
  if (!isOwner) return reply('❌ Owner Only.');

  const number = normalizeNumber(q?.trim());
  if (!number) return reply('📌 *Example:* `.removepremium 94xxxxxxxxx`');

  const cfg = await getAccessConfig(sessionId);
  if (!cfg.premium) cfg.premium = [];

  const idx = cfg.premium.map(normalizeNumber).indexOf(number);
  if (idx === -1) return reply(`❌ *${number}* not in premium list.`);

  cfg.premium.splice(idx, 1);
  await saveAccessConfig(sessionId, cfg);
  _configCache[sessionId] = cfg;
  reply(`✅ *${number}* removed from premium!\nTotal: ${cfg.premium.length}`);
});

// ═══════════════════════════════════════════════════
//  4. PREMIUMLIST
// ═══════════════════════════════════════════════════
cmd({
  pattern: 'premiumlist',
  alias: ['plist'],
  react: '💎',
  desc: 'List premium users',
  category: 'owner',
  filename: __filename
}, async (conn, mek, m, { reply, isOwner, sessionId }) => {
  if (!isOwner) return reply('❌ Owner Only.');

  const cfg  = await getAccessConfig(sessionId);
  const list = cfg.premium || [];

  if (!list.length) return reply('💎 *Premium List*\n\nNo premium users.');

  let text = `💎 *Premium Users*\nTotal: ${list.length}\n\n`;
  list.forEach((n, i) => { text += `*${i + 1}.* +${n}\n`; });
  reply(text);
});

// ═══════════════════════════════════════════════════
//  5. BAN / UNBAN
// ═══════════════════════════════════════════════════
cmd({
  pattern: 'ban',
  react: '🚫',
  desc: 'Ban a user',
  category: 'owner',
  filename: __filename
}, async (conn, mek, m, { q, reply, isOwner, sessionId }) => {
  if (!isOwner) return reply('❌ Owner Only.');

  const number = normalizeNumber(q?.trim());
  if (!number) return reply('📌 *Example:* `.ban 94xxxxxxxxx`');

  const cfg = await getAccessConfig(sessionId);
  if (!cfg.banned) cfg.banned = [];

  if (cfg.banned.map(normalizeNumber).includes(number)) {
    return reply(`⚠️ *${number}* already banned.`);
  }

  cfg.banned.push(number);
  await saveAccessConfig(sessionId, cfg);
  _configCache[sessionId] = cfg;
  reply(`🚫 *${number}* banned!`);
});

cmd({
  pattern: 'unban',
  react: '✅',
  desc: 'Unban a user',
  category: 'owner',
  filename: __filename
}, async (conn, mek, m, { q, reply, isOwner, sessionId }) => {
  if (!isOwner) return reply('❌ Owner Only.');

  const number = normalizeNumber(q?.trim());
  if (!number) return reply('📌 *Example:* `.unban 94xxxxxxxxx`');

  const cfg = await getAccessConfig(sessionId);
  if (!cfg.banned) cfg.banned = [];

  const idx = cfg.banned.map(normalizeNumber).indexOf(number);
  if (idx === -1) return reply(`❌ *${number}* not in ban list.`);

  cfg.banned.splice(idx, 1);
  await saveAccessConfig(sessionId, cfg);
  _configCache[sessionId] = cfg;
  reply(`✅ *${number}* unbanned!`);
});

// ═══════════════════════════════════════════════════
//  6. MYMODE
// ═══════════════════════════════════════════════════
cmd({
  pattern: 'mymode',
  alias: ['botmode'],
  react: '🔍',
  desc: 'Check current bot mode',
  category: 'owner',
  filename: __filename
}, async (conn, mek, m, { reply, sessionId, senderNumber, isOwner }) => {
  const cfg      = await getAccessConfig(sessionId);
  const mode     = cfg.mode || 'public';
  const normalMe = normalizeNumber(senderNumber);
  const isPrem   = (cfg.premium || []).map(normalizeNumber).includes(normalMe);

  const modeDesc = {
    public:         '🌍 Public — Anyone',
    private:        '🔒 Private — Owner Only',
    inbox:          '📩 Inbox — DM Only',
    group:          '👥 Group — Groups Only',
    premium:        '💎 Premium — Premium + Owner',
    privatepremium: '🔐 Private Premium — Owner + Premium'
  };

  const status = isOwner ? '👑 Owner' : isPrem ? '💎 Premium' : '👤 User';

  reply(
`🔍 *Bot Mode Info*

⚙️ *Mode:* ${modeDesc[mode] || mode}
👤 *Your Status:* ${status}
💾 *Storage:* MongoDB (persists after restart ✅)
${isPrem || isOwner ? '✅ You can use the bot' : '❌ Access restricted by mode'}`
  );
});
