// Bug Menu Plugin - Displays all bug commands

const moment = require('moment-timezone');

class BugMenuPlugin {
    constructor(config, manager) {
        this.name = 'bug-menu';
        this.version = '2.0.0';
        this.category = 'menu';
        this.author = 'Chalana Induwara';
        this.config = config;
        this.manager = manager;
        
        this.commands = {
            'bugmenu': this.bugMenu.bind(this),
            'bughelp': this.bugHelp.bind(this),
            'buginfo': this.bugInfo.bind(this)
        };
        
        this.descriptions = {
            'bugmenu': 'Show all bug commands menu',
            'bughelp': 'Get detailed help for bug commands',
            'buginfo': 'Show plugin information'
        };
    }
    
    async bugMenu(sock, msg, args, from, isGroup, sender, pushname, reply) {
        const date = moment().tz(this.config.timezone).format('YYYY-MM-DD');
        const time = moment().tz(this.config.timezone).format('HH:mm:ss');
        
        const menuText = `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃    ☣️ *CHALAH BUG MENU* ☣️
┃    ═══════════════════════════════
┃
┃  👤 *USER:* @${sender.split('@')[0]}
┃  📅 *DATE:* ${date}
┃  ⌚ *TIME:* ${time}
┃  🚀 *PREFIX:* ${this.config.prefix}
┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃
┃  ☢️ *[ SPAM ATTACKS ]*
┃  ┌─────────────────────────────────
┃  │ ☣️ ${this.config.prefix}msgblock [number]
┃  │ ☣️ ${this.config.prefix}pairspam [number] [count]
┃  │ ☣️ ${this.config.prefix}callspam [number] [count]
┃  │ ☣️ ${this.config.prefix}groupspam [count] [message]
┃  └─────────────────────────────────
┃
┃  💀 *[ EXPLOIT ATTACKS ]*
┃  ┌─────────────────────────────────
┃  │ ☣️ ${this.config.prefix}locationbug [number] [count]
┃  │ ☣️ ${this.config.prefix}vcardbug [number]
┃  │ ☣️ ${this.config.prefix}ghostbug [number]
┃  │ ☣️ ${this.config.prefix}catalogbug [number]
┃  │ ☣️ ${this.config.prefix}videobug [number]
┃  │ ☣️ ${this.config.prefix}audiobug [number]
┃  │ ☣️ ${this.config.prefix}documentbug [number]
┃  └─────────────────────────────────
┃
┃  🔥 *[ GROUP ATTACKS ]*
┃  ┌─────────────────────────────────
┃  │ ☣️ ${this.config.prefix}destroyer
┃  │ ☣️ ${this.config.prefix}groupspam [count] [msg]
┃  └─────────────────────────────────
┃
┃  ⚡ *[ ADVANCED ]*
┃  ┌─────────────────────────────────
┃  │ ☣️ ${this.config.prefix}multibug [number]
┃  │ ☣️ ${this.config.prefix}bugstatus
┃  │ ☣️ ${this.config.prefix}stopattack
┃  │ ☣️ ${this.config.prefix}bughelp [command]
┃  └─────────────────────────────────
┃
┃  📊 *[ STATISTICS ]*
┃  ┌─────────────────────────────────
┃  │ 📈 ${this.config.prefix}bugstatus
┃  │ 📋 ${this.config.prefix}buginfo
┃  └─────────────────────────────────
┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃
┃  ⚙️ *SYSTEM STATUS:*
┃  ✅ Active Attacks: ${this.getActiveAttacks()}
┃  🎯 Total Attacks: ${this.getTotalAttacks()}
┃  👥 Total Victims: ${this.getVictimCount()}
┃  🛡️ Mode: ${this.config.mode}
┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

💀 *CHALAH VOID SYSTEM v2.0*
📱 Type ${this.config.prefix}bughelp [command] for details
        `;
        
        await sock.sendMessage(from, {
            image: { url: this.config.logo },
            caption: menuText,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true
            }
        });
    }
    
    async bugHelp(sock, msg, args, from, isGroup, sender, pushname, reply) {
        if (!args[0]) {
            return reply(`❌ *Usage:* ${this.config.prefix}bughelp [command]\n📝 *Example:* ${this.config.prefix}bughelp msgblock`);
        }
        
        const command = args[0].toLowerCase();
        const helpTexts = {
            msgblock: `📖 *MSG BLOCK ATTACK*
━━━━━━━━━━━━━━━━━
💠 *Command:* ${this.config.prefix}msgblock
📝 *Usage:* ${this.config.prefix}msgblock [number]
🎯 *Effect:* Sends heavy payload to crash chat
⚡ *Duration:* Instant
⚠️ *Risk:* High
📌 *Example:* ${this.config.prefix}msgblock 94712345678`,

            pairspam: `📖 *PAIRING SPAM*
━━━━━━━━━━━━━━━━━
💠 *Command:* ${this.config.prefix}pairspam
📝 *Usage:* ${this.config.prefix}pairspam [number] [count]
🎯 *Effect:* Spams pairing requests
⚡ *Duration:* Configurable (max 100)
⚠️ *Risk:* Medium
📌 *Example:* ${this.config.prefix}pairspam 94712345678 50`,

            callspam: `📖 *CALL SPAM*
━━━━━━━━━━━━━━━━━
💠 *Command:* ${this.config.prefix}callspam
📝 *Usage:* ${this.config.prefix}callspam [number] [count]
🎯 *Effect:* Spams call requests
⚡ *Duration:* Configurable (max 50)
⚠️ *Risk:* Medium
📌 *Example:* ${this.config.prefix}callspam 94712345678 20`,

            locationbug: `📖 *LOCATION BUG*
━━━━━━━━━━━━━━━━━
💠 *Command:* ${this.config.prefix}locationbug
📝 *Usage:* ${this.config.prefix}locationbug [number] [count]
🎯 *Effect:* Sends location payload spam
⚡ *Duration:* Configurable (max 10)
⚠️ *Risk:* High
📌 *Example:* ${this.config.prefix}locationbug 94712345678 5`,

            vcardbug: `📖 *VCARD BUG*
━━━━━━━━━━━━━━━━━
💠 *Command:* ${this.config.prefix}vcardbug
📝 *Usage:* ${this.config.prefix}vcardbug [number]
🎯 *Effect:* VCard overflow attack
⚡ *Duration:* Instant
⚠️ *Risk:* Critical
📌 *Example:* ${this.config.prefix}vcardbug 94712345678`,

            ghostbug: `📖 *GHOST BUG*
━━━━━━━━━━━━━━━━━
💠 *Command:* ${this.config.prefix}ghostbug
📝 *Usage:* ${this.config.prefix}ghostbug [number]
🎯 *Effect:* Invisible character spam
⚡ *Duration:* Instant
⚠️ *Risk:* Medium
📌 *Example:* ${this.config.prefix}ghostbug 94712345678`,

            destroyer: `📖 *GROUP DESTROYER*
━━━━━━━━━━━━━━━━━
💠 *Command:* ${this.config.prefix}destroyer
📝 *Usage:* ${this.config.prefix}destroyer
🎯 *Effect:* Spam mentions all members
⚡ *Duration:* Instant
⚠️ *Risk:* Very High
📌 *Note:* Use only in groups`,

            multibug: `📖 *MULTI BUG COMBO*
━━━━━━━━━━━━━━━━━
💠 *Command:* ${this.config.prefix}multibug
📝 *Usage:* ${this.config.prefix}multibug [number]
🎯 *Effect:* All attacks combined
⚡ *Duration:* ~30 seconds
⚠️ *Risk:* Critical
📌 *Example:* ${this.config.prefix}multibug 94712345678`,

            bugstatus: `📖 *BUG STATUS*
━━━━━━━━━━━━━━━━━
💠 *Command:* ${this.config.prefix}bugstatus
📝 *Usage:* ${this.config.prefix}bugstatus
🎯 *Effect:* Show attack statistics
⚡ *Duration:* Instant
⚠️ *Risk:* None
📌 *Info:* Shows total attacks, victims, etc.`
        };
        
        const help = helpTexts[command] || `❌ No help available for: ${command}\n📝 Use ${this.config.prefix}bugmenu to see all commands`;
        await reply(help);
    }
    
    async bugInfo(sock, msg, args, from, isGroup, sender, pushname, reply) {
        const plugins = this.manager.getPluginInfo();
        const commandsByCategory = this.manager.getCommandsByCategory();
        
        let infoText = `
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃    📋 *PLUGIN INFORMATION* 📋
┃    ═══════════════════════════════
┃
┃  🔌 *Loaded Plugins:* ${plugins.length}
┃  ⚡ *Total Commands:* ${this.manager.commands.size}
┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃
┃  📦 *PLUGINS:*
`;
        
        for (const plugin of plugins) {
            infoText += `┃  • ${plugin.name} v${plugin.version}\n`;
            infoText += `┃    └─ ${plugin.commands} commands | ${plugin.category}\n`;
        }
        
        infoText += `
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃
┃  🎯 *COMMANDS BY CATEGORY:*
`;
        
        for (const [category, commands] of commandsByCategory) {
            infoText += `┃  • ${category.toUpperCase()}: ${commands.length} commands\n`;
        }
        
        infoText += `
┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

💀 *CHALAH VOID SYSTEM v2.0*
📱 Type ${this.config.prefix}bugmenu to see all commands
        `;
        
        await reply(infoText);
    }
    
    getActiveAttacks() {
        // This would need access to bug plugin's active attacks
        return global.activeAttacksCount || 0;
    }
    
    getTotalAttacks() {
        try {
            const fs = require('fs');
            const path = require('path');
            const statsPath = path.join(__dirname, '../bug_stats.json');
            if (fs.existsSync(statsPath)) {
                const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
                return stats.totalAttacks || 0;
            }
        } catch (error) {}
        return 0;
    }
    
    getVictimCount() {
        try {
            const fs = require('fs');
            const path = require('path');
            const statsPath = path.join(__dirname, '../bug_stats.json');
            if (fs.existsSync(statsPath)) {
                const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
                return Object.keys(stats.victims || {}).length;
            }
        } catch (error) {}
        return 0;
    }
}

module.exports = BugMenuPlugin;
