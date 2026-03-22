// ============================================
//   lib/settings.js - SHAVIYA-XMD V2 Settings Manager
//   Settings save to file - survives restarts!
// ============================================

const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '../data/settings.json');

if (!fs.existsSync(path.dirname(SETTINGS_FILE))) {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
}

const defaultSettings = {
    mode: "public",
    antidelete: false,
    footer: "Powered By SHAVIYA-XMD V2 💎",
    thumb: "",
    prefix: ".",
    fname: "",
    moviedoc: false,
    button: false,
    premiumUsers: [],
    sudoUsers: []
};

function loadSettings() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
            return { ...defaultSettings, ...JSON.parse(data) };
        }
    } catch (e) {
        console.log('[SETTINGS] Load error:', e.message);
    }
    return { ...defaultSettings };
}

function saveSettings(settings) {
    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
        return true;
    } catch (e) {
        console.log('[SETTINGS] Save error:', e.message);
        return false;
    }
}

function getSetting(key) {
    const settings = loadSettings();
    return settings[key];
}

function setSetting(key, value) {
    const settings = loadSettings();
    settings[key] = value;
    return saveSettings(settings);
}

module.exports = { loadSettings, saveSettings, getSetting, setSetting };
