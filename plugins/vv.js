const { cmd } = require("../command");

// Helper function to handle view‑once retrieval
async function handleViewOnce(conn, m) {
  try {
    if (!m.quoted) return m.reply("🍁 Reply to a view‑once message!");

    const buffer = await m.quoted.download();
    const type = m.quoted.type;
    const target = m.sender; // send to the user who invoked the command

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
}

// Original .vv command (requires dot prefix, has reaction)
cmd({
  pattern: "vv",
  alias: ["viewonce", "retrieve"],
  react: "🐳",
  desc: "Retrieve View Once",
  category: "tools",
  filename: __filename
}, async (conn, m, match) => {
  await handleViewOnce(conn, m);
});

// Non‑prefix commands (no dot, no reaction)
const noPrefixCommands = ["wtf", "v", "s", "mokakd"];
for (const pattern of noPrefixCommands) {
  cmd({
    pattern: pattern,
    prefix: false,   // do not require a dot prefix
    desc: `Retrieve view‑once message (use without dot)`,
    category: "tools",
    filename: __filename
    // no react property → no reaction
  }, async (conn, m, match) => {
    await handleViewOnce(conn, m);
  });
}
