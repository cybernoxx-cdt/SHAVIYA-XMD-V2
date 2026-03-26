const { cmd } = require("../command");
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// ============================================
// CONFIGURATION
// ============================================
const config = {
    maxFileSize: 50 * 1024 * 1024, // 50MB max
    audioBitrate: '192k',
    tempDir: path.join(process.cwd(), 'temp')
};

// Create temp directory if not exists
if (!fs.existsSync(config.tempDir)) {
    fs.mkdirSync(config.tempDir, { recursive: true });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format file size
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration
 */
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get file extension from mime type
 */
function getExtension(mimeType) {
    const extensions = {
        'video/mp4': '.mp4',
        'video/x-matroska': '.mkv',
        'video/quicktime': '.mov',
        'video/x-msvideo': '.avi',
        'video/webm': '.webm',
        'video/mpeg': '.mpg'
    };
    return extensions[mimeType] || '.mp4';
}

/**
 * Clean up temp files
 */
function cleanup(filePath) {
    try {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (err) {
        console.error('Cleanup error:', err);
    }
}

// ============================================
// MAIN V2S COMMAND
// ============================================

cmd({
    pattern: "v2s",
    alias: ["vtomp3", "video2mp3", "convert2audio", "mp3"],
    desc: "Convert video to MP3 audio",
    category: "converter",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, reply, sender, isOwner }) => {
    try {
        // Check if there's a video to convert
        let videoMessage = null;
        let isQuoted = false;
        
        // Check quoted message first
        if (m.quoted && m.quoted.message) {
            if (m.quoted.message.videoMessage) {
                videoMessage = m.quoted.message.videoMessage;
                isQuoted = true;
            } else if (m.quoted.message.documentMessage && 
                       m.quoted.message.documentMessage.mimetype?.startsWith('video/')) {
                videoMessage = m.quoted.message.documentMessage;
                isQuoted = true;
            }
        }
        
        // Check current message
        if (!videoMessage && m.message.videoMessage) {
            videoMessage = m.message.videoMessage;
        } else if (!videoMessage && m.message.documentMessage && 
                   m.message.documentMessage.mimetype?.startsWith('video/')) {
            videoMessage = m.message.documentMessage;
        }
        
        if (!videoMessage) {
            return reply(`🎵 *VIDEO TO MP3 CONVERTER*\n\n` +
                        `📌 *How to use:*\n` +
                        `   • Reply to a video: *.v2s*\n` +
                        `   • Send video with caption: *.v2s*\n\n` +
                        `⚙️ *Settings:*\n` +
                        `   • Quality: ${config.audioBitrate}\n` +
                        `   • Format: MP3\n` +
                        `   • Max Size: ${formatBytes(config.maxFileSize)}\n\n` +
                        `✨ *Supported formats:*\n` +
                        `   MP4, MKV, AVI, MOV, WEBM\n\n` +
                        `💫 *SHAVIYA-XMD*`);
        }
        
        // Check file size
        const fileSize = videoMessage.fileLength || 0;
        if (fileSize > config.maxFileSize) {
            return reply(`❌ *Video too large!*\n\n` +
                        `📦 Size: ${formatBytes(fileSize)}\n` +
                        `⚠️ Max: ${formatBytes(config.maxFileSize)}\n\n` +
                        `Please use a smaller video.`);
        }
        
        // Send processing message
        const processingMsg = await conn.sendMessage(from, {
            text: `🎵 *Processing Video...*\n\n` +
                  `📥 Downloading video...\n` +
                  `⏳ Please wait...\n\n` +
                  `💫 SHAVIYA-XMD`
        }, { quoted: m });
        
        // Download video
        let videoBuffer;
        try {
            // Get the correct message to download
            let downloadMsg = m;
            if (isQuoted) {
                downloadMsg = m.quoted;
            }
            
            // Download the media
            const stream = await downloadMedia(downloadMsg, 'video');
            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            videoBuffer = Buffer.concat(chunks);
            
        } catch (downloadError) {
            console.error('Download error:', downloadError);
            await conn.sendMessage(from, {
                text: `❌ *Download Failed!*\n\n` +
                      `Error: ${downloadError.message}\n\n` +
                      `Please try again with a different video.`,
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
        const ext = getExtension(videoMessage.mimetype || 'video/mp4');
        const inputFile = path.join(config.tempDir, `video_${Date.now()}${ext}`);
        const outputFile = path.join(config.tempDir, `audio_${Date.now()}.mp3`);
        
        fs.writeFileSync(inputFile, videoBuffer);
        
        // Convert using ffmpeg
        try {
            // Check if ffmpeg is installed
            await execPromise('ffmpeg -version');
            
            // Convert video to mp3
            const ffmpegCmd = `ffmpeg -i "${inputFile}" -vn -acodec libmp3lame -b:a ${config.audioBitrate} -ar 44100 -ac 2 "${outputFile}" -y`;
            
            await execPromise(ffmpegCmd, { timeout: 120000 });
            
            // Read the converted audio
            const audioBuffer = fs.readFileSync(outputFile);
            
            // Update status
            await conn.sendMessage(from, {
                text: `🎵 *Sending Audio...*\n\n` +
                      `📦 Audio size: ${formatBytes(audioBuffer.length)}\n` +
                      `🎵 Quality: ${config.audioBitrate}\n\n` +
                      `📤 Uploading...`,
                edit: processingMsg.key
            });
            
            // Generate filename
            const timestamp = Date.now();
            const filename = `audio_${timestamp}.mp3`;
            
            // Send as audio
            await conn.sendMessage(from, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: filename,
                caption: `🎵 *Audio Converted Successfully!*\n\n` +
                        `📊 *Details:*\n` +
                        `   • Original Video: ${formatBytes(videoBuffer.length)}\n` +
                        `   • Audio Size: ${formatBytes(audioBuffer.length)}\n` +
                        `   • Quality: ${config.audioBitrate}\n` +
                        `   • Format: MP3\n\n` +
                        `✨ *Converted by SHAVIYA-XMD*`
            }, { quoted: m });
            
            // Send success reaction
            await conn.sendMessage(from, {
                react: { text: "✅", key: m.key }
            });
            
            // Delete processing message
            await conn.sendMessage(from, {
                delete: processingMsg.key
            });
            
            console.log(`✅ [V2S] Converted: ${formatBytes(videoBuffer.length)} → ${formatBytes(audioBuffer.length)}`);
            
        } catch (ffmpegError) {
            console.error('FFmpeg error:', ffmpegError);
            
            // Try alternative conversion method
            try {
                await conn.sendMessage(from, {
                    text: `🔄 *Trying alternative method...*`,
                    edit: processingMsg.key
                });
                
                // Alternative: Use online API or different ffmpeg command
                // This is a fallback - you can add your own API here
                
                throw new Error('FFmpeg conversion failed. Please install ffmpeg on your server.');
                
            } catch (altError) {
                await conn.sendMessage(from, {
                    text: `❌ *Conversion Failed!*\n\n` +
                          `Error: ${ffmpegError.message}\n\n` +
                          `💡 *Fix:*\n` +
                          `   • Install ffmpeg on your server\n` +
                          `   • Try a different video format\n\n` +
                          `For Linux/Ubuntu:\n` +
                          `   sudo apt-get install ffmpeg\n\n` +
                          `For Termux:\n` +
                          `   pkg install ffmpeg`,
                    edit: processingMsg.key
                });
            }
        }
        
        // Clean up temp files
        cleanup(inputFile);
        cleanup(outputFile);
        
    } catch (error) {
        console.error('V2S Error:', error);
        reply(`❌ *Error Occurred!*\n\n${error.message}\n\nPlease try again later.`);
    }
});

// ============================================
// V2S WITH QUALITY OPTIONS
// ============================================

cmd({
    pattern: "v2squality",
    alias: ["v2sq", "audiobitrate"],
    desc: "Set audio quality for conversion",
    category: "owner",
    react: "⚙️",
    filename: __filename
}, async (conn, mek, m, { from, args, reply, isOwner }) => {
    try {
        if (!isOwner) {
            return reply(`❌ *Owner Only!*\n\nOnly bot owner can change quality settings.`);
        }
        
        const quality = args[0]?.toLowerCase();
        
        if (!quality || !['128k', '192k', '320k'].includes(quality)) {
            return reply(`⚙️ *AUDIO QUALITY SETTINGS*\n\n` +
                        `📌 *Current Quality:* ${config.audioBitrate}\n\n` +
                        `🎚️ *Available Qualities:*\n` +
                        `   • 128k - Small size, good quality\n` +
                        `   • 192k - Balanced (Default)\n` +
                        `   • 320k - Best quality, larger size\n\n` +
                        `📝 *Usage:* .v2squality 320k\n\n` +
                        `💫 SHAVIYA-XMD`);
        }
        
        config.audioBitrate = quality;
        
        reply(`✅ *Audio Quality Updated!*\n\n` +
              `🎚️ New Quality: ${quality}\n` +
              `📦 File size will be adjusted accordingly.\n\n` +
              `💫 SHAVIYA-XMD`);
        
    } catch (error) {
        reply(`❌ Error: ${error.message}`);
    }
});

// ============================================
// HELP FUNCTION FOR DOWNLOADING MEDIA
// ============================================

async function downloadMedia(message, type) {
    // This is a simplified version - you may need to adjust based on your bot's structure
    if (message.download) {
        return await message.download();
    }
    
    // Alternative download method
    const stream = await message.getMediaStream();
    return stream;
}
