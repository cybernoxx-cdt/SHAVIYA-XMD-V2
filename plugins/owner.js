const { cmd } = require("../command");

cmd({
    pattern: "owner",
    desc: "Show bot owner details with contact sharing",
    category: "main",
    react: "👑",
    filename: __filename
},
async (conn, mek, m, { from, pushname, reply }) => {
    try {
        // Owner numbers with their details
        const owners = [
            {
                number: "94758127752",
                name: "GOD FATHER",
                role: "Lead Developer",
                country: "Sri Lanka 🇱🇰",
                isPremium: true
            },
            {
                number: "94707085822",
                name: "Savendra Dampriya",
                role: "Co-Developer & Support",
                country: "Sri Lanka 🇱🇰",
                isPremium: true
            }
        ];

        // Create contact cards for both owners
        const contacts = owners.map(owner => ({
            displayName: owner.name,
            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${owner.name}\nORG:Shaviya Tech;\nTEL;type=CELL;type=VOICE;waid=${owner.number}:${owner.number}\nROLE:${owner.role}\nURL:https://github.com/ShaviyaTech\nNOTE:${owner.role} of SHAVIYA-XMD V2 Bot\nEND:VCARD`
        }));

        // Premium text with contact details
        const premiumText = `
╔══════════════════════════╗
        👑 BOT OWNER 👑
╚══════════════════════════╝

👋 Hello *${pushname}*!

💎 *BOT NAME* : SHAVIYA-XMD V2
🌟 *VERSION* : Premium Edition
⚡ *STATUS* : Active & Ready

━━━━━━━━━━━━━━━━━━
📞 *CONTACT OWNERS*
━━━━━━━━━━━━━━━━━━

👤 *OWNER 1 - ${owners[0].name}*
├ 📱 *Number* : +${owners[0].number}
├ 👔 *Role* : ${owners[0].role}
└ 🌍 *Location* : ${owners[0].country}

👤 *OWNER 2 - ${owners[1].name}*
├ 📱 *Number* : +${owners[1].number}
├ 👔 *Role* : ${owners[1].role}
└ 🌍 *Location* : ${owners[1].country}

━━━━━━━━━━━━━━━━━━
✨ *PREMIUM FEATURES*
━━━━━━━━━━━━━━━━━━
✅ Unlimited Bot Usage
✅ Priority Support 24/7
✅ Early Access Updates
✅ Custom Feature Requests
✅ Exclusive Commands
✅ No Ads/Banners

━━━━━━━━━━━━━━━━━━
💎 *CONTACT METHODS*
━━━━━━━━━━━━━━━━━━
1. Tap the contact cards below
2. Click "Message" to chat directly
3. Or save numbers to contacts

*Click the contact cards to start chatting!*

━━━━━━━━━━━━━━━━━━
💬 *SUPPORT* : Available 24/7
⚡ *RESPONSE* : Within 5-10 minutes
🎯 *SERVICE* : Premium Support

"Premium quality service with instant support"

╔══════════════════════════╗
   © POWERED BY SHAVIYA-XMD V2 💎
   *PREMIUM EDITION*
╚══════════════════════════╝
`;

        // Send the image with premium text
        await conn.sendMessage(from, {
            image: { url: "https://files.catbox.moe/f18ceb.jpg" },
            caption: premiumText
        }, { quoted: mek });

        // Small delay before sending contacts
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Send each contact card
        for (const contact of contacts) {
            await conn.sendMessage(from, {
                contacts: {
                    displayName: contact.displayName,
                    contacts: [contact]
                }
            }, { quoted: mek });
            
            // Small delay between contact sends
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Send a final confirmation message
        const finalMsg = `✅ *Contact details shared successfully!*\n\nTap on the contact cards above to message the owners directly.\n\n*Note*: Both owners are available for premium support.`;
        
        await conn.sendMessage(from, {
            text: finalMsg
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        
        // Fallback message if contact sharing fails
        await reply(`❌ *Error showing owner details*\n\nContact owners directly:\n1. +94758127752 (GOD FATHER)\n2. +94707085822 (Savendra Dampriya)\n\nAdd these numbers to your contacts!`);
    }
});
