const { cmd } = require('../command');
const mongoose = require("mongoose");

// ===============================
// 🔐 MONGODB CONNECTION
// ===============================

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://botmini:botmini@minibot.upglk0f.mongodb.net/?retryWrites=true&w=majority&appName=minibot';

async function connectDB() {
    try {
        if (mongoose.connection.readyState === 1) {
            console.log("🔵 MongoDB Already Connected");
            return;
        }
        await mongoose.connect(MONGO_URI, {
            maxPoolSize: 50,
        });
        console.log("✅ MongoDB Connected Successfully");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err.message);
    }
}

connectDB();

// ===============================
// 📦 SIGNAL MODEL
// ===============================

const Signal =
    mongoose.models.Signal ||
    mongoose.model(
        "Signal",
        new mongoose.Schema({}, { strict: false })
    );

// ===============================
// 🚀 CREACT COMMAND
// ===============================

cmd({
    pattern: "creact",
    alias: ["massreact", "chr"],
    react: "⚡",
    desc: "Multi-Node Mass Reaction",
    category: "main",
    use: ".creact link , qty , emoji",
    filename: __filename,
},
async (conn, mek, m, { q, reply, sender, userSettings }) => {

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📩 Command Triggered: .creact");
    console.log("👤 Sender:", sender);
    console.log("💬 Raw Input:", q);

    try {

        // ===============================
        // 🔒 AUTH CHECK
        // ===============================

        const allowedNumbers = [
            "94758127752",
            "94707085822",
            "94740232629"
        ];

        const senderNumber = sender.split("@")[0];
        const isOwner = allowedNumbers.includes(senderNumber);

        if (!isOwner && userSettings?.paymentStatus !== "paid") {
            console.log("❌ Permission Denied");
            return reply("🚫 Access Denied!");
        }

        // ===============================
        // 📥 INPUT PARSE
        // ===============================

        if (!q || !q.includes(",")) {
            return reply("💡 Usage: .creact link , qty , emoji");
        }

        let parts = q.split(",");
        let linkPart = parts[0].trim();
        let qtyNum = parseInt(parts[1]?.trim()) || 50;
        let emojis = parts.slice(2).map(e => e.trim()).filter(e => e);

        console.log("🔗 Link:", linkPart);
        console.log("📊 Qty:", qtyNum);
        console.log("😀 Emojis:", emojis);

        // ===============================
        // ✅ LINK VALIDATION
        // ===============================

        if (!linkPart.includes("whatsapp.com/channel/")) {
            return reply("❌ Invalid Channel Link.\n\n💡 Example:\nhttps://whatsapp.com/channel/XXXXXXXXXX/YYY");
        }

        if (qtyNum < 10 || qtyNum > 500) {
            return reply("⚠️ Quantity must be between 10 and 500.");
        }

        // ===============================
        // 🔑 URL PARSE — FIXED
        // Format: https://whatsapp.com/channel/{inviteCode}/{serverId}
        // ===============================

        let inviteCode = null;
        let serverId = null;

        try {
            // Remove trailing slash if any
            const cleanLink = linkPart.replace(/\/$/, "");
            const urlObj = new URL(cleanLink);
            const pathSegments = urlObj.pathname.split("/").filter(Boolean);

            // pathSegments = ["channel", "inviteCode", "serverId"] OR ["channel", "inviteCode"]
            if (pathSegments.length >= 2) {
                inviteCode = pathSegments[1];
                serverId = pathSegments[2] || pathSegments[1]; // fallback to inviteCode if no serverId
            }
        } catch (e) {
            // Fallback manual parse
            const urlParts = linkPart.split("/").filter(Boolean);
            const channelIdx = urlParts.findIndex(p => p === "channel");
            if (channelIdx !== -1 && urlParts[channelIdx + 1]) {
                inviteCode = urlParts[channelIdx + 1];
                serverId = urlParts[channelIdx + 2] || inviteCode;
            }
        }

        if (!inviteCode) {
            return reply("❌ Could not extract invite code from link.");
        }

        console.log("🔑 Invite Code:", inviteCode);
        console.log("🆔 Server ID:", serverId);

        // ===============================
        // 📡 METADATA FETCH — FIXED
        // ===============================

        let metadata = null;

        try {
            metadata = await conn.newsletterMetadata("invite", inviteCode);
            console.log("📡 Metadata Fetched:", JSON.stringify(metadata, null, 2));
        } catch (err) {
            console.log("❌ Metadata Fetch Error:", err.message);
        }

        // ===============================
        // 🎯 TARGET NAME RESOLVE — FIXED
        // ===============================

        let targetJid = null;
        let targetName = "Unknown Channel";

        if (metadata && metadata.id) {
            targetJid = metadata.id;

            // Try every possible name field (Baileys metadata fields vary)
            targetName =
                metadata.subject ||
                metadata.name ||
                metadata.title ||
                metadata.pushname ||
                metadata?.verifiedName ||
                metadata?.newsletter?.name ||
                metadata?.newsletter?.subject ||
                "Unknown Channel";

            console.log("🎯 Target JID:", targetJid);
            console.log("📛 Target Name:", targetName);
        } else {
            // Try fetching by JID directly if invite fails
            if (serverId) {
                try {
                    const jidGuess = serverId.includes("@") ? serverId : `${serverId}@newsletter`;
                    const meta2 = await conn.newsletterMetadata("jid", jidGuess);
                    if (meta2 && meta2.id) {
                        targetJid = meta2.id;
                        targetName =
                            meta2.subject ||
                            meta2.name ||
                            meta2.title ||
                            "Unknown Channel";
                        console.log("🎯 Fallback JID:", targetJid);
                    }
                } catch (e2) {
                    console.log("❌ Fallback Metadata Error:", e2.message);
                }
            }
        }

        if (!targetJid) {
            return reply(
                "❌ Could not fetch channel info.\n\n" +
                "📌 Make sure:\n" +
                "• Bot has joined the channel\n" +
                "• Link is correct & public\n" +
                "• Bot has newsletter access"
            );
        }

        // ===============================
        // 📊 PAYLOAD BUILD
        // ===============================

        const signalPayload = {
            type: "react",
            targetJid,
            serverId: String(serverId),
            emojiList: emojis.length > 0 ? emojis : ["❤️"],
            timestamp: Date.now()
        };

        const USERS_PER_APP = 50;
        let remaining = qtyNum + 10;
        let appIdCounter = 1;

        while (remaining > 0) {
            const batchSize = Math.min(remaining, USERS_PER_APP);
            signalPayload[`APP_ID_${appIdCounter}`] = batchSize;
            console.log(`📦 Node ${appIdCounter} -> ${batchSize}`);
            remaining -= batchSize;
            appIdCounter++;
        }

        console.log("📤 Final Payload:", signalPayload);

        // ===============================
        // 💾 SAVE TO DATABASE
        // ===============================

        const saved = await Signal.create(signalPayload);
        console.log("💾 Saved To Mongo:", saved._id);

        // ===============================
        // ✅ REPLY
        // ===============================

        return reply(
            `🚀 *STRIKE INITIATED!* ✅\n\n` +
            `🎯 Target: *${targetName}*\n` +
            `🆔 JID: ${targetJid}\n` +
            `💠 Nodes: ${appIdCounter - 1}\n` +
            `🔢 Qty: ${qtyNum}\n` +
            `🎭 Emojis: ${signalPayload.emojiList.join(" ")}\n` +
            `💾 Signal ID: ${saved._id}`
        );

    } catch (err) {
        console.error("🔥 Command Fatal Error:", err);
        return reply("❌ Error: " + err.message);
    }

});
