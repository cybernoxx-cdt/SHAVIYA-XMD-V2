// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SHAVIYA-XMD | Number Info Plugin
// CMD: .numinfo <number>
// Sri Lanka Numbers Only
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import fetch from 'node-fetch'

// Sri Lanka carrier prefix map (07X series)
const SL_CARRIERS = {
  '070': { name: 'Mobitel', type: 'Mobile', sim: 'Sri Lanka Telecom Mobitel' },
  '071': { name: 'Mobitel', type: 'Mobile', sim: 'Sri Lanka Telecom Mobitel' },
  '072': { name: 'Hutch',   type: 'Mobile', sim: 'Hutchison Telecommunications Lanka' },
  '074': { name: 'Hutch',   type: 'Mobile', sim: 'Hutchison Telecommunications Lanka' },
  '075': { name: 'Airtel',  type: 'Mobile', sim: 'Airtel Lanka' },
  '076': { name: 'Airtel',  type: 'Mobile', sim: 'Airtel Lanka' },
  '077': { name: 'Dialog',  type: 'Mobile', sim: 'Dialog Axiata PLC' },
  '078': { name: 'Hutch',   type: 'Mobile', sim: 'Hutchison Telecommunications Lanka' },
  '079': { name: 'Dialog',  type: 'Mobile', sim: 'Dialog Axiata PLC' },
  '010': { name: 'Dialog',  type: 'Mobile', sim: 'Dialog Axiata PLC' },
  '011': { name: 'Dialog Landline', type: 'Landline', sim: 'Dialog Axiata (Colombo Landline)' },
  '038': { name: 'SLT Landline', type: 'Landline', sim: 'Sri Lanka Telecom (Regional)' },
}

// Province map from area code
const SL_REGIONS = {
  '011': 'Colombo District',
  '038': 'Kalutara District',
  '081': 'Kandy District',
  '025': 'Anuradhapura District',
  '027': 'Polonnaruwa District',
  '055': 'Badulla District',
  '047': 'Hambantota District',
  '041': 'Matara District',
  '091': 'Galle District',
  '037': 'Kurunegala District',
  '031': 'Gampaha District',
  '032': 'Puttalam District',
  '066': 'Matale District',
  '052': 'Nuwara Eliya District',
  '026': 'Trincomalee District',
  '065': 'Batticaloa District',
  '067': 'Ampara District',
  '021': 'Jaffna District',
  '024': 'Vavuniya District',
  '023': 'Mannar District',
  '045': 'Ratnapura District',
  '057': 'Kegalle District',
  '051': 'Hatton / Nuwara Eliya',
}

function normalizeLKNumber(input) {
  let n = input.replace(/[\s\-\+\(\)]/g, '')
  if (n.startsWith('94')) n = '0' + n.slice(2)
  if (!n.startsWith('0')) n = '0' + n
  return n
}

function isValidLK(n) {
  return /^0[1-9][0-9]{8}$/.test(n)
}

function getCarrierInfo(n) {
  const prefix3 = n.slice(0, 3)
  return SL_CARRIERS[prefix3] || { name: 'Unknown Carrier', type: 'Unknown', sim: 'Unknown Operator' }
}

function getRegion(n) {
  const prefix3 = n.slice(0, 3)
  return SL_REGIONS[prefix3] || 'Sri Lanka'
}

function formatDisplay(n) {
  // 07X XXXXXXX  or  0XX XXXXXXX
  return n.replace(/^(0\d{2})(\d{3})(\d{4})$/, '$1 $2 $3')
}

function intlFormat(n) {
  return '+94' + n.slice(1)
}

const handler = async (m, { conn, args, usedPrefix, command }) => {
  let input = args[0]

  if (!input) {
    // Try mentioned JID
    if (m.mentionedJid && m.mentionedJid.length > 0) {
      input = m.mentionedJid[0].replace('@s.whatsapp.net', '')
    } else if (m.quoted?.sender) {
      input = m.quoted.sender.replace('@s.whatsapp.net', '')
    }
  }

  if (!input) {
    return m.reply(
      `❌ *Usage:* ${usedPrefix}${command} <number>\n\n` +
      `📌 *Example:*\n` +
      `• ${usedPrefix}${command} 0771234567\n` +
      `• ${usedPrefix}${command} 94771234567\n\n` +
      `> 🇱🇰 Sri Lanka numbers only`
    )
  }

  const normalized = normalizeLKNumber(input)

  if (!isValidLK(normalized)) {
    return m.reply(
      `❌ *Invalid number!*\n\n` +
      `Only Sri Lanka (🇱🇰) mobile/landline numbers are supported.\n` +
      `Format: 07XXXXXXXX or 94XXXXXXXXX`
    )
  }

  const carrier = getCarrierInfo(normalized)
  const region  = getRegion(normalized)
  const display = formatDisplay(normalized)
  const intl    = intlFormat(normalized)

  // Try numverify API (free, no key needed for basic)
  let apiStatus = '⚠️ API not checked'
  let lineType  = carrier.type
  let apiCarrier = carrier.name

  try {
    const res = await fetch(
      `https://phonevalidation.abstractapi.com/v1/?api_key=FREE_TIER&phone=${intl}`
    )
    // If API available, enrich data
    if (res.ok) {
      const data = await res.json()
      if (data && data.valid !== undefined) {
        apiStatus  = data.valid ? '✅ Valid & Active' : '❌ Invalid'
        lineType   = data.type || lineType
        apiCarrier = data.carrier || apiCarrier
      }
    }
  } catch (_) {
    // Silently fallback to local data — no crash
  }

  const reply = `
╔══════════════════════════╗
║  📱 *SHAVIYA-XMD | NUM INFO*  ║
╚══════════════════════════╝

📞 *Number:*        ${display}
🌐 *Intl Format:*   ${intl}
✅ *Status:*        ${apiStatus}

━━━━━━━━━━━━━━━━━━━━━
📡 *Carrier Info*
━━━━━━━━━━━━━━━━━━━━━
🏢 *Network:*       ${carrier.name}
🔖 *SIM Owner:*     ${carrier.sim}
📶 *Line Type:*     ${lineType}

━━━━━━━━━━━━━━━━━━━━━
🗺️ *Location Info*
━━━━━━━━━━━━━━━━━━━━━
📍 *Region:*        ${region}
🌍 *Country:*       Sri Lanka 🇱🇰
🕐 *Timezone:*      Asia/Colombo (UTC+5:30)

━━━━━━━━━━━━━━━━━━━━━
> 🤖 *Sʜᴀᴠɪʏᴀ-Xᴍᴅ* | Number Intelligence
`.trim()

  await conn.sendMessage(m.chat, { text: reply }, { quoted: m })
}

handler.help    = ['numinfo <number>']
handler.tags    = ['tools']
handler.command = /^(numinfo|numdetails|numberinfo|siminfo)$/i

export default handler
