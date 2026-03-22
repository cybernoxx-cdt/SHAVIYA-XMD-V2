const { cmd } = require("../command");
const { spawn, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const sharp = require("sharp");

const API_KEY = "darkshan-75704c1b";
const TEMP_DIR = path.resolve(__dirname, "../temp");

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

function safeName(name, max = 60) {
    return String(name).replace(/[<>:"/\\|?*\x00-\x1F]/g, "").slice(0, max);
}

async function sendReact(conn, from, key, emoji) {
    try { await conn.sendMessage(from, { react: { text: emoji, key } }); } catch {}
}

function waitForReply(conn, from, sender, targetId) {
    return new Promise((resolve) => {
        const handler = (update) => {
            const msg = update.messages?.[0];
            if (!msg?.message) return;
            const text = msg.message.conversation || msg.message?.extendedTextMessage?.text || "";
            const context = msg.message?.extendedTextMessage?.contextInfo;
            const msgSender = msg.key.participant || msg.key.remoteJid;
            const isTargetReply = context?.stanzaId === targetId;
            const isCorrectUser = msgSender.includes(sender.split('@')[0]) || msgSender.includes("@lid");

            if (msg.key.remoteJid === from && isCorrectUser && isTargetReply) {
                resolve({ msg, text: text.trim() });
            }
        };
        conn.ev.on("messages.upsert", handler);
        setTimeout(() => { conn.ev.off("messages.upsert", handler); }, 600000); 
    });
}

cmd(
  {
    pattern: "xnxx",
    alias: ["xnxxdl"],
    ownerOnly: true,
    react: "🔞",
    desc: "XNXX High-Speed Bypass Downloader with Console Logs",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply, sender }) => {
    try {
      let query = typeof q === "string" ? q.trim() : "";
      if (!query) return reply("❌ Please provide a link or search query.");

      if (!query.includes("xnxx.com")) {
          const searchRes = await axios.get(`https://sayuradark-api-two.vercel.app/api/xnxx/search?apikey=${API_KEY}&query=${encodeURIComponent(query)}`);
          const results = searchRes.data?.result;
          if (!results || results.length === 0) return reply("❌ No results found.");

          let listText = "🔞 *𝐇𝐀𝐒𝐈𝐘𝐀-𝐌𝐃 𝐗ＮＸＸ*\n\n";
          results.slice(0, 10).forEach((v, i) => { 
              listText += `*${i + 1}.* ${v.title}\n\n`; 
          });
          const sentSearch = await bot.sendMessage(from, { text: listText + `අංකය Reply කරන්න.` }, { quoted: mek });

          const startFlow = async () => {
              while (true) {
                  const selection = await waitForReply(bot, from, sender, sentSearch.key.id);
                  if (!selection) break; 

                  (async () => {
                      const idx = parseInt(selection.text) - 1;
                      if (results[idx]) {
                          await handleDownload(bot, from, results[idx].link, results[idx].title, results[idx].image, selection.msg);
                      }
                  })();
              }
          };
          return startFlow();
      }

      await handleDownload(bot, from, query, "XNXX Video", null, mek);

    } catch (err) {
      console.error(`\x1b[31m[ERROR]\x1b[0m`, err.message);
      reply(`❌ Error: ${err.message}`);
    }

    async function handleDownload(conn, from, videoUrl, videoTitle, thumbUrl, quotedMek) {
      const dlId = Date.now();
      const outputFile = path.join(TEMP_DIR, `xn_${dlId}.mp4`);
      const thumbPath = path.join(TEMP_DIR, `xn_thumb_${dlId}.jpg`);
      const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

      try {
        await sendReact(conn, from, quotedMek.key, "⏳");
        console.log(`\x1b[36m[PROCESS]\x1b[0m Starting download for: ${videoTitle}`);
        
        let title = videoTitle;
        let finalThumb = thumbUrl;

        try {
            const info = JSON.parse(execSync(`yt-dlp --user-agent "${UA}" --dump-json "${videoUrl}"`).toString());
            title = info.title || title;
            finalThumb = info.thumbnail || finalThumb;
        } catch (e) {
            console.log(`\x1b[33m[WARN]\x1b[0m Metadata extraction failed, using API info.`);
        }

        let docThumb;
        if (finalThumb) {
            const thumbRes = await axios.get(finalThumb, { responseType: "arraybuffer" }).catch(() => null);
            if (thumbRes) {
                fs.writeFileSync(thumbPath, Buffer.from(thumbRes.data));
                docThumb = await sharp(thumbPath).resize(300).jpeg({ quality: 65 }).toBuffer();
            }
        }

        await sendReact(conn, from, quotedMek.key, "📥");

        // --- HIGH-SPEED DOWNLOAD ENGINE WITH CONSOLE LOGS ---
        const ytdlp = spawn("yt-dlp", [
            "--user-agent", UA,
            "--referer", "https://www.xnxx.com/",
            "--no-check-certificates",
            "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
            "--merge-output-format", "mp4",
            "--concurrent-fragments", "16",
            "--http-chunk-size", "20M",
            "--newline", // Console එකේ පේළියෙන් පේළියට පෙන්වීමට
            "-o", outputFile,
            videoUrl
        ]);

        // Console එකේ progress එක පෙන්වීමට:
        ytdlp.stdout.on("data", (data) => {
            const output = data.toString().trim();
            if (output.includes("%")) {
                process.stdout.write(`\r\x1b[32m[DOWNLOADING]\x1b[0m ${output}`);
            } else {
                console.log(`\x1b[34m[YT-DLP]\x1b[0m ${output}`);
            }
        });

        ytdlp.stderr.on("data", (data) => {
            console.error(`\x1b[31m[YT-DLP ERROR]\x1b[0m ${data.toString()}`);
        });

        ytdlp.on("close", async (code) => {
            console.log(`\n\x1b[36m[INFO]\x1b[0m Download process finished with code ${code}`);
            
            if (code !== 0 || !fs.existsSync(outputFile)) {
                return conn.sendMessage(from, { text: "❌ *Download Error.*" }, { quoted: quotedMek });
            }

            const sizeMB = (fs.statSync(outputFile).size / 1048576).toFixed(2);
            await conn.sendMessage(from, {
                document: fs.readFileSync(outputFile),
                mimetype: "video/mp4",
                fileName: `${safeName(title)}.mp4`,
                jpegThumbnail: docThumb,
                caption: `✅ *Download complete*\n🎬 *${title}*\n💾 Size: ${sizeMB} MB\n\n✫☘ 𝐇𝐀𝐒𝐈𝐘𝐀-𝐌𝐃 ☘`
            }, { quoted: quotedMek });

            await sendReact(conn, from, quotedMek.key, "✅");
            console.log(`\x1b[32m[SUCCESS]\x1b[0m Sent: ${title} (${sizeMB} MB)`);

            if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
            if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
        });

      } catch (e) {
        console.error(`\x1b[31m[CRITICAL]\x1b[0m`, e);
        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
      }
    }
  }
);
