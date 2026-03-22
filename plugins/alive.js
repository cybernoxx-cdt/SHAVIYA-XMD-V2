const config = require('../config')
const {cmd , commands} = require('../command')

cmd({
    pattern: "alive",
    desc: "Check bot online or not.",
    category: "main",
    react: "💎",
    filename: __filename
},
async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{

let des = `👋 𝙷𝚎𝚕𝚕𝚘 ${pushname} 𝙸'𝚖 𝚊𝚕𝚒𝚟𝚎 𝚗𝚘𝚠

╭━━━〔 💎 𝗦𝗛𝗔𝗩𝗜𝗬𝗔-𝗫𝗠𝗗 𝗩𝟮 💎 〕━━━⬣
┃ ✦ Status   : ONLINE ✅
┃ ✦ Version  : 2.0.0
┃ ✦ Speed    : 0.1s ⚡
┃ ✦ Runtime  : 24/7 ACTIVE ⏱️
╰━━━━━━━━━━━━━━━━━━━━⬣

👋 *Hello User!*
මම *𝗦𝗛𝗔𝗩𝗜𝗬𝗔-𝗫𝗠𝗗 𝗩𝟮* 🤖
ඔයාට Movies 🎬 | Tools 🛠️ | Premium Services 💎 ලබා දෙන Ultra Smart Bot එකක්!

╭━━〔 📌 COMMAND CENTER 〕━━⬣
┃ ➤ *.menu*   ➜ Full Command List 📜
┃ ➤ *.owner*  ➜ Contact Developer 👤
┃ ➤ *.alive*  ➜ Check Status ⚡
╰━━━━━━━━━━━━━━━━━━━━⬣

╭━━〔 🚀 SYSTEM STATS 〕━━⬣
┃ 🧠 AI Engine   : ACTIVE
┃ 💾 RAM Usage   : Stable
┃ 📡 Connection  : Ultra Fast
┃ 🔐 Security    : HIGH LEVEL
╰━━━━━━━━━━━━━━━━━━━━⬣

╭━━〔 🌟 FEATURES 〕━━⬣
┃ 🎬 Movie Downloader
┃ 📥 Direct HD Links
┃ ⚡ Instant Response
┃ 🔎 Smart Search
┃ 🔒 100% Safe System
╰━━━━━━━━━━━━━━━━━━━━⬣

💡 *Tip:* Use *.menu* to explore all powerful features!

━━━━━━━━━━━━━━━━━━━━━
> 💎 POWERED BY SHAVIYA TECH
> ⚡ PREMIUM WHATSAPP BOT SYSTEM
━━━━━━━━━━━━━━━━━━━━━

*°᭄ 𝗦𝗛𝗔𝗩𝗜𝗬𝗔 𝗧𝗘𝗖𝗛 · 𝗣𝗥𝗘𝗠𝗜𝗨𝗠 𝗘𝗗𝗜𝗧𝗜𝗢𝗡 © 𝟮𝟬𝟮𝟲 💎*`
return await conn.sendMessage(from,{image: {url: config.ALIVE_IMG || "https://files.catbox.moe/f18ceb.jpg"},caption: des},{quoted: mek})
}catch(e){
console.log(e)
reply(`${e}`)
}
})
