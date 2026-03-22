const { cmd } = require("../command");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");

// ───────── CONFIGURATION ─────────
const API_KEY = "darkshan-75704c1b";
const AC2_FOOTER = "╭𝐇𝐀𝐒𝐈𝐘𝐀 𝐌𝐃╮";
const TEMP_DIR = path.resolve(__dirname, "../temp");

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

/**
 * Infinity Multi-Reply Listener
 */
function listenForReplies(conn, from, sender, targetId, callback) {
    const handler = (update) => {
        const msg = update.messages?.[0];
        if (!msg?.message) return;

        const text = msg.message.conversation || msg.message?.extendedTextMessage?.text || "";
        const context = msg.message?.extendedTextMessage?.contextInfo;
        const msgSender = msg.key.participant || msg.key.remoteJid;
        
        const isTargetReply = context?.stanzaId === targetId;
        const isCorrectUser = msgSender.includes(sender.split('@')[0]) || msgSender.includes("@lid");

        if (msg.key.remoteJid === from && isCorrectUser && isTargetReply) {
            callback({ msg, text: text.trim() });
        }
    };

    conn.ev.on("messages.upsert", handler);
    setTimeout(() => { conn.ev.off("messages.upsert", handler); }, 900000);
}

cmd(
  {
    pattern: "song",
    alias: ["audio", "play"],
    ownerOnly: true,
    react: "🎶",
    desc: "Infinite Multi-Reply Song Downloader with Thumbnails",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply, sender, sessionId }) => {
    try {
      let query = typeof q === "string" ? q.trim() : "";
      if (!query) return reply("❌ කරුණාකර නමක් හෝ ලින්ක් එකක් ලබා දෙන්න.");

      await bot.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      // --- 1. SEARCH LIST WITH THUMBNAIL ---
      const search = await yts(query);
      const results = search.videos.slice(0, 10);
      if (results.length === 0) return reply("❌ කිසිවක් හමු නොවීය.");

      let listText = "🎶 *𝐇𝐀𝐒𝐈𝐘𝐀-𝐌𝐃 𝐒𝐎𝐍𝐆 𝐒𝐄𝐀𝐑𝐂𝐇*\n\n";
      results.forEach((v, i) => { listText += `*${i + 1}.* ${v.title}\n⏱️ ${v.timestamp}\n\n`; });

      // Search list send (button on/off aware)
      const songButtons = results.map((v, i) => ({ id: String(i+1), text: `${i+1}. ${v.title.slice(0,40)}` }));
      const sentSearch = await global.sendInteractiveButtons(bot, from, {
          header: "🎶 SHAVIYA-XMD V2 SONG SEARCH",
          body: listText + `🔢 *Reply the number to select the song.*`,
          footer: "✨ SHAVIYA TECH · PREMIUM EDITION",
          buttons: songButtons,
          _sessionId: sessionId
      }, mek);

      // SEARCH LIST INFINITY REPLY
      listenForReplies(bot, from, sender, sentSearch.key.id, async (selection) => {
          const idx = parseInt(selection.text) - 1;
          if (!results[idx]) return;

          // REACTION: WAIT
          await bot.sendMessage(from, { react: { text: "⏳", key: selection.msg.key } });
          
          const videoUrl = results[idx].url;
          // සින්දුවට අදාළ ඩේටා process කරන්න යවනවා
          await processAudioFlow(bot, from, sender, videoUrl, selection.msg, results[idx]);
      });

    } catch (err) {
      console.error(err);
      reply(`❌ Error: ${err.message}`);
    }

    // --- 2. AUDIO SELECTOR WITH SONG THUMBNAIL ---
    async function processAudioFlow(conn, from, sender, url, quotedMek, searchItem) {
        try {
            const res = await axios.get(`https://sayuradark-api-two.vercel.app/api/download/ytdl?apikey=${API_KEY}&url=${encodeURIComponent(url)}`);
            const data = res.data?.result;
            if (!data) return;

            // සින්දුවට අදාළ විස්තර සහිත මැසේජ් එක
            let selectMsg = `⫷⦁[ *𝐇𝐀𝐒𝐈𝐘𝐀. 𝐌𝐃 ]⦁⫸\n\n` +
                            `📃 *Title:* ${data.title}\n` +
                            `⏱️ *Time:* ${searchItem.timestamp}\n` +
                            `🔗 *URL:* ${url}\n\n` +
                            `*REPLY THE NUMBER TO DOWNLOAD*\n\n` +
                            `1 ┃ Audio 🎵\n` +
                            `2 ┃ Document 📁\n` +
                            `3 ┃ Voice Note 🎙️`;

            // Audio type selector (button on/off aware)
            const typeButtons = [
                { id: "1", text: "1. Audio 🎵" },
                { id: "2", text: "2. Document 📁" },
                { id: "3", text: "3. Voice Note 🎙️" }
            ];
            const sentSelect = await global.sendInteractiveButtons(conn, from, {
                header: "🎵 " + (data.title || "Song"),
                body: selectMsg,
                footer: "✨ SHAVIYA TECH · PREMIUM EDITION",
                buttons: typeButtons,
                _sessionId: sessionId
            }, quotedMek);

            // TYPE SELECTOR INFINITY REPLY
            listenForReplies(conn, from, sender, sentSelect.key.id, async (qSel) => {
                const choice = qSel.text;
                if (!["1", "2", "3"].includes(choice)) return;

                // REACTION: DOWNLOADING
                await conn.sendMessage(from, { react: { text: "📥", key: qSel.msg.key } });

                const filePath = path.join(TEMP_DIR, `audio_${Date.now()}.mp3`);
                const response = await axios({ method: 'get', url: data.mp3, responseType: 'stream' });
                const writer = fs.createWriteStream(filePath);
                response.data.pipe(writer);

                writer.on('finish', async () => {
                    let audioConfig = {};
                    if (choice === "1") {
                        audioConfig = { audio: fs.readFileSync(filePath), mimetype: "audio/mpeg" };
                    } else if (choice === "2") {
                        audioConfig = { 
                            document: fs.readFileSync(filePath), 
                            mimetype: "audio/mpeg", 
                            fileName: `${data.title}.mp3`,
                            caption: AC2_FOOTER 
                        };
                    } else if (choice === "3") {
                        audioConfig = { audio: fs.readFileSync(filePath), mimetype: "audio/mp4", ptt: true };
                    }

                    await conn.sendMessage(from, audioConfig, { quoted: qSel.msg });
                    
                    // REACTION: SUCCESS
                    await conn.sendMessage(from, { react: { text: "✅", key: qSel.msg.key } });
                    
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                });
            });
        } catch (e) { console.error(e); }
    }
  }
);
