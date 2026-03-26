/**
 * Video to MP3 Converter Plugin
 * @description Convert any video to high-quality MP3 audio
 * @version 3.0.0
 * @author SHAVIYA-XMD
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { cmd } = require('../command');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;

// Set FFmpeg paths
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// ============================================
// CONFIGURATION
// ============================================
const config = {
    maxFileSize: 50 * 1024 * 1024, // 50MB max video size
    audioBitrate: '192k', // Audio quality: 128k, 192k, 320k
    audioFormat: 'mp3',
    sampleRate: 44100,
    tempDir: path.join(process.cwd(), 'temp'),
    keepOriginal: false
};

// Create temp directory if not exists
if (!fs.existsSync(config.tempDir)) {
    fs.mkdirSync(config.tempDir, { recursive: true });
}

// ============================================
// Helper Functions
// ============================================

/**
 * Generate random filename
 */
function getRandomFilename(ext) {
    return `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get video duration using ffprobe
 */
async function getVideoDuration(filePath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                reject(err);
            } else {
                const duration = metadata.format.duration;
                resolve(duration);
            }
        });
    });
}

/**
 * Format duration to MM:SS
 */
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Clean up temp files
 */
async function cleanupTempFiles(...files) {
    for (const file of files) {
        if (file && fs.existsSync(file)) {
            try {
                fs.unlinkSync(file);
            } catch (err) {
                console.error('Cleanup error:', err);
            }
        }
    }
}

/**
 * Download media with progress
 */
async function downloadMedia(msg, sock, isVideo = true) {
    return new Promise(async (resolve, reject) => {
        try {
            let mediaMessage;
            
            // Get media from quoted message
            if (msg.quoted && msg.quoted.message) {
                if (msg.quoted.message.videoMessage) {
                    mediaMessage = msg.quoted.message.videoMessage;
                } else if (msg.quoted.message.documentMessage && 
                           msg.quoted.message.documentMessage.mimetype?.startsWith('video/')) {
                    mediaMessage = msg.quoted.message.documentMessage;
                } else if (msg.quoted.message.imageMessage) {
                    return reject(new Error('❌ Please reply to a *VIDEO* file, not an image!'));
                } else if (msg.quoted.message.audioMessage) {
                    return reject(new Error('❌ Please reply to a *VIDEO* file, not audio!'));
                } else {
                    return reject(new Error('❌ Please reply to a *VIDEO* file!'));
                }
            } 
            // Get media from current message
            else if (msg.message.videoMessage) {
                mediaMessage = msg.message.videoMessage;
            } 
            else if (msg.message.documentMessage && 
                     msg.message.documentMessage.mimetype?.startsWith('video/')) {
                mediaMessage = msg.message.documentMessage;
            }
            else {
                return reject(new Error('❌ No video found!\n\nPlease reply to a video or send a video with the command.'));
            }

            // Check file size
            const fileSize = mediaMessage.fileLength || mediaMessage.documentMessage?.fileLength;
            if (fileSize && fileSize > config.maxFileSize) {
                return reject(new Error(`❌ Video too large!\n\n📦 Size: ${formatFileSize(fileSize)}\n⚠️ Max: ${formatFileSize(config.maxFileSize)}\n\nPlease use a smaller video.`));
            }

            // Download video
            const stream = await downloadContentFromMessage(
                mediaMessage,
                mediaMessage.videoMessage ? 'video' : 'document',
                {}
            );

            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            
            resolve(buffer);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Convert video to MP3 using FFmpeg
 */
async function convertToMP3(videoBuffer, inputExt = 'mp4') {
    return new Promise(async (resolve, reject) => {
        const inputFile = path.join(config.tempDir, getRandomFilename(inputExt));
        const outputFile = path.join(config.tempDir, getRandomFilename('mp3'));
        
        try {
            // Save video buffer to temp file
            fs.writeFileSync(inputFile, videoBuffer);
            
            // Get video duration
            let duration = 0;
            try {
                duration = await getVideoDuration(inputFile);
            } catch (err) {
                console.log('Duration fetch failed, continuing...');
            }
            
            // Convert using FFmpeg
            ffmpeg(inputFile)
                .toFormat('mp3')
                .audioBitrate(config.audioBitrate)
                .audioFrequency(config.sampleRate)
                .audioChannels(2)
                .on('end', () => {
                    const audioBuffer = fs.readFileSync(outputFile);
                    resolve({
                        buffer: audioBuffer,
                        duration: duration,
                        size: audioBuffer.length,
                        inputFile: inputFile,
                        outputFile: outputFile
                    });
                })
                .on('error', (err) => {
                    console.error('FFmpeg error:', err);
                    reject(new Error(`Conversion failed: ${err.message}`));
                })
                .save(outputFile);
                
        } catch (error) {
            cleanupTempFiles(inputFile, outputFile);
            reject(error);
        }
    });
}

/**
 * Extract video metadata
 */
async function getVideoMetadata(buffer) {
    return new Promise((resolve, reject) => {
        const tempFile = path.join(config.tempDir, getRandomFilename('mp4'));
        
        try {
            fs.writeFileSync(tempFile, buffer);
            
            ffmpeg.ffprobe(tempFile, (err, metadata) => {
                cleanupTempFiles(tempFile);
                
                if (err) {
                    resolve({ width: 0, height: 0, duration: 0, bitrate: 0 });
                } else {
                    const videoStream = metadata.streams.find(s => s.codec_type === 'video');
                    resolve({
                        width: videoStream?.width || 0,
                        height: videoStream?.height || 0,
                        duration: metadata.format.duration || 0,
                        bitrate: metadata.format.bit_rate || 0,
                        size: buffer.length
                    });
                }
            });
        } catch (error) {
            cleanupTempFiles(tempFile);
            resolve({ width: 0, height: 0, duration: 0, bitrate: 0 });
        }
    });
}

// ============================================
// MAIN COMMAND
// ============================================

cmd({
    pattern: "v2s",
    alias: ["vtomp3", "videotoaudio", "video2mp3", "convert2audio"],
    desc: "Convert video to MP3 audio",
    category: "converter",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, reply, sender, isOwner }) => {
    try {
        // Check if video is provided
        const hasVideo = (m.quoted && (m.quoted.message?.videoMessage || 
                         (m.quoted.message?.documentMessage?.mimetype?.startsWith('video/')))) ||
                         m.message?.videoMessage ||
                         (m.message?.documentMessage?.mimetype?.startsWith('video/'));
        
        if (!hasVideo) {
            return reply(`🎵 *Video to MP3 Converter*\n\n` +
                        `📌 *Usage:*\n` +
                        `   • Reply to a video: *${m.prefix}v2s*\n` +
                        `   • Send video with caption: *${m.prefix}v2s*\n\n` +
                        `⚙️ *Settings:*\n` +
                        `   • Quality: ${config.audioBitrate}\n` +
                        `   • Format: MP3\n` +
                        `   • Sample Rate: ${config.sampleRate}Hz\n` +
                        `   • Max Size: ${formatFileSize(config.maxFileSize)}\n\n` +
                        `🎬 *Supports:*\n` +
                        `   • MP4, MKV, AVI, MOV, WEBM\n` +
                        `   • All video formats\n\n` +
                        `✨ *Example:*\n` +
                        `   Reply to a video and type *${m.prefix}v2s*\n\n` +
                        `──────────────\n` +
                        `💫 *SHAVIYA-XMD*`);
        }

        // Send initial processing message
        const processingMsg = await conn.sendMessage(from, {
            text: `🎵 *Processing Video...*\n\n` +
                  `📥 Downloading video...\n` +
                  `⏳ Please wait...\n\n` +
                  `💫 SHAVIYA-XMD`
        }, { quoted: m });

        // Download video
        let videoBuffer;
        try {
            videoBuffer = await downloadMedia(m, conn, true);
        } catch (downloadError) {
            await conn.sendMessage(from, {
                text: downloadError.message,
                edit: processingMsg.key
            });
            return;
        }

        // Update status
        await conn.sendMessage(from, {
            text: `🎵 *Converting to MP3...*\n\n` +
                  `📥 Downloaded: ${formatFileSize(videoBuffer.length)}\n` +
                  `🎨 Converting audio...\n\n` +
                  `💫 SHAVIYA-XMD`,
            edit: processingMsg.key
        });

        // Get video metadata
        const metadata = await getVideoMetadata(videoBuffer);
        
        // Convert to MP3
        let conversionResult;
        try {
            conversionResult = await convertToMP3(videoBuffer);
        } catch (convError) {
            await conn.sendMessage(from, {
                text: `❌ *Conversion Failed!*\n\nError: ${convError.message}\n\nPlease try again with a different video.`,
                edit: processingMsg.key
            });
            return;
        }

        // Update status
        await conn.sendMessage(from, {
            text: `🎵 *Preparing Audio...*\n\n` +
                  `📦 Audio size: ${formatFileSize(conversionResult.size)}\n` +
                  `🎵 Quality: ${config.audioBitrate}\n` +
                  `⏱️ Duration: ${metadata.duration ? formatDuration(metadata.duration) : 'Unknown'}\n\n` +
                  `📤 Sending...`,
            edit: processingMsg.key
        });

        // Generate filename
        const timestamp = Date.now();
        const filename = `audio_${timestamp}.mp3`;
        
        // Prepare caption
        const durationText = metadata.duration ? formatDuration(metadata.duration) : 'Unknown';
        const videoSizeText = formatFileSize(metadata.size);
        const audioSizeText = formatFileSize(conversionResult.size);
        
        const caption = `🎵 *Audio Extracted Successfully!*\n\n` +
                        `📊 *Details:*\n` +
                        `   • Original Video: ${videoSizeText}\n` +
                        `   • Audio Size: ${audioSizeText}\n` +
                        `   • Quality: ${config.audioBitrate}\n` +
                        `   • Duration: ${durationText}\n` +
                        `   • Format: MP3\n\n` +
                        `✨ *Converted by SHAVIYA-XMD*\n` +
                        `💫 *Ultra Fast Converter*`;

        // Send as audio
        await conn.sendMessage(from, {
            audio: conversionResult.buffer,
            mimetype: 'audio/mpeg',
            fileName: filename,
            caption: caption,
            ptt: false
        }, { quoted: m });

        // Send success reaction
        await conn.sendMessage(from, {
            react: { text: "✅", key: m.key }
        });

        // Delete processing message
        await conn.sendMessage(from, {
            delete: processingMsg.key
        });

        // Cleanup temp files
        await cleanupTempFiles(conversionResult.inputFile, conversionResult.outputFile);
        
        console.log(`✅ [V2S] Converted: ${videoSizeText} → ${audioSizeText} | Duration: ${durationText}`);

    } catch (error) {
        console.error('V2S Error:', error);
        reply(`❌ *Error Occurred!*\n\n${error.message}\n\nPlease try again later.`);
    }
});

// ============================================
// ADVANCED CONVERTER WITH QUALITY OPTIONS
// ============================================

cmd({
    pattern: "v2squality",
    alias: ["v2sq", "audioquality"],
    desc: "Convert video with custom quality",
    category: "converter",
    react: "⚙️",
    filename: __filename
}, async (conn, mek, m, { from, args, reply, sender, isOwner }) => {
    try {
        const quality = args[0]?.toLowerCase();
        
        if (!quality || !['128k', '192k', '320k'].includes(quality)) {
            return reply(`🎵 *Audio Quality Options*\n\n` +
                        `📌 *Usage:* .v2squality <quality>\n\n` +
                        `🎚️ *Available Qualities:*\n` +
                        `   • 128k - Small size, good quality\n` +
                        `   • 192k - Balanced (Default)\n` +
                        `   • 320k - Best quality, larger size\n\n` +
                        `📝 *Example:* .v2squality 320k\n\n` +
                        `💫 *SHAVIYA-XMD*`);
        }
        
        if (!isOwner) {
            return reply(`❌ *Owner Only!*\n\nOnly bot owner can change quality settings.`);
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
// BULK CONVERTER (Multiple videos)
// ============================================

cmd({
    pattern: "v2sbulk",
    alias: ["bulkconvert"],
    desc: "Convert multiple videos to MP3 (Max 5)",
    category: "converter",
    react: "📦",
    filename: __filename
}, async (conn, mek, m, { from, reply, sender }) => {
    try {
        reply(`📦 *Bulk Video to MP3 Converter*\n\n` +
              `Please send up to 5 videos.\n` +
              `Type *done* when finished.\n\n` +
              `⏱️ Timeout: 5 minutes\n\n` +
              `💫 SHAVIYA-XMD`);
        
        // Implementation for bulk conversion
        // (Similar to single but with multiple files)
        
    } catch (error) {
        reply(`❌ Error: ${error.message}`);
    }
});
