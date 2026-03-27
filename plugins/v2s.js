const { cmd } = require("../command");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const fs = require("fs");
const path = require("path");

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

cmd({
  pattern: "v2s",
  alias: ["video2mp3", "videotoaudio"],
  react: "🎵",
  desc: "Convert video to MP3 audio",
  category: "tools",
  filename: __filename
}, async (conn, m, match) => {
  try {
    if (!m.quoted) return m.reply("🎥 Reply to a video message to convert to MP3.");

    const type = m.quoted.type;
    if (type !== "videoMessage") {
      return m.reply("❌ Please reply to a **video** message.");
    }

    // Notify user
    await m.reply("⏳ Converting video to MP3...");

    // Download the video buffer
    const videoBuffer = await m.quoted.download();
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const inputPath = path.join(tempDir, `input_${Date.now()}.mp4`);
    const outputPath = path.join(tempDir, `output_${Date.now()}.mp3`);

    // Write video buffer to temporary file
    fs.writeFileSync(inputPath, videoBuffer);

    // Convert to MP3 using ffmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat("mp3")
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .save(outputPath);
    });

    // Read the converted audio
    const audioBuffer = fs.readFileSync(outputPath);

    // Send the MP3 to the user (inbox)
    await conn.sendMessage(m.sender, {
      audio: audioBuffer,
      mimetype: "audio/mpeg",
      ptt: false,
      fileName: "audio.mp3"
    });

    // Clean up temporary files
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

    // Optional: notify success
    await m.reply("✅ Conversion complete! MP3 sent to your inbox.");
  } catch (err) {
    console.error("v2s error:", err);
    m.reply("❌ Failed to convert video. Make sure the video is valid.");
  }
});
