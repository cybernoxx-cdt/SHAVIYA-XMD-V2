// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SHAVIYA-XMD | Location Plugin
// CMD: .location <place/address>
//      .mylocation (user replies with their WA live location)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import fetch from 'node-fetch'

// ── Search location by name / address ──────────────────────────────────────
const handler = async (m, { conn, args, usedPrefix, command }) => {

  // ── Handle incoming live location from user ──────────────────────────────
  if (m.message?.liveLocationMessage || m.message?.locationMessage) {
    const loc = m.message.liveLocationMessage || m.message.locationMessage
    const lat  = loc.degreesLatitude
    const lon  = loc.degreesLongitude
    const name = loc.name || 'Your Location'
    const addr = loc.address || ''

    const gmaps = `https://maps.google.com/?q=${lat},${lon}`
    const text  = `
╔══════════════════════════╗
║  📍 *SHAVIYA-XMD | LOCATION*  ║
╚══════════════════════════╝

🗺️ *Name:*       ${name}
📌 *Address:*    ${addr || 'N/A'}
🌐 *Latitude:*   ${lat}
🌐 *Longitude:*  ${lon}

🔗 *Google Maps:*
${gmaps}

> 🤖 *Sʜᴀᴠɪʏᴀ-Xᴍᴅ* | Location Tools
`.trim()

    return conn.sendMessage(m.chat, { text }, { quoted: m })
  }

  // ── Search by text query ──────────────────────────────────────────────────
  const query = args.join(' ').trim()

  if (!query) {
    return m.reply(
      `❌ *Usage:*\n\n` +
      `🔍 Search: *${usedPrefix}${command} <place name>*\n` +
      `📍 Live:   Send your WhatsApp Live Location to get the Maps link\n\n` +
      `📌 *Examples:*\n` +
      `• ${usedPrefix}${command} Colombo Fort\n` +
      `• ${usedPrefix}${command} Kandy Temple of Tooth\n` +
      `• ${usedPrefix}${command} Galle Face Green Colombo\n\n` +
      `> 🇱🇰 Works for any location worldwide`
    )
  }

  await m.reply('⏳ Searching location...')

  try {
    // Nominatim OpenStreetMap – free, no key needed
    const encoded = encodeURIComponent(query)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&addressdetails=1`,
      { headers: { 'User-Agent': 'SHAVIYA-XMD-Bot/1.0' } }
    )

    if (!res.ok) throw new Error('Nominatim API error')

    const data = await res.json()

    if (!data || data.length === 0) {
      return m.reply(`❌ Location not found for: *${query}*\nTry a more specific name.`)
    }

    const place  = data[0]
    const lat    = parseFloat(place.lat).toFixed(6)
    const lon    = parseFloat(place.lon).toFixed(6)
    const name   = place.display_name
    const addr   = place.address
    const type   = place.type || place.class || 'place'

    // Build address parts
    const city    = addr?.city || addr?.town || addr?.village || addr?.county || ''
    const state   = addr?.state || ''
    const country = addr?.country || ''
    const postcode= addr?.postcode || ''

    const gmaps   = `https://maps.google.com/?q=${lat},${lon}`
    const osmLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`

    const text = `
╔══════════════════════════╗
║  🗺️ *SHAVIYA-XMD | LOCATION*  ║
╚══════════════════════════╝

📌 *Place:*
${name}

━━━━━━━━━━━━━━━━━━━━━
🏙️ *City/Town:*   ${city || 'N/A'}
🏛️ *State:*       ${state || 'N/A'}
🌍 *Country:*     ${country || 'N/A'}
📮 *Postcode:*    ${postcode || 'N/A'}
🏷️ *Type:*        ${type}

━━━━━━━━━━━━━━━━━━━━━
📐 *Coordinates*
🌐 *Latitude:*    ${lat}
🌐 *Longitude:*   ${lon}

━━━━━━━━━━━━━━━━━━━━━
🔗 *Links*
📍 Google Maps:
${gmaps}

🗺️ OpenStreetMap:
${osmLink}

> 🤖 *Sʜᴀᴠɪʏᴀ-Xᴍᴅ* | Location Tools
`.trim()

    // Send text + location card together
    await conn.sendMessage(m.chat, { text }, { quoted: m })

    // Also send as WhatsApp location pin
    await conn.sendMessage(m.chat, {
      location: {
        degreesLatitude:  parseFloat(lat),
        degreesLongitude: parseFloat(lon),
        name:  query,
        address: `${city}${state ? ', ' + state : ''}${country ? ', ' + country : ''}`
      }
    })

  } catch (e) {
    m.reply(`❌ Error: ${e.message}\nTry again or check your query.`)
  }
}

handler.help    = ['location <place>', 'mylocation']
handler.tags    = ['tools']
handler.command = /^(location|loc|findlocation|getlocation|maps)$/i

export default handler
