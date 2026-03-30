const { cmd } = require("../command");

// === Original .vv command (prefix) ===
cmd({
  pattern: "vv",
  alias: ["viewonce", "retrieve"],
  react: "🐳",
  desc: "Retrieve View Once",
  category: "tools",
  filename: __filename
}, async (conn, m, match) => {
  try {
    if (!m.quoted) return m.reply("🍁 Reply to a view once message!");
    const buffer = await m.quoted.download();
    const type = m.quoted.type;
    const target = m.sender;

    if (type === "imageMessage") {
      return conn.sendMessage(target, {
        image: buffer,
        caption: m.quoted.msg?.caption || ""
      });
    }

    if (type === "videoMessage") {
      return conn.sendMessage(target, {
        video: buffer,
        caption: m.quoted.msg?.caption || ""
      });
    }

    if (type === "audioMessage") {
      return conn.sendMessage(target, {
        audio: buffer,
        mimetype: "audio/mpeg",
        ptt: false
      });
    }

    return m.reply("❌ Unsupported message type.");

  } catch (err) {
    console.log(err);
    m.reply("❌ Failed to retrieve message.");
  }
});

// === Non-prefix triggers for vv, wtf, v, mokak ===
cmd({
  pattern: /^(vv|wtf|v|mokak)$/i,  // match any keyword
  react: null,                     // no reaction
  desc: "Retrieve View Once Non-Prefix",
  category: "tools",
  filename: __filename,
  nonPrefix: true                  // ⚡ non-prefix
}, async (conn, m, match) => {
  try {
    if (!m.quoted) return;         // silent if no reply
    const buffer = await m.quoted.download();
    const type = m.quoted.type;
    const target = m.sender;

    if (type === "imageMessage") {
      return conn.sendMessage(target, {
        image: buffer,
        caption: m.quoted.msg?.caption || ""
      });
    }

    if (type === "videoMessage") {
      return conn.sendMessage(target, {
        video: buffer,
        caption: m.quoted.msg?.caption || ""
      });
    }

    if (type === "audioMessage") {
      return conn.sendMessage(target, {
        audio: buffer,
        mimetype: "audio/mpeg",
        ptt: false
      });
    }

  } catch (err) {
    console.log(err);
    // Silent error to avoid detection
  }
});
