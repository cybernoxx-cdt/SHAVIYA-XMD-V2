const { cmd } = require("../command");

// ── Random Premium Emoji Reactions ──
const reactions = ["👑","💎","🔥","⚡","🌟","✨","🎬","🚀","💫","🎭","🏆","🎯","💠","🌈","🎪"];
const randomReact = () => reactions[Math.floor(Math.random() * reactions.length)];

cmd({
    pattern: "menu",
    alias: ["panel", "help"],
    desc: "Show interactive premium menu",
    category: "main",
    react: "👑",
    filename: __filename
},
async (conn, mek, m, { from, pushname, reply, sessionId }) => {
    try {
        const name = m.pushName || pushname || "User";
        const posterUrl = "https://files.catbox.moe/f18ceb.jpg";

        // ── Auto react on .menu command ──
        await conn.sendMessage(from, {
            react: { text: randomReact(), key: mek.key }
        });

        const menuCaption = `
╔▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄╗
▌  👑 *𝗦𝗛𝗔𝗩𝗜𝗬𝗔-𝗫𝗠𝗗 𝗩𝟮* 👑  ▐
╚▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀╝
┃
┃  🎭 *User*    ➠ ${name}
┃  🎬 *Engine*  ➠ Movie Bot  
┃  🧩 *Prefix*  ➠ [ . ]
┃  💎 *Version* ➠ V2 · 2026
┃  ⚡ *Status*  ➠ Online ✅
┃
╭━━〔 💠 *SELECT CATEGORY* 💠 〕━━⊷
┃
┃  ➊  📥  *Download Menu*
┃  ➋  🎬  *Movie Hub Menu*
┃  ➌  🤖  *AI & Tools Menu*
┃  ➍  👥  *Group Menu*
┃  ➎  ⚙️   *Settings Menu*
┃  ➏  💎  *Access Control*
┃  ➐  👑  *Owner Menu*
┃  ➑  ⚡  *System Menu*
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━⊷
_💡 Reply with number  1 - 8_
_⏳ Menu expires in 5 minutes_
> ✨ *SHAVIYA TECH · PREMIUM EDITION*`;

        const FakeVCard = {
            key: {
                fromMe: false,
                participant: "0@s.whatsapp.net",
                remoteJid: "status@broadcast"
            },
            message: {
                contactMessage: {
                    displayName: "💎 𝗦𝗛𝗔𝗩𝗜𝗬𝗔-𝗫𝗠𝗗 𝗩𝟮 𝗣𝗥𝗘𝗠𝗜𝗨𝗠",
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:SHAVIYA-XMD V2\nORG:SHAVIYA TECH;\nTEL;type=CELL;type=VOICE;waid=13135550002:+13135550002\nEND:VCARD`
                }
            }
        };

        const contextInfo = {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363421386030144@newsletter',
                newsletterName: "👑 SHAVIYA-XMD V2 PREMIUM",
                serverMessageId: 143
            }
        };

        // ── Send Main Menu (button on/off aware) ──
        const menuButtons = [
            { id: "1", text: "📥 Download Menu" },
            { id: "2", text: "🎬 Movie Hub Menu" },
            { id: "3", text: "🤖 AI & Tools Menu" },
            { id: "4", text: "👥 Group Menu" },
            { id: "5", text: "⚙️ Settings Menu" },
            { id: "6", text: "💎 Access Control" },
            { id: "7", text: "👑 Owner Menu" },
            { id: "8", text: "⚡ System Menu" }
        ];

        let sentMsg;
        try {
            sentMsg = await global.sendInteractiveButtons(conn, from, {
                header: "👑 SHAVIYA-XMD V2",
                body: menuCaption,
                footer: "✨ SHAVIYA TECH · PREMIUM EDITION",
                buttons: menuButtons,
                _sessionId: sessionId
            }, FakeVCard);
        } catch (e) {
            sentMsg = await conn.sendMessage(from,
                { text: menuCaption, contextInfo: contextInfo },
                { quoted: FakeVCard }
            );
        }

        const messageID = sentMsg.key.id;

        // ══════════════════════════════════════════
        //           ALL CATEGORY MENUS
        // ══════════════════════════════════════════
        const menuData = {

            // ───────────────────────────────────────
            '1': {
                content: `╔▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄╗
▌    📥 *𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗 𝗠𝗘𝗡𝗨* 📥    ▐
╚▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀╝
┃
╭─〔 🎵 *Music & Video* 〕────⊷
┃▸ .song      ➠ YT Song Download
┃  ↳ _audio, play_
┃▸ .video     ➠ YT Video Download
┃  ↳ _ytv, ytdown_
┃▸ .tiktok    ➠ TikTok Download
┃  ↳ _tt, ttdl_
┃▸ .fb        ➠ Facebook Download
┃  ↳ _fbdl, facebook_
╰─────────────────────────────⊷
╭─〔 📦 *File Downloads* 〕───⊷
┃▸ .apk       ➠ APK Download
┃  ↳ _android, af_
┃▸ .gdrive    ➠ Google Drive DL
┃  ↳ _gd_
┃▸ .mega      ➠ Mega Download
┃▸ .download  ➠ Universal Download
┃  ↳ _downurl_
┃▸ .ud        ➠ UsersDrive Download
┃  ↳ _usersdrive, udrive_
┃▸ .img2url   ➠ Image to URL
┃  ↳ _imgurl2, url2, geturl2_
╰─────────────────────────────⊷
> ✨ *SHAVIYA TECH · PREMIUM EDITION*`
            },

            // ───────────────────────────────────────
            '2': {
                content: `╔▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄╗
▌   🎬 *𝗠𝗢𝗩𝗜𝗘 𝗛𝗨𝗕 𝗠𝗘𝗡𝗨* 🎬   ▐
╚▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀╝
┃
╭─〔 🌐 *Movie Sites* 〕──────⊷
┃▸ .movie      ➠ Main Movie
┃  ↳ _movie5_
┃▸ .cinetv     ➠ CineTV Movies
┃  ↳ _movie, cinesubz_
┃▸ .cinesubz   ➠ CineSubz Movies
┃▸ .pirate     ➠ Pirate Movies
┃▸ .piratelk   ➠ PirateLK Movies
┃▸ .dinka      ➠ Dinka Movies
┃  ↳ _dk, movie1_
┃▸ .sinhalasub ➠ Sinhala Sub
┃▸ .moviesub   ➠ MovieSub
┃  ↳ _ms, submovie_
┃▸ .moviesublk ➠ MovieSubLK
┃  ↳ _msub_
┃▸ .pupilmv    ➠ PupilMV
┃  ↳ _pupil_
┃▸ .baiscope   ➠ Baiscope Movies
┃▸ .lakvision  ➠ LakVision TV
┃  ↳ _laktv, lk, lakmovie_
┃▸ .sayura     ➠ Sayura Cinema
┃  ↳ _sc, movie8_
┃▸ .anime      ➠ SL Anime Club
┃  ↳ _ac2, movie2_
┃▸ .cinejid    ➠ Cine Group JID
╰─────────────────────────────⊷
╭─〔 🔞 *Adult Downloads* 〕──⊷
┃▸ .pornhub  ┃▸ .xhamster
┃▸ .xvideos  ┃▸ .xnxx
╰─────────────────────────────⊷
> ✨ *SHAVIYA TECH · PREMIUM EDITION*`
            },

            // ───────────────────────────────────────
            '3': {
                content: `╔▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄╗
▌  🤖 *𝗔𝗜 & 𝗧𝗢𝗢𝗟𝗦 𝗠𝗘𝗡𝗨* 🤖  ▐
╚▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀╝
┃
╭─〔 🤖 *AI Power* 〕─────────⊷
┃▸ .ai        ➠ AI Assistant
┃▸ .text2img  ➠ Text to Image
┃  ↳ _genimg, imagine_
╰─────────────────────────────⊷
╭─〔 🧰 *Tools* 〕────────────⊷
┃▸ .jid       ➠ Get JID
┃▸ .getpp     ➠ Get Profile Picture
┃▸ .vv        ➠ View Once Open
┃  ↳ _viewonce, retrieve_
┃▸ .forward   ➠ Forward Message
┃  ↳ _fw, fwd_
┃▸ .send      ➠ Send / Save Status
┃  ↳ _sendme, save_
┃▸ .trt       ➠ Translate Text
┃  ↳ _translate_
┃▸ .tts       ➠ Text to Speech v1
┃▸ .tts2      ➠ Text to Speech v2
┃▸ .tts3      ➠ Text to Speech v3
┃▸ .sss       ➠ Screenshot Website
┃▸ .creact    ➠ Mass React
┃  ↳ _massreact, chr_
╰─────────────────────────────⊷
> ✨ *SHAVIYA TECH · PREMIUM EDITION*`
            },

            // ───────────────────────────────────────
            '4': {
                content: `╔▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄╗
▌     👥 *𝗚𝗥𝗢𝗨𝗣 𝗠𝗘𝗡𝗨* 👥     ▐
╚▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀╝
┃
╭─〔 👤 *Member Control* 〕──⊷
┃▸ .add        ➠ Add Member
┃  ↳ _a, invite_
┃▸ .kick       ➠ Kick Member
┃▸ .kickall    ➠ Kick All Members
┃▸ .promote    ➠ Promote to Admin
┃▸ .demote     ➠ Demote Admin
┃▸ .admins     ➠ List All Admins
┃▸ .user info  ➠ Member Profile
┃  ↳ _user, profile_
╰─────────────────────────────⊷
╭─〔 📢 *Tag & Mention* 〕────⊷
┃▸ .tagall     ➠ Tag All Members
┃  ↳ _mentionall, everyone_
┃▸ .tagadmin   ➠ Tag All Admins
┃  ↳ _tagadmins_
┃▸ .hidetag    ➠ Silent Tag All
╰─────────────────────────────⊷
╭─〔 🔧 *Group Settings* 〕───⊷
┃▸ .mute       ➠ Mute Group
┃▸ .unmute     ➠ Unmute Group
┃▸ .lock       ➠ Lock Settings
┃▸ .unlock     ➠ Unlock Settings
┃▸ .gname      ➠ Change Group Name
┃▸ .groupdesc  ➠ Change Description
┃▸ .setsubject ➠ Change Subject
┃▸ .groupinfo  ➠ Group Info
┃▸ .grouplink  ➠ Get Invite Link
┃▸ .getpic     ➠ Group Profile Pic
╰─────────────────────────────⊷
╭─〔 📋 *Requests & Polls* 〕─⊷
┃▸ .requests   ➠ View Join Requests
┃▸ .accept     ➠ Accept Request(s)
┃▸ .reject     ➠ Reject Request(s)
┃▸ .approve    ➠ Auto Approve +94
┃▸ .poll       ➠ Create Poll
╰─────────────────────────────⊷
╭─〔 ⏱️ *Extra Controls* 〕───⊷
┃▸ .opentime   ➠ Open After Time
┃▸ .closetime  ➠ Close After Time
┃▸ .del        ➠ Delete Message
┃▸ .rank       ➠ User Rank / XP
┃▸ .setwelcome ➠ Set Welcome Msg
┃▸ .setgoodbye ➠ Set Goodbye Msg
╰─────────────────────────────⊷
> ✨ *SHAVIYA TECH · PREMIUM EDITION*`
            },

            // ───────────────────────────────────────
            '5': {
                content: `╔▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄╗
▌    ⚙️  *𝗦𝗘𝗧𝗧𝗜𝗡𝗚𝗦 𝗠𝗘𝗡𝗨* ⚙️   ▐
╚▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀╝
┃
╭─〔 🎬 *Doc Settings* 〕─────⊷
┃▸ .setfooter  ➠ Set Bot Footer
┃  ↳ _botname_
┃▸ .setthumb   ➠ Set Thumbnail URL
┃  ↳ _thumburl_
┃▸ .setprefix  ➠ Set Caption Prefix
┃  ↳ _docprefix_
┃▸ .setfname   ➠ Set File Name Prefix
┃▸ .moviedoc   ➠ Movie Poster as Thumb
┃  ↳ _on / off_
╰─────────────────────────────⊷
╭─〔 🛡️ *Protection* 〕───────⊷
┃▸ .antidelete ➠ Anti Delete Msgs
┃  ↳ _antidel | on / off_
┃▸ .button     ➠ Button Mode Toggle
┃  ↳ _btnmode | on / off_
╰─────────────────────────────⊷
> ✨ *SHAVIYA TECH · PREMIUM EDITION*`
            },

            // ───────────────────────────────────────
            '6': {
                content: `╔▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄╗
▌   💎 *𝗔𝗖𝗖𝗘𝗦𝗦 𝗖𝗢𝗡𝗧𝗥𝗢𝗟* 💎   ▐
╚▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀╝
┃
╭─〔 🔐 *Bot Mode* 〕─────────⊷
┃▸ .setmode       ➠ Set Bot Mode
┃  ↳ _alias: mode_
┃  ↳ _public / private_
┃  ↳ _inbox / group_
┃  ↳ _premium / privatepremium_
┃▸ .mymode        ➠ Check Current Mode
┃  ↳ _botmode_
╰─────────────────────────────⊷
╭─〔 💎 *Premium Users* 〕────⊷
┃▸ .addpremium    ➠ Add Premium User
┃  ↳ _ap_
┃  ↳ _Ex: .addpremium 94712345678_
┃▸ .removepremium ➠ Remove Premium
┃  ↳ _rp, delpremium_
┃▸ .premiumlist   ➠ List Premium Users
┃  ↳ _plist_
╰─────────────────────────────⊷
╭─〔 🔑 *Sudo Users* 〕───────⊷
┃▸ .addsudo       ➠ Add Sudo User
┃  ↳ _setsudo, sudoadd_
┃▸ .removesudo    ➠ Remove Sudo
┃  ↳ _delsudo, unsudo_
┃▸ .sudolist      ➠ List Sudo Users
┃  ↳ _listsudo, sudo_
┃▸ .mysudo        ➠ My Sudo Status
┃  ↳ _sudostatus, amIsudo_
╰─────────────────────────────⊷
> ✨ *SHAVIYA TECH · PREMIUM EDITION*`
            },

            // ───────────────────────────────────────
            '7': {
                content: `╔▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄╗
▌     👑 *𝗢𝗪𝗡𝗘𝗥 𝗠𝗘𝗡𝗨* 👑     ▐
╚▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀╝
┃
╭─〔 👑 *Owner Commands* 〕──⊷
┃▸ .owner      ➠ Owner Info
┃▸ .block      ➠ Block User
┃▸ .unblock    ➠ Unblock User
┃▸ .pair       ➠ Get Session Code
┃  ↳ _code, login, session_
┃▸ .restart    ➠ Restart Bot
┃  ↳ _reboot, rst_
╰─────────────────────────────⊷
> ✨ *SHAVIYA TECH · PREMIUM EDITION*`
            },

            // ───────────────────────────────────────
            '8': {
                content: `╔▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄╗
▌     ⚡ *𝗦𝗬𝗦𝗧𝗘𝗠 𝗠𝗘𝗡𝗨* ⚡     ▐
╚▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀╝
┃
╭─〔 ⚡ *System Commands* 〕──⊷
┃▸ .alive   ➠ Bot Alive Check
┃▸ .ping    ➠ Bot Ping v1
┃▸ .ping2   ➠ Bot Ping v2
┃▸ .system  ➠ System Stats
┃  ↳ _status, botinfo_
┃▸ .menu    ➠ Show This Menu
┃  ↳ _panel, help_
╰─────────────────────────────⊷
> ✨ *SHAVIYA TECH · PREMIUM EDITION*`
            }
        };

        // ══════════════════════════════════════════
        //            REPLY LISTENER
        // ══════════════════════════════════════════
        const handler = async (msgData) => {
            try {
                const receivedMsg = msgData.messages[0];
                if (!receivedMsg?.message || !receivedMsg.key?.remoteJid) return;

                const isReplyToMenu = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
                if (!isReplyToMenu) return;

                const receivedText = (
                    receivedMsg.message.conversation ||
                    receivedMsg.message.extendedTextMessage?.text || ""
                ).trim();

                const senderID = receivedMsg.key.remoteJid;

                // ── Random emoji react on every reply ──
                await conn.sendMessage(senderID, {
                    react: { text: randomReact(), key: receivedMsg.key }
                });

                if (menuData[receivedText]) {
                    try {
                        await conn.sendMessage(senderID, {
                            image: { url: posterUrl },
                            caption: menuData[receivedText].content,
                            contextInfo: contextInfo
                        }, { quoted: FakeVCard });
                    } catch (e) {
                        await conn.sendMessage(senderID,
                            { text: menuData[receivedText].content, contextInfo: contextInfo },
                            { quoted: FakeVCard }
                        );
                    }
                } else {
                    await conn.sendMessage(senderID, {
                        text: `╔▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄╗\n▌  ❌ *INVALID OPTION* ❌  ▐\n╚▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀╝\n\n_Reply with a number 1 - 8_\n\n➊ 📥 Download\n➋ 🎬 Movie Hub\n➌ 🤖 AI & Tools\n➍ 👥 Group\n➎ ⚙️ Settings\n➏ 💎 Access Control\n➐ 👑 Owner\n➑ ⚡ System\n\n> ✨ *SHAVIYA TECH · PREMIUM*`,
                        contextInfo: contextInfo
                    }, { quoted: FakeVCard });
                }

            } catch (e) {
                console.log('[MENU HANDLER ERROR]:', e);
            }
        };

        conn.ev.on("messages.upsert", handler);

        // ── Auto remove listener after 5 minutes ──
        setTimeout(() => {
            conn.ev.off("messages.upsert", handler);
        }, 300000);

    } catch (e) {
        console.error('[MENU ERROR]:', e);
        reply("❌ Menu එක පෙන්වීමේදී දෝෂයක් සිදු විය.");
    }
});
