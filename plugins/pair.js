const { cmd } = require("../command");
const axios = require("axios");

const cooldowns = new Map();
const PAIR_IMAGE = "https://files.catbox.moe/f18ceb.jpg";

cmd({
    pattern: "pair",
    alias: ["code", "login", "session"],
    react: "✈️",
    desc: "Get SHAVIYA-XMD V2 pair code",
    category: "main",
    filename: __filename
}, async (bot, mek, m, { from, q, reply }) => {

    let phoneNumber = "";

    try {
        if (!q) {
            return reply("ℹ️ *ඔබගේ WhatsApp අංකය ලබා දෙන්න.*\nExample: *.pair 947xxxxxxxx*");
        }

        phoneNumber = q.replace(/[^0-9]/g, '');

        if (phoneNumber.length < 10) {
            return reply("❌ *වැරදි අංකයකි.* කරුණාකර නිවැරදි WhatsApp අංකය ලබා දෙන්න.");
        }

        if (cooldowns.has(phoneNumber)) {
            const lastUsed = cooldowns.get(phoneNumber);
            const timeLeft = Math.ceil((40000 - (Date.now() - lastUsed)) / 1000);
            return reply(`⏳ *කරුණාකර තත්පර ${timeLeft}ක් රැඳී සිටින්න.*`);
        }

        cooldowns.set(phoneNumber, Date.now());
        setTimeout(() => cooldowns.delete(phoneNumber), 40000);

        await bot.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        await reply("⚡ *SHAVIYA-XMD V2:* Pair Code is Generating...");

        const pairUrl = `https://sayura-cinema--chamindakannang.replit.app/code?number=${phoneNumber}`;
        const response = await axios.get(pairUrl, { timeout: 50000 });

        const pairCode = response?.data?.code;

        if (!pairCode) {
            throw new Error("Invalid API response");
        }

        let mainMsg = `✨ *SHAVIYA-XMD V2 PAIR CODE* ✨\n\n` +
                      `📱 *Number:* ${phoneNumber}\n` +
                      `🔑 *Code:* ${pairCode}\n\n` +
                      `⚡ *Status:* Generated Successfully\n\n` +
                      `> 💎 *SHAVIYA TECH · PREMIUM EDITION*`;

        await bot.sendMessage(from, {
            image: { url: PAIR_IMAGE },
            caption: mainMsg
        }, { quoted: mek });

        await bot.sendMessage(from, { text: pairCode });

        let instruction = `💡 *උපදෙස්*\n\n` +
                          `1️⃣ WhatsApp → Linked Devices\n` +
                          `2️⃣ Link with phone number\n` +
                          `3️⃣ ඉහත ලබාදුන් *${pairCode}* කෝඩ් එක ඇතුළත් කරන්න.\n\n` +
                          `DON'T SHARE creds.json ⚙\n\n` +
                          `💎 SHAVIYA-XMD V2 — WAIT PLEASE`;

        await bot.sendMessage(from, { text: instruction }, { quoted: mek });
        await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        if (phoneNumber) cooldowns.delete(phoneNumber);
        console.error("Pair Error:", e.message);
        reply("❌ *Pair Code ලබාගත නොහැකි විය.*\n\n💡 හේතුව: Server sleep වී තිබිය හැක. නැවත උත්සාහ කරන්න.");
    }
});
