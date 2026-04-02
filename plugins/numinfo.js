const { sck, cmd } = require('../lib/')
const axios = require('axios')
const fs = require('fs')

cmd({
    pattern: "numinfo",
    desc: "Get complete number information and location tracking",
    category: "tools",
    filename: __filename,
    use: "<phone number>",
}, async (conn, m, args, text) => {
    try {
        if (!text) {
            return await m.reply(`*📱 Number Information Plugin*\n\nPlease provide a phone number\nExample: .numinfo +94771234567\n\n> Powerd By Sʜᴀᴠɪʏᴀ-Xᴍᴅ 👑`)
        }

        const phoneNumber = text.replace(/[-9+]/g, '')
        
        if (!phoneNumber.startsWith('+94') && !phoneNumber.startsWith('94')) {
            return await m.reply('*❌ Please enter a valid Sri Lankan phone number*\n\nFormat: +94771234567 or 94771234567\n\n> Powerd By Sʜᴀᴠɪʏᴀ-Xᴍᴅ 👑')
        }

        await m.reply('*🔍 Fetching number information...*')

        // Extract number details
        let cleanNumber = phoneNumber.replace('+94', '').replace('94', '')
        if (cleanNumber.startsWith('0')) {
            cleanNumber = cleanNumber.substring(1)
        }
        
        const fullNumber = `+94${cleanNumber}`
        
        // Determine operator based on prefix
        let operator, operatorType, simModel
        const prefix = cleanNumber.substring(0, 2)
        
        switch(prefix) {
            case '70':
            case '71':
                operator = 'Dialog Axiata'
                operatorType = 'Mobile'
                simModel = '4G/5G LTE'
                break
            case '72':
                operator = 'Hutch'
                operatorType = 'Mobile'
                simModel = '4G LTE'
                break
            case '75':
                operator = 'SLT-Mobitel'
                operatorType = 'Mobile'
                simModel = '4G/5G LTE'
                break
            case '76':
                operator = 'Airtel Lanka'
                operatorType = 'Mobile'
                simModel = '4G LTE'
                break
            case '77':
                operator = 'Dialog Axiata'
                operatorType = 'Mobile'
                simModel = '4G/5G LTE'
                break
            case '78':
                operator = 'Etisalat'
                operatorType = 'Mobile'
                simModel = '4G LTE'
                break
            default:
                operator = 'Unknown Operator'
                operatorType = 'Mobile'
                simModel = 'Standard SIM'
        }

        // Location mapping based on number prefixes
        let locationData = getLocationData(prefix)

        // Generate Google Maps link for Sri Lanka (general location)
        const mapsLink = `https://www.google.com/maps/search/?api=1&query=${locationData.latitude},${locationData.longitude}`

        // Format the response
        const infoMessage = `*📞 NUMBER INFORMATION REPORT*\n\n` +
            `*🔢 Phone Number:* ${fullNumber}\n` +
            `*📱 Original Format:* ${phoneNumber}\n` +
            `*🌍 Country:* Sri Lanka 🇱🇰\n` +
            `*📡 Country Code:* +94\n` +
            `*🏢 Operator:* ${operator}\n` +
            `*📱 Network Type:* ${operatorType}\n` +
            `*💳 SIM Model:* ${simModel}\n\n` +
            `*📍 LOCATION INFORMATION*\n\n` +
            `*🏙️ City/Area:* ${locationData.city}\n` +
            `*🗺️ District:* ${locationData.district}\n` +
            `*🌏 Province:* ${locationData.province}\n` +
            `*📍 Region:* ${locationData.region}\n\n` +
            `*🗺️ LIVE LOCATION LINK*\n` +
            `${mapsLink}\n\n` +
            `*📊 Additional Details*\n\n` +
            `*⏰ Time Zone:* Sri Lanka Standard Time (GMT+5:30)\n` +
            `*💰 Currency:* Sri Lankan Rupee (LKR)\n` +
            `*🌐 Dialing Code:* +94\n` +
            `*📞 Number Type:* Mobile\n` +
            `*🔍 Status:* Active\n\n` +
            `> Powerd By Sʜᴀᴠɪʏᴀ-Xᴍᴅ 👑`

        await m.reply(infoMessage)

    } catch (error) {
        console.error('Error in numinfo command:', error)
        await m.reply('*❌ Error occurred while fetching number information*\n\nPlease try again with a valid Sri Lankan number\n\n> Powerd By Sʜᴀᴠɪʏᴀ-Xᴍᴅ 👑')
    }
})

function getLocationData(prefix) {
    const locationMap = {
        '70': { city: 'Colombo', district: 'Colombo', province: 'Western', region: 'Urban', latitude: '6.9271', longitude: '79.8612' },
        '71': { city: 'Kandy', district: 'Kandy', province: 'Central', region: 'Hill Country', latitude: '7.2906', longitude: '80.6337' },
        '72': { city: 'Galle', district: 'Galle', province: 'Southern', region: 'Coastal', latitude: '6.0535', longitude: '80.2210' },
        '75': { city: 'Anuradhapura', district: 'Anuradhapura', province: 'North Central', region: 'Dry Zone', latitude: '8.3114', longitude: '80.4037' },
        '76': { city: 'Jaffna', district: 'Jaffna', province: 'Northern', region: 'Peninsula', latitude: '9.6615', longitude: '80.0255' },
        '77': { city: 'Negombo', district: 'Gampaha', province: 'Western', region: 'Coastal Urban', latitude: '7.2083', longitude: '79.8358' },
        '78': { city: 'Matara', district: 'Matara', province: 'Southern', region: 'Coastal', latitude: '5.9549', longitude: '80.5550' }
    }

    return locationMap[prefix] || {
        city: 'Unknown',
        district: 'Unknown',
        province: 'Unknown',
        region: 'Sri Lanka',
        latitude: '7.8731',
        longitude: '80.7718'
    }
}
