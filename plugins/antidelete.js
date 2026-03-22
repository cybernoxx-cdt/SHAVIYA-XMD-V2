// ============================================
//   plugins/antidelete.js - FIXED VERSION
//   Fixes:
//   1. Sender number/name correctly shown
//   2. Images/Videos actually forwarded
//   3. Works with index.js onMessage/onDelete
//   4. Proper media download buffer
// ============================================

const { getSetting } = require('../lib/settings');

// ── Message Cache ──
const msgCache = new Map();
const MAX_CACHE = 1000;

// ── Auto clean every 30 min ──
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of msgCache.entries()) {
        if (now - val.timestamp > 3600000) msgCache.delete(key);
    }
}, 1800000);

// ══════════════════════════════════════════
//   onMessage — cache every incoming msg
//   Called from index.js messages.upsert
// ══════════════════════════════════════════
async function onMessage(conn, mek, sessionId) {
    try {
        if (!mek?.message) return;
        if (mek.key.fromMe) return;

        // ── Unwrap ephemeral messages ──
        const msgContent = mek.message?.ephemeralMessage?.message || mek.message;
        if (!msgContent) return;

        const key       = mek.key.id;
        const chat      = mek.key.remoteJid;
        const isGroup   = chat?.endsWith('@g.us');
        const sender    = isGroup
            ? (mek.key.participant || mek.participant || chat)
            : chat;

        msgCache.set(key, {
            mek,
            msgContent,
            timestamp:  Date.now(),
            chat,
            sender,
            isGroup,
            pushName:   mek.pushName || '',
            sessionId
        });

        // Keep under limit
        if (msgCache.size > MAX_CACHE) {
            const firstKey = msgCache.keys().next().value;
            msgCache.delete(firstKey);
        }
    } catch (e) {
        console.log('[ANTIDELETE onMessage ERROR]:', e.message);
    }
}

// ══════════════════════════════════════════
//   onDelete — detect & forward deleted msg
//   Called from index.js messages.update
// ══════════════════════════════════════════
async function onDelete(conn, updates, sessionId) {
    try {
        const isEnabled = getSetting('antidelete');
        if (!isEnabled) return;

        // ── Owner JID ──
        const ownerNumber = conn.user?.id?.split(':')[0];
        if (!ownerNumber) return;
        const ownerJid = ownerNumber + '@s.whatsapp.net';

        for (const update of updates) {
            try {
                const msg = update.update?.message;

                // ── Detect delete (protocol message revoke) ──
                const isRevoke =
                    msg?.protocolMessage?.type === 0 ||
                    msg?.protocolMessage?.type === 'REVOKE' ||
                    update.update?.messageStubType === 1;

                if (!isRevoke) continue;

                // ── Get deleted message key ──
                const deletedKey =
                    msg?.protocolMessage?.key?.id ||
                    update.key?.id;

                if (!deletedKey) continue;

                const cached = msgCache.get(deletedKey);
                if (!cached) continue;

                const { mek, msgContent, chat, sender, isGroup, pushName } = cached;

                // ── Sender info ──
                const senderNumber = sender?.split('@')[0]?.split(':')[0] || 'Unknown';
                const senderName   = pushName || senderNumber;

                // ── Group name ──
                let chatName = isGroup ? chat?.split('@')[0] : 'Private Chat';
                if (isGroup) {
                    try {
                        const meta = await conn.groupMetadata(chat);
                        chatName = meta.subject;
                    } catch {}
                }

                // ── Sri Lanka time ──
                const time = new Date().toLocaleString('en-US', {
                    timeZone: 'Asia/Colombo',
                    hour:     '2-digit',
                    minute:   '2-digit',
                    day:      '2-digit',
                    month:    'short',
                    year:     'numeric'
                });

                const header =
`╔▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄╗
▌  🗑️ *DELETED MESSAGE* 🗑️  ▐
╚▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀╝

👤 *From:*  ${senderName}
📱 *Number:* +${senderNumber}
${isGroup ? `👥 *Group:*  ${chatName}` : `💬 *Chat:*   Private`}
🕐 *Time:*  ${time}
━━━━━━━━━━━━━━━━━━━━━━━━
🗑️ *Deleted Content:*`;

                // ══════════════════════════════════════
                //   Handle message types
                // ══════════════════════════════════════

                // ── Text ──
                if (msgContent.conversation || msgContent.extendedTextMessage) {
                    const text = msgContent.conversation ||
                                 msgContent.extendedTextMessage?.text || '';
                    await conn.sendMessage(ownerJid, {
                        text: `${header}\n\n${text}`
                    });
                }

                // ── Image ──
                else if (msgContent.imageMessage) {
                    const caption = msgContent.imageMessage.caption || '';
                    try {
                        const buffer = await conn.downloadMediaMessage(mek);
                        await conn.sendMessage(ownerJid, {
                            image:   buffer,
                            caption: `${header}\n\n📷 *Image*${caption ? `\n_Caption:_ ${caption}` : ''}`
                        });
                    } catch {
                        await conn.sendMessage(ownerJid, {
                            text: `${header}\n\n📷 *Image deleted*${caption ? `\n_Caption:_ ${caption}` : ''}`
                        });
                    }
                }

                // ── Video ──
                else if (msgContent.videoMessage) {
                    const caption = msgContent.videoMessage.caption || '';
                    try {
                        const buffer = await conn.downloadMediaMessage(mek);
                        await conn.sendMessage(ownerJid, {
                            video:   buffer,
                            caption: `${header}\n\n🎥 *Video*${caption ? `\n_Caption:_ ${caption}` : ''}`
                        });
                    } catch {
                        await conn.sendMessage(ownerJid, {
                            text: `${header}\n\n🎥 *Video deleted*${caption ? `\n_Caption:_ ${caption}` : ''}`
                        });
                    }
                }

                // ── Audio / PTT ──
                else if (msgContent.audioMessage) {
                    const isPtt = msgContent.audioMessage.ptt;
                    try {
                        const buffer = await conn.downloadMediaMessage(mek);
                        await conn.sendMessage(ownerJid, {
                            audio:    buffer,
                            mimetype: 'audio/ogg; codecs=opus',
                            ptt:      isPtt
                        });
                        await conn.sendMessage(ownerJid, {
                            text: `${header}\n\n${isPtt ? '🎤 *Voice note deleted*' : '🎵 *Audio deleted*'}`
                        });
                    } catch {
                        await conn.sendMessage(ownerJid, {
                            text: `${header}\n\n${isPtt ? '🎤 *Voice note deleted*' : '🎵 *Audio deleted*'}`
                        });
                    }
                }

                // ── Sticker ──
                else if (msgContent.stickerMessage) {
                    try {
                        const buffer = await conn.downloadMediaMessage(mek);
                        await conn.sendMessage(ownerJid, {
                            sticker: buffer
                        });
                        await conn.sendMessage(ownerJid, {
                            text: `${header}\n\n🎭 *Sticker deleted*`
                        });
                    } catch {
                        await conn.sendMessage(ownerJid, {
                            text: `${header}\n\n🎭 *Sticker deleted*`
                        });
                    }
                }

                // ── Document ──
                else if (msgContent.documentMessage) {
                    const fname    = msgContent.documentMessage.fileName || 'Unknown file';
                    const mimetype = msgContent.documentMessage.mimetype || 'application/octet-stream';
                    try {
                        const buffer = await conn.downloadMediaMessage(mek);
                        await conn.sendMessage(ownerJid, {
                            document: buffer,
                            mimetype,
                            fileName: fname,
                            caption:  `${header}\n\n📄 *Document deleted*\n_File:_ ${fname}`
                        });
                    } catch {
                        await conn.sendMessage(ownerJid, {
                            text: `${header}\n\n📄 *Document deleted*\n_File:_ ${fname}`
                        });
                    }
                }

                // ── Contact ──
                else if (msgContent.contactMessage) {
                    const cname = msgContent.contactMessage.displayName || 'Unknown';
                    await conn.sendMessage(ownerJid, {
                        text: `${header}\n\n👤 *Contact deleted*\n_Name:_ ${cname}`
                    });
                }

                // ── Location ──
                else if (msgContent.locationMessage) {
                    const lat = msgContent.locationMessage.degreesLatitude;
                    const lng = msgContent.locationMessage.degreesLongitude;
                    await conn.sendMessage(ownerJid, {
                        text: `${header}\n\n📍 *Location deleted*\n_Lat:_ ${lat}\n_Lng:_ ${lng}`
                    });
                }

                // ── Unknown ──
                else {
                    await conn.sendMessage(ownerJid, {
                        text: `${header}\n\n❓ *Message deleted (unknown type)*`
                    });
                }

                // Remove from cache
                msgCache.delete(deletedKey);

            } catch (innerErr) {
                console.log('[ANTIDELETE INNER ERROR]:', innerErr.message);
            }
        }
    } catch (e) {
        console.log('[ANTIDELETE onDelete ERROR]:', e.message);
    }
}

// ══════════════════════════════════════════
//   EXPORTS
// ══════════════════════════════════════════
module.exports = { onMessage, onDelete };
