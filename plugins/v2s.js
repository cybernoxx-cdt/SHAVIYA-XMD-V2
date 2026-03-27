const { cmd } = require("../command");
const { execSync } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Try to find ffmpeg executable
let ffmpegPath = null;

// 1. Check if system ffmpeg is installed
try {
  execSync("which ffmpeg", { stdio: "ignore" });
  ffmpegPath = "ffmpeg";
  console.log("[v2s] Using system ffmpeg");
} catch (err) {
  // 2. Fallback to ffmpeg-static
  try {
    const staticPath = require("ffmpeg-static");
    if (fs.existsSync(staticPath)) {
      // Make it executable (just in case)
      fs.chmodSync(staticPath, 0o755);
      ffmpegPath = staticPath;
      console.log("[v2s] Using ffmpeg-static at", staticPath);
    } else {
      console.error("[v2s] ffmpeg-static binary not found");
    }
  } catch (e) {
    console.error("[v2s] ffmpeg-static not installed or not found");
  }
}

if (!ffmpegPath) {
  console.error("[v2s] ffmpeg not available. Please install ffmpeg or ffmpeg-static.");
}

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
    if (!ffmpegPath) {
      return m.reply("❌ ffmpeg is not installed on this bot. Please ask the bot owner to install it.");
    }

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
      return m.reply("❌ Could not download the video. Make sure it's not a view-once message.");
    }

    if (!videoBuffer || videoBuffer.length === 0) {
      return m.reply("❌ Downloaded video is empty.");
    }

    // Create temp directory
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

    // No extra text – only the audio
  } catch (err) {
    console.error("Unexpected error in v2s:", err);
    m.reply(`❌ Unexpected error: ${err.message || "Please check the bot logs"}`);
  }
});
