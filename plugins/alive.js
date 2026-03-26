const config = require('../config');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const axios = require('axios');
const os = require("os");
const fs = require('fs');
const path = require('path');

const fakevCard = {
    key: {
        fromMe: false,
        participant: "0@s.whatsapp.net",
        remoteJid: "status@broadcast"
    },
    message: {
        contactMessage: {
            displayName: "© SHAVIYA TECH",
            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:SHAVIYA-XMD V2\nORG:SHAVIYA TECH;\nTEL;type=CELL;type=VOICE;waid=94707085822:+94707085822\nEND:VCARD`
        }
    }
};

// Voice note MP3 URL
const VOICE_NOTE_URL = "https://files.catbox.moe/w9r46m.mp3";

cmd({
    pattern: "alive",
    alias: ["hyshavi", "shavi", "status", "a"],
    react: "🌝",
    desc: "Check bot online or no.",
    category: "main",
    filename: __filename
},
async (robin, mek, m, {
    from, pushname, quoted, reply, sender
}) => {
    try {
        await robin.sendPresenceUpdate('recording', from);

        // Get Sri Lankan Date & Time
        const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo', hour12: true });
        const date = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' });
        const time = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo' });

        // Stylish Alive Caption
        const status = `👋 𝐇𝐞𝐥𝐥𝐨 ${pushname}, 𝐈 𝐚𝐦 𝐚𝐥𝐢𝐯𝐞 𝐧𝐨𝐰 !!

*╭─〔 DATE & TIME INFO 〕─◉*
*│*📅 *\`Date:\`* ${date}
*│*⏰ *\`Time:\`* ${time}
*╰────────────⊷*

*╭─〔 ALIVE STATUS INFO 〕─◉*
*│*
*│*🐼 *\`Bot\`*: 𝐒𝐇𝐀𝐕𝐈𝐘𝐀-𝐗𝐌𝐃-𝐕2
*│*🤵‍♂ *\`Owner\`*: Savendra Dampriya
*│*👤 *\`User\`*: ${pushname}
*│*📟 *\`Uptime\`*: ${runtime(process.uptime())}
*│*⏳ *\`Ram\`*: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${(os.totalmem() / 1024 / 1024).toFixed(2)}MB
*│*🖊 *\`Prefix\`*: [ ${config.PREFIX} ]
*│*🛠 *\`Mode\`*: [ ${config.MODE} ]
*│*🖥 *\`Host\`*: ${os.hostname()}
*│*🌀 *\`Version\`*: ${config.BOT_VERSION}
*╰────────────────⊷*
     
      ☘ ʙᴏᴛ ᴍᴇɴᴜ  - .menu
      🔥 ʙᴏᴛ ꜱᴘᴇᴇᴅ - .ping

> © Powered by 𝗦𝗛𝗔𝗩𝗜𝗬𝗔-𝗫𝗠𝗗 𝗩𝟰 💲`;

        // Send Image + Caption first
        await robin.sendMessage(from, {
            image: {
                url: "https://files.catbox.moe/s1pn69.jpg"
            },
            caption: status,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: false
            }
        }, { quoted: mek });

        // ============================================
        // VOICE NOTE - Download from URL and Send
        // ============================================
        try {
            // Create temp directory if not exists
            const tmpDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
            }
            
            // Download voice note from URL
            console.log('[ALIVE] Downloading voice note...');
            const response = await axios.get(VOICE_NOTE_URL, {
                responseType: 'arraybuffer',
                timeout: 30000
            });
            
            const voiceBuffer = Buffer.from(response.data);
            const voicePath = path.join(tmpDir, `voice_${Date.now()}.mp3`);
            
            // Save voice file
            fs.writeFileSync(voicePath, voiceBuffer);
            
            console.log(`[ALIVE] Voice note downloaded: ${(voiceBuffer.length / 1024).toFixed(2)}KB`);
            
            // Send as voice note (PTT - Push to Talk)
            await robin.sendMessage(from, {
                audio: fs.readFileSync(voicePath),
                mimetype: 'audio/mpeg',
                ptt: true,  // This makes it a voice note
                waveform: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // Optional: waveform for voice note
            }, { quoted: fakevCard });
            
            // Clean up temp file
            fs.unlinkSync(voicePath);
            
            console.log('[ALIVE] Voice note sent successfully');
            
        } catch (voiceErr) {
            console.error('[ALIVE] Voice note error:', voiceErr.message);
            
            // Fallback: Try to send a simple beep if voice note fails
            try {
                const ffmpeg = require('fluent-ffmpeg');
                const tmpDir = path.join(__dirname, '../temp');
                const outPath = path.join(tmpDir, `beep_${Date.now()}.opus`);
                
                await new Promise((resolve, reject) => {
                    ffmpeg()
                        .input('sine=frequency=440:duration=1')
                        .inputFormat('lavfi')
                        .audioCodec('libopus')
                        .format('opus')
                        .on('end', resolve)
                        .on('error', reject)
                        .save(outPath);
                });
                
                await robin.sendMessage(from, {
                    audio: fs.readFileSync(outPath),
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true
                }, { quoted: fakevCard });
                
                fs.unlinkSync(outPath);
            } catch (fallbackErr) {
                console.log('[ALIVE] Fallback voice note failed:', fallbackErr.message);
            }
        }

    } catch (e) {
        console.log("Alive Error:", e);
        reply(`⚠️ Error: ${e.message}`);
    }
});
