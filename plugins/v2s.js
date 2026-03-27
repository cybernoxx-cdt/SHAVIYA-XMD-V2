const { cmd } = require("../command");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegStatic = require("ffmpeg-static");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

cmd({
  pattern: "v2s",
  alias: ["video2mp3", "videotoaudio"],
  react: "🎵",
  desc: "Convert video to MP3 audio (sends as reply)",
  category: "tools",
  filename: __filename
}, async (conn, m, match) => {
  try {
    // Check quoted message
    if (!m.quoted) {
      return m.reply("🎥 Reply to a video message to convert to MP3.");
    }

    const type = m.quoted.type;
    if (type !== "videoMessage") {
      return m.reply("❌ Please reply to a **video** message.");
    }

    // Download video buffer
    let videoBuffer;
    try {
      videoBuffer = await m.quoted.download();
    } catch (downloadErr) {
      console.error("Download error:", downloadErr);
      return m.reply("❌ Could not download the video. Make sure it's not a view-once message and is accessible.");
    }

    if (!videoBuffer || videoBuffer.length === 0) {
      return m.reply("❌ Downloaded video is empty.");
    }

    // Create a temporary directory (system temp folder + unique name)
    const tempDir = path.join(os.tmpdir(), "wa_bot_v2s");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const timestamp = Date.now();
    const inputPath = path.join(tempDir, `input_${timestamp}.mp4`);
    const outputPath = path.join(tempDir, `output_${timestamp}.mp3`);

    // Write video to temp file
    fs.writeFileSync(inputPath, videoBuffer);

    // Convert using ffmpeg
    try {
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .toFormat("mp3")
          .on("end", () => resolve())
          .on("error", (err) => {
            console.error("FFmpeg error:", err);
            reject(err);
          })
          .save(outputPath);
      });
    } catch (convErr) {
      console.error("Conversion error:", convErr);
      return m.reply(`❌ Conversion failed: ${convErr.message}`);
    }

    // Read converted file
    let audioBuffer;
    try {
      audioBuffer = fs.readFileSync(outputPath);
    } catch (readErr) {
      console.error("Read output error:", readErr);
      return m.reply("❌ Could not read the converted audio file.");
    }

    // Send audio as reply
    await conn.sendMessage(m.chat, {
      audio: audioBuffer,
      mimetype: "audio/mpeg",
      ptt: false
    }, { quoted: m.quoted });

    // Clean up
    try {
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    } catch (cleanErr) {
      console.warn("Cleanup error:", cleanErr);
    }

    // No extra text messages – only the audio is sent
  } catch (err) {
    console.error("Unexpected error in v2s:", err);
    m.reply(`❌ Unexpected error: ${err.message || "Please check the bot logs"}`);
  }
});
