const { cmd } = require("../command");

cmd({
    pattern: "owner",
    desc: "Show bot owner details",
    category: "main",
    react: "👑",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    try {
        const imageUrl = "https://files.catbox.moe/f18ceb.jpg";

        let dec = `
╔══════════════════════════╗
        👑 BOT OWNER 👑
╚══════════════════════════╝

👋 Hello ${pushname}

💎 BOT        : SHAVIYA-XMD V2
🪪 NUMBER     : Contact Via Bot
👤 OWNER      : SHAVIYA TECH
🌍 COUNTRY    : Sri Lanka 🇱🇰
⚡ ROLE       : Developer & Bot Owner

━━━━━━━━━━━━━━━━━━
📢 Official Name :
*SHAVIYA-XMD V2 Premium Bot*
━━━━━━━━━━━━━━━━━━

"Building the future of WhatsApp automation."

╔══════════════════════════╗
 © POWERED BY SHAVIYA-XMD V2 💎
╚══════════════════════════╝
`;

        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: dec
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
    }
});
