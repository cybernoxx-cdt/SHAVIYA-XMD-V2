// Bug Menu Plugin - All Bug Commands Menu

const moment = require('moment-timezone');

class BugMenuPlugin {
    constructor(config, client) {
        this.config = config;
        this.client = client;
        this.menuType = 'bug';
        this.categories = {
            spam: ['msgblock', 'pairspam', 'callspam'],
            exploit: ['locationbug', 'vcardbug', 'ghostbug', 'catalogbug'],
            group: ['destroyer'],
            system: ['status', 'logs']
        };
    }

    getMenuText(prefix, userNumber, isGroup) {
        const date = moment().tz(this.config.timezone || 'Asia/Colombo').format('YYYY-MM-DD');
        const time = moment().tz(this.config.timezone || 'Asia/Colombo').format('HH:mm:ss');

        return `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃    ☣️ *BUG COMMANDS MENU* ☣️
┃    ═══════════════════════════════
┃
┃  👤 *USER:* @${userNumber.split('@')[0]}
┃  📅 *DATE:* ${date}
┃  ⌚ *TIME:* ${time}
┃  🚀 *PREFIX:* ${prefix}
┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃
┃  ☢️ *[ SPAM ATTACKS ]*
┃  ┌─────────────────────────────────
┃  │ ☣️ ${prefix}msgblock [number]
┃  │    └─> Message block attack
┃  │
┃  │ ☣️ ${prefix}pairspam [number]
┃  │    └─> Pairing code spam
┃  │
┃  │ ☣️ ${prefix}callspam [number]
┃  │    └─> Call request spam
┃  └─────────────────────────────────
┃
┃  💀 *[ EXPLOIT ATTACKS ]*
┃  ┌─────────────────────────────────
┃  │ ☣️ ${prefix}locationbug [number]
┃  │    └─> Location payload spam
┃  │
┃  │ ☣️ ${prefix}vcardbug [number]
┃  │    └─> VCard overflow attack
┃  │
┃  │ ☣️ ${prefix}ghostbug [number]
┃  │    └─> Ghost message attack
┃  │
┃  │ ☣️ ${prefix}catalogbug [number]
┃  │    └─> Catalog payload attack
┃  └─────────────────────────────────
┃
┃  🔥 *[ GROUP ATTACKS ]*
┃  ┌─────────────────────────────────
┃  │ ☣️ ${prefix}destroyer
┃  │    └─> Group mention spam
┃  │
┃  │ ☣️ ${prefix}groupspam
┃  │    └─> Group message spam
┃  └─────────────────────────────────
┃
┃  ⚡ *[ ADVANCED ]*
┃  ┌─────────────────────────────────
┃  │ ☣️ ${prefix}multibug [number]
┃  │    └─> Multi-attack combo
┃  │
┃  │ ☣️ ${prefix}bugstatus
┃  │    └─> Bug attack status
┃  │
┃  │ ☣️ ${prefix}stopattack
┃  │    └─> Stop ongoing attack
┃  └─────────────────────────────────
┃
┃  📊 *[ STATISTICS ]*
┃  ┌─────────────────────────────────
┃  │ 📈 Total attacks: ${this.getTotalAttacks()}
┃  │ 👥 Victims: ${this.getVictimCount()}
┃  │ ⏱️ Active attacks: ${this.getActiveAttacks()}
┃  └─────────────────────────────────
┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

⚠️ *WARNING:* Use these commands responsibly!
⚙️ *Status:* Active
🎯 *Mode:* ${this.config.mode || 'Public'}

*Powered by CHALAH VOID SYSTEM v2.0*
        `.trim();
    }

    getTotalAttacks() {
        // Implement attack counter
        return global.attackCounter || 0;
    }

    getVictimCount() {
        // Implement victim counter
        return Object.keys(global.victims || {}).length;
    }

    getActiveAttacks() {
        // Implement active attacks counter
        return global.activeAttacks || 0;
    }

    async execute(sock, msg, args, from, isGroup, sender, pushname, reply) {
        const menuText = this.getMenuText(this.config.prefix, sender, isGroup);
        
        if (args[0] === 'full') {
            // Send full detailed menu
            await sock.sendMessage(from, {
                image: { url: this.config.logo },
                caption: menuText,
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363304428340577@newsletter',
                        newsletterName: 'CHALAH VOID',
                        serverMessageId: 69
                    }
                }
            });
        } else {
            // Send compact menu
            await sock.sendMessage(from, {
                text: menuText,
                contextInfo: {
                    mentionedJid: [sender]
                }
            });
        }
    }

    async getDetailedHelp(command, sock, from, reply) {
        const helpTexts = {
            msgblock: `📖 *MSG BLOCK ATTACK*
━━━━━━━━━━━━━━━━━
💠 *Usage:* ${this.config.prefix}msgblock [number]
🎯 *Effect:* Sends heavy payload to crash chat
⚡ *Duration:* Instant
⚠️ *Risk:* High
📝 *Example:* ${this.config.prefix}msgblock 94712345678`,

            pairspam: `📖 *PAIRING SPAM*
━━━━━━━━━━━━━━━━━
💠 *Usage:* ${this.config.prefix}pairspam [number]
🎯 *Effect:* Spams pairing requests
⚡ *Duration:* 50 requests
⚠️ *Risk:* Medium
📝 *Example:* ${this.config.prefix}pairspam 94712345678`,

            callspam: `📖 *CALL SPAM*
━━━━━━━━━━━━━━━━━
💠 *Usage:* ${this.config.prefix}callspam [number]
🎯 *Effect:* Spams call requests
⚡ *Duration:* 20 calls
⚠️ *Risk:* Medium
📝 *Example:* ${this.config.prefix}callspam 94712345678`,

            locationbug: `📖 *LOCATION BUG*
━━━━━━━━━━━━━━━━━
💠 *Usage:* ${this.config.prefix}locationbug [number]
🎯 *Effect:* Sends location payload spam
⚡ *Duration:* 5 locations
⚠️ *Risk:* High
📝 *Example:* ${this.config.prefix}locationbug 94712345678`,

            vcardbug: `📖 *VCARD BUG*
━━━━━━━━━━━━━━━━━
💠 *Usage:* ${this.config.prefix}vcardbug [number]
🎯 *Effect:* VCard overflow attack
⚡ *Duration:* Instant
⚠️ *Risk:* Critical
📝 *Example:* ${this.config.prefix}vcardbug 94712345678`,

            ghostbug: `📖 *GHOST BUG*
━━━━━━━━━━━━━━━━━
💠 *Usage:* ${this.config.prefix}ghostbug [number]
🎯 *Effect:* Invisible character spam
⚡ *Duration:* 50k chars
⚠️ *Risk:* Medium
📝 *Example:* ${this.config.prefix}ghostbug 94712345678`,

            catalogbug: `📖 *CATALOG BUG*
━━━━━━━━━━━━━━━━━
💠 *Usage:* ${this.config.prefix}catalogbug [number]
🎯 *Effect:* Shop message overflow
⚡ *Duration:* Instant
⚠️ *Risk:* High
📝 *Example:* ${this.config.prefix}catalogbug 94712345678`,

            destroyer: `📖 *GROUP DESTROYER*
━━━━━━━━━━━━━━━━━
💠 *Usage:* ${this.config.prefix}destroyer
🎯 *Effect:* Spam mentions all members
⚡ *Duration:* Instant
⚠️ *Risk:* Very High
📝 *Note:* Use only in groups`,

            multibug: `📖 *MULTI BUG COMBO*
━━━━━━━━━━━━━━━━━
💠 *Usage:* ${this.config.prefix}multibug [number]
🎯 *Effect:* All attacks combined
⚡ *Duration:* Configurable
⚠️ *Risk:* Critical
📝 *Example:* ${this.config.prefix}multibug 94712345678`
        };

        const helpText = helpTexts[command] || `❌ No help available for command: ${command}`;
        await reply(helpText);
    }
}

module.exports = BugMenuPlugin;
