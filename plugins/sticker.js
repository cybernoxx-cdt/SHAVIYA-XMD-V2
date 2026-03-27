const { cmd } = require("../command");
const sharp = require("sharp");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const fs = require("fs");
const path = require("path");

ffmpeg.setFfmpegPath(ffmpegPath);

cmd({
  pattern: "sticker",
  alias: ["s", "sticker", "to sticker"],
  react: "🎨",
  desc: "Convert image/video to sticker",
  category: "tools",
  filename: __filename
}, async (conn, m, match) => {
  try {
    // Check if a message is quoted
    if (!m.quoted) return m.reply("🎨 Reply to an image or video to convert to sticker.");

    const type = m.quoted.type;
    if (type !== "imageMessage" && type !== "videoMessage") {
      return m.reply("❌ Please reply to an **image** or **video** message.");
    }

    await m.reply("⏳ Converting to sticker...");

    // Create temporary directory if it doesn't exist
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const download = await m.quoted.download();
    let inputPath, outputPath;

    if (type === "imageMessage") {
      // Process image directly
      inputPath = path.join(tempDir, `sticker_input_${Date.now()}.jpg`);
      fs.writeFileSync(inputPath, download);

      outputPath = path.join(tempDir, `sticker_output_${Date.now()}.webp`);

      await sharp(inputPath)
        .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp()
        .toFile(outputPath);

      const stickerBuffer = fs.readFileSync(outputPath);
      await conn.sendMessage(m.sender, { sticker: stickerBuffer });
    } 
    else if (type === "videoMessage") {
      // Extract first frame from video
      inputPath = path.join(tempDir, `sticker_video_${Date.now()}.mp4`);
      fs.writeFileSync(inputPath, download);

      const framePath = path.join(tempDir, `sticker_frame_${Date.now()}.png`);
      outputPath = path.join(tempDir, `sticker_output_${Date.now()}.webp`);

      // Extract first frame using ffmpeg
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .screenshots({
            timestamps: ["0"],
            filename: path.basename(framePath),
            folder: tempDir,
            size: "512x512"
          })
          .on("end", resolve)
          .on("error", reject);
      });

      // Convert the extracted PNG to WebP sticker
      await sharp(framePath)
        .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp()
        .toFile(outputPath);

      const stickerBuffer = fs.readFileSync(outputPath);
      await conn.sendMessage(m.sender, { sticker: stickerBuffer });

      // Clean up frame file
      fs.unlinkSync(framePath);
    }

    // Clean up temporary files
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

    await m.reply("✅ Sticker created and sent to your inbox!");
  } catch (err) {
    console.error("Sticker error:", err);
    m.reply("❌ Failed to create sticker. Make sure the media is valid.");
  }
});
