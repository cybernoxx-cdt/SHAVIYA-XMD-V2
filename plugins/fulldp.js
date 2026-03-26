/**
 * Owner Fulldp Set Plugin
 * @description Allows bot owner to set/change the bot's profile picture
 * @version 3.0.0
 * @author WhatsApp Bot Plugin
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';

// Plugin configuration
const config = {
    name: 'Owner Fulldp Set',
    description: 'Set or change bot profile picture (Owner only)',
    version: '3.0.0',
    usage: '.setpp [image] or .setpp url <image_url>',
    category: 'Owner',
    aliases: ['setpp', 'setdp', 'setprofile', 'botpp', 'changepp']
};

/**
 * Main plugin function for setting bot profile picture
 */
export default {
    command: ['fulldp'],
    description: "Set or change bot profile picture (Owner only)",
    category: "Owner",
    owner: true,  // Owner only
    admin: false,
    hidden: false,
    limit: false,
    
    haruna: async function(m, { sock, api, command, prefix, args, isOwner }) {
        try {
            // Double-check owner permission
            if (!isOwner) {
                return m.reply(`❌ *Access Denied!*\n\nThis command is restricted to the bot owner only.\n\n*Owner ID:* ${global.owner || 'Not configured'}`);
            }

            let imageBuffer = null;
            let imageSource = '';
            let imageUrl = null;

            // Method 1: Get image from replied message
            if (m.quoted && m.quoted.message && m.quoted.message.imageMessage) {
                imageSource = 'replied message';
                const msg = m.quoted.message.imageMessage;
                const stream = await sock.downloadMediaMessage(m.quoted);
                imageBuffer = await streamToBuffer(stream);
            }
            // Method 2: Get image from current message (if image attached)
            else if (m.message && m.message.imageMessage) {
                imageSource = 'attached image';
                const stream = await sock.downloadMediaMessage(m);
                imageBuffer = await streamToBuffer(stream);
            }
            // Method 3: Get image from URL
            else if (args[0] === 'url' && args[1]) {
                imageSource = 'URL';
                imageUrl = args[1];
                imageBuffer = await downloadImage(imageUrl);
            }
            // Method 4: Get image from local path
            else if (args[0] === 'file' && args[1]) {
                imageSource = 'local file';
                const filePath = path.join(process.cwd(), args[1]);
                if (fs.existsSync(filePath)) {
                    imageBuffer = fs.readFileSync(filePath);
                } else {
                    return m.reply(`❌ *File not found:* ${args[1]}`);
                }
            }
            else {
                return m.reply(`❌ *How to use:*\n\n` +
                              `1️⃣ *Send with image:* ${prefix + command} (with image attached)\n` +
                              `2️⃣ *Reply to image:* ${prefix + command} (reply to an image)\n` +
                              `3️⃣ *From URL:* ${prefix + command} url <image_url>\n` +
                              `4️⃣ *From file:* ${prefix + command} file <path/to/image.jpg>\n\n` +
                              `📝 *Example:*\n${prefix + command} url https://example.com/bot-pp.jpg`);
            }

            if (!imageBuffer) {
                return m.reply(`❌ *Failed to get image!*\n\nPlease ensure the image is valid and try again.`);
            }

            // Send processing message
            const processingMsg = await m.replyUpdate(`🔄 *Processing profile picture update...*\n\n📸 *Source:* ${imageSource}\n📏 *Size:* ${(imageBuffer.length / 1024).toFixed(2)} KB`);

            // Validate and optimize image
            const fileType = await fileTypeFromBuffer(imageBuffer);
            if (!fileType || !fileType.mime.startsWith('image/')) {
                return m.reply(`❌ *Invalid file type!*\n\nPlease provide a valid image file (JPG, PNG, WEBP, etc.)`);
            }

            // Optimize image for WhatsApp (max 640x640, compress if needed)
            const optimizedBuffer = await optimizeProfilePicture(imageBuffer);
            
            // Update status
            processingMsg(`🎨 *Optimizing image...*\n📐 *Optimized size:* ${(optimizedBuffer.length / 1024).toFixed(2)} KB`);
            
            // Get bot's own JID
            const botJid = sock.user.id || sock.user.jid;
            
            if (!botJid) {
                return m.reply(`❌ *Error:* Cannot identify bot's JID. Please check connection.`);
            }
            
            // Update profile picture
            try {
                await sock.updateProfilePicture(botJid, optimizedBuffer);
                
                // Save to history for rollback capability
                const historyPath = path.join(process.cwd(), 'database', 'pp_history');
                if (!fs.existsSync(historyPath)) {
                    fs.mkdirSync(historyPath, { recursive: true });
                }
                
                const timestamp = Date.now();
                const historyFile = path.join(historyPath, `pp_${timestamp}.jpg`);
                fs.writeFileSync(historyFile, optimizedBuffer);
                
                // Also save to bot's profile config
                const configPath = path.join(process.cwd(), 'database', 'bot_config.json');
                let botConfig = {};
                if (fs.existsSync(configPath)) {
                    botConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                }
                botConfig.lastProfileUpdate = timestamp;
                botConfig.profileHistory = botConfig.profileHistory || [];
                botConfig.profileHistory.push({
                    timestamp: timestamp,
                    source: imageSource,
                    size: optimizedBuffer.length,
                    path: historyFile
                });
                
                // Keep only last 10 updates
                if (botConfig.profileHistory.length > 10) {
                    const oldest = botConfig.profileHistory.shift();
                    if (fs.existsSync(oldest.path)) {
                        fs.unlinkSync(oldest.path);
                    }
                }
                
                fs.writeFileSync(configPath, JSON.stringify(botConfig, null, 2));
                
                // Send success message with preview
                const caption = `✅ *Profile Picture Updated Successfully!*\n\n` +
                               `👑 *Updated by:* @${m.sender.split('@')[0]}\n` +
                               `📸 *Source:* ${imageSource}\n` +
                               `📏 *Original Size:* ${(imageBuffer.length / 1024).toFixed(2)} KB\n` +
                               `🎨 *Optimized Size:* ${(optimizedBuffer.length / 1024).toFixed(2)} KB\n` +
                               `🖼️ *Format:* ${fileType.mime.toUpperCase()}\n` +
                               `⏰ *Time:* ${new Date().toLocaleString()}\n\n` +
                               `💡 *Tip:* Use ${prefix}getpp to view current profile picture\n` +
                               `🔄 *Rollback:* Use ${prefix}rollbackpp to restore previous version`;
                
                await sock.sendMessage(m.chat, {
                    image: optimizedBuffer,
                    caption: caption,
                    mentions: [m.sender]
                }, { quoted: m });
                
                // Clear processing message
                processingMsg(`✅ *Profile picture updated successfully!*`);
                
            } catch (updateError) {
                console.error('Profile picture update error:', updateError);
                
                // Handle specific errors
                if (updateError.message.includes('not-authorized')) {
                    return m.reply(`❌ *Authorization Error:* Bot is not authorized to change profile picture. Please check your authentication.`);
                } else if (updateError.message.includes('image-size')) {
                    return m.reply(`❌ *Image Size Error:* The image is too large. Please use an image under 640x640 pixels.`);
                } else {
                    return m.reply(`❌ *Update Failed:* ${updateError.message}\n\nPlease try with a different image.`);
                }
            }
            
        } catch (error) {
            console.error('Setpp plugin error:', error);
            m.reply(`❌ *Error:* ${error.message}\n\nPlease check the image format and try again.`);
        }
    }
};

/**
 * Convert stream to buffer
 */
async function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}

/**
 * Download image from URL
 */
async function downloadImage(url) {
    try {
        const response = await axios.get(url, { 
            responseType: 'arraybuffer',
            timeout: 30000
        });
        return Buffer.from(response.data);
    } catch (error) {
        throw new Error(`Failed to download image: ${error.message}`);
    }
}

/**
 * Optimize profile picture for WhatsApp
 * WhatsApp requirements: max 640x640, compress to reduce size
 */
async function optimizeProfilePicture(buffer) {
    try {
        // Get image metadata
        const metadata = await sharp(buffer).metadata();
        
        // Calculate new dimensions (max 640x640)
        let width = metadata.width;
        let height = metadata.height;
        
        if (width > 640 || height > 640) {
            const ratio = Math.min(640 / width, 640 / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }
        
        // Optimize and compress
        let optimized = sharp(buffer)
            .resize(width, height, {
                fit: 'cover',
                position: 'centre'
            })
            .jpeg({ quality: 85, progressive: true })
            .toFormat('jpeg');
        
        const optimizedBuffer = await optimized.toBuffer();
        
        // If still too large (> 1MB), compress more
        if (optimizedBuffer.length > 1024 * 1024) {
            optimized = sharp(optimizedBuffer)
                .jpeg({ quality: 70, progressive: true });
            return await optimized.toBuffer();
        }
        
        return optimizedBuffer;
    } catch (error) {
        console.error('Optimization error:', error);
        return buffer; // Return original if optimization fails
    }
}
