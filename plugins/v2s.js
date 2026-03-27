const { cmd } = require("../command");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const fs = require("fs");
const path = require("path");

ffmpeg.setFfmpegPath(ffmpegPath);

cmd({
  pattern: "v2s",
  alias: ["video2mp3", "videotoaudio"],
  react: "🎵",
  desc: "Convert video to MP3 audio (sends as reply)",
  category: "tools",
  filename: __filename
}, async (conn, m, match) => {
  try {
    if (!m.quoted) {
      return m.reply("🎥 Reply to a video message to convert to MP3.");
    }

    const type = m.quoted.type;
    if (type !== "videoMessage") {
      return m.reply("❌ Please reply to a **video** message.");
    }

    // Download video
    const videoBuffer = await m.quoted.download();

    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const inputPath = path.join(tempDir, `v2s_${Date.now()}.mp4`);
    const outputPath = path.join(tempDir, `v2s_${Date.now()}.mp3`);

    fs.writeFileSync(inputPath, videoBuffer);

    // Convert to MP3
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat("mp3")
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .save(outputPath);
    });

    const audioBuffer = fs.readFileSync(outputPath);

    // Send audio as a reply in the same chat (no extra text)
    await conn.sendMessage(m.chat, {
      audio: audioBuffer,
      mimetype: "audio/mpeg",
      ptt: false
    }, { quoted: m.quoted }); // replies to the original video

    // Clean up temp files
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

    // No success message – user only gets the audio
  } catch (err) {
    console.error("v2s error:", err);
    m.reply("❌ Failed to convert video.");
  }
});
