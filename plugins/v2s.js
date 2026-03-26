const { cmd } = require("../command");
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// ============================================
// CONFIGURATION
// ============================================
const config = {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    audioBitrate: '192k',
    tempDir: path.join(process.cwd(), 'temp')
};

// Create temp directory
if (!fs.existsSync(config.tempDir)) {
    fs.mkdirSync(config.tempDir, { recursive: true });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function cleanup(...files) {
    for (const file of files) {
        try {
            if (file && fs.existsSync(file)) {
                fs.unlinkSync(file);
                console.log(`Cleaned up: ${file}`);
            }
        } catch (err) {
            console.error('Cleanup error:', err);
        }
    }
}

// ============================================
// MAIN V2S COMMAND
// ============================================

cmd({
    pattern: "v2s",
    alias: ["vtomp3", "video2mp3", "mp3", "audio"],
    desc: "Convert video to MP3 audio",
    category: "converter",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, reply, sender }) => {
    try {
        // Get video message
        let videoMsg = null;
        let isQuoted = false;
        
        // Check if replying to a video
        if (m.quoted && m.quoted.message) {
            if (m.quoted.message.videoMessage) {
                videoMsg = m.quoted.message.videoMessage;
                isQuoted = true;
                console.log("Found quoted video message");
            } else if (m.quoted.message.documentMessage && 
                       m.quoted.message.documentMessage.mimetype?.includes('video')) {
                videoMsg = m.quoted.message.documentMessage;
                isQuoted = true;
                console.log("Found quoted document video");
            }
        }
        
        // Check if current message has video
        if (!videoMsg && m.message.videoMessage) {
            videoMsg = m.message.videoMessage;
            console.log("Found current video message");
        }
        
        if (!videoMsg) {
            return reply(`🎵 *VIDEO TO MP3 CONVERTER*\n\n` +
                        `📌 *How to use:*\n` +
                        `   1️⃣ Send a video with caption: *.v2s*\n` +
                        `   2️⃣ Reply to a video with: *.v2s*\n\n` +
                        `⚙️ *Settings:*\n` +
                        `   🎚️ Quality: ${config.audioBitrate}\n` +
                        `   📦 Max Size: ${formatBytes(config.maxFileSize)}\n\n` +
                        `✨ *Supported:* MP4, MKV, AVI, MOV, WEBM\n\n` +
                        `💫 *SHAVIYA-XMD*`);
        }
        
        // Check file size
        const fileSize = videoMsg.fileLength || 0;
        if (fileSize > config.maxFileSize) {
            return reply(`❌ *Video too large!*\n\n` +
                        `📦 Size: ${formatBytes(fileSize)}\n` +
                        `⚠️ Max: ${formatBytes(config.maxFileSize)}\n\n` +
                        `Please use a smaller video.`);
        }
        
        // Send processing message
        const processingMsg = await conn.sendMessage(from, {
            text: `🎵 *Processing Video...*\n\n` +
                  `📥 Downloading: ${formatBytes(fileSize)}\n` +
                  `⏳ Please wait...\n\n` +
                  `💫 SHAVIYA-XMD`
        }, { quoted: m });
        
        // Download video
        let videoBuffer;
        try {
            let downloadMsg = m;
            if (isQuoted) {
                downloadMsg = m.quoted;
            }
            
            // Download the media
            const stream = await downloadMsg.download();
            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            videoBuffer = Buffer.concat(chunks);
            
            console.log(`✅ Video downloaded: ${formatBytes(videoBuffer.length)}`);
            
        } catch (downloadError) {
            console.error('Download error:', downloadError);
            await conn.sendMessage(from, {
                text: `❌ *Download Failed!*\n\nError: ${downloadError.message}\n\nPlease try again.`,
                edit: processingMsg.key
            });
            return;
        }
        
        // Update status
        await conn.sendMessage(from, {
            text: `🎵 *Converting to MP3...*\n\n` +
                  `📥 Downloaded: ${formatBytes(videoBuffer.length)}\n` +
                  `🎨 Converting audio...\n\n` +
                  `💫 SHAVIYA-XMD`,
            edit: processingMsg.key
        });
        
        // Save video to temp file
        const timestamp = Date.now();
        const inputFile = path.join(config.tempDir, `video_${timestamp}.mp4`);
        const outputFile = path.join(config.tempDir, `audio_${timestamp}.mp3`);
        
        fs.writeFileSync(inputFile, videoBuffer);
        
        // Convert using ffmpeg
        try {
            // Check ffmpeg
            await execPromise('ffmpeg -version');
            
            // Convert command
            const command = `ffmpeg -i "${inputFile}" -vn -acodec libmp3lame -b:a ${config.audioBitrate} -ar 44100 -ac 2 "${outputFile}" -y`;
            
            console.log(`Running: ${command}`);
            await execPromise(command, { timeout: 120000 });
            
            // Check if output exists
            if (!fs.existsSync(outputFile)) {
                throw new Error("Output file not created");
            }
            
            const audioBuffer = fs.readFileSync(outputFile);
            const audioSize = audioBuffer.length;
            
            console.log(`✅ Converted: ${formatBytes(videoBuffer.length)} → ${formatBytes(audioSize)}`);
            
            // Send audio
            await conn.sendMessage(from, {
                text: `🎵 *Sending Audio...*\n\n` +
                      `📦 Audio size: ${formatBytes(audioSize)}\n` +
                      `🎚️ Quality: ${config.audioBitrate}\n\n` +
                      `📤 Uploading...`,
                edit: processingMsg.key
            });
            
            // Send as audio
            await conn.sendMessage(from, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: `audio_${timestamp}.mp3`,
                caption: `🎵 *Audio Converted Successfully!*\n\n` +
                        `📊 *Details:*\n` +
                        `   • Original: ${formatBytes(videoBuffer.length)}\n` +
                        `   • Audio: ${formatBytes(audioSize)}\n` +
                        `   • Quality: ${config.audioBitrate}\n` +
                        `   • Format: MP3\n\n` +
                        `✨ *SHAVIYA-XMD*`
            }, { quoted: m });
            
            // Success reaction
            await conn.sendMessage(from, {
                react: { text: "✅", key: m.key }
            });
            
            // Delete processing message
            await conn.sendMessage(from, {
                delete: processingMsg.key
            });
            
        } catch (convError) {
            console.error('Conversion error:', convError);
            
            // Try alternative conversion
            try {
                await conn.sendMessage(from, {
                    text: `🔄 *Trying alternative method...*`,
                    edit: processingMsg.key
                });
                
                // Alternative command
                const altCommand = `ffmpeg -i "${inputFile}" -q:a 0 -map a "${outputFile}" -y`;
                await execPromise(altCommand, { timeout: 120000 });
                
                if (fs.existsSync(outputFile)) {
                    const audioBuffer = fs.readFileSync(outputFile);
                    
                    await conn.sendMessage(from, {
                        audio: audioBuffer,
                        mimetype: 'audio/mpeg',
                        fileName: `audio_${timestamp}.mp3`,
                        caption: `🎵 *Audio Converted (Alternative Method)*\n\n` +
                                `📦 Size: ${formatBytes(audioBuffer.length)}\n\n` +
                                `✨ SHAVIYA-XMD`
                    }, { quoted: m });
                    
                    await conn.sendMessage(from, {
                        delete: processingMsg.key
                    });
                } else {
                    throw new Error("Alternative conversion failed");
                }
                
            } catch (altError) {
                await conn.sendMessage(from, {
                    text: `❌ *Conversion Failed!*\n\n` +
                          `Error: ${convError.message}\n\n` +
                          `💡 *Fix:*\n` +
                          `   • Install ffmpeg:\n` +
                          `     Ubuntu: sudo apt-get install ffmpeg\n` +
                          `     Termux: pkg install ffmpeg\n\n` +
                          `   • Try a different video format\n\n` +
                          `💫 SHAVIYA-XMD`,
                    edit: processingMsg.key
                });
            }
        }
        
        // Cleanup
        cleanup(inputFile, outputFile);
        
    } catch (error) {
        console.error('V2S Error:', error);
        reply(`❌ *Error:* ${error.message}\n\nPlease try again.`);
    }
});

// ============================================
// QUALITY SETTINGS
// ============================================

cmd({
    pattern: "v2sq",
    alias: ["v2squality", "audiobitrate"],
    desc: "Set audio quality",
    category: "owner",
    react: "⚙️",
    filename: __filename
}, async (conn, mek, m, { from, args, reply, isOwner }) => {
    try {
        if (!isOwner) {
            return reply(`❌ *Owner only command*`);
        }
        
        const quality = args[0]?.toLowerCase();
        
        if (!quality || !['128k', '192k', '320k'].includes(quality)) {
            return reply(`⚙️ *Audio Quality*\n\n` +
                        `Current: ${config.audioBitrate}\n\n` +
                        `Options:\n` +
                        `• 128k - Small file\n` +
                        `• 192k - Balanced\n` +
                        `• 320k - Best quality\n\n` +
                        `Usage: .v2sq 320k\n\n` +
                        `💫 SHAVIYA-XMD`);
        }
        
        config.audioBitrate = quality;
        reply(`✅ Quality set to: ${quality}`);
        
    } catch (error) {
        reply(`❌ Error: ${error.message}`);
    }
});
