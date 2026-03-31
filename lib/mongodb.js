// lib/mongodb.js
// ✅ Fixed MongoDB URI with correct credentials

'use strict';

const mongoose = require('mongoose');

// ✅ Your MongoDB URI (hardcoded as fallback if env not set)
const MONGODB_URI = process.env.MONGODB_URI ||
    'mongodb+srv://botmini:botmini@minibot.upglk0f.mongodb.net/?retryWrites=true&w=majority&appName=minibot';

const credsSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    credsJson:  { type: Object, required: true },
    updatedAt:  { type: Date, default: Date.now }
});

const CredsModel = mongoose.models.ShaviyaXMDCreds ||
    mongoose.model('ShaviyaXMDCreds', credsSchema);

let isConnected = false;

async function connectDB() {
    if (!MONGODB_URI) {
        console.log('[MongoDB] No URI set — skipping DB connection.');
        return;
    }

    if (isConnected) {
        console.log('[MongoDB] Already connected.');
        return;
    }

    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });

        isConnected = true;
        console.log('🛜 MongoDB Connected ✅');

        // Seed default env vars if missing
        const EnvVar = require('./mongodbenv');
        const defaults = [
            { key: 'PREFIX',    value: '.' },
            { key: 'ALIVE_MSG', value: 'Hello 👋 I am SHAVIYA-XMD V2 💎' }
        ];
        for (const env of defaults) {
            const exists = await EnvVar.findOne({ key: env.key });
            if (!exists) {
                await EnvVar.create(env);
                console.log(`➕ Created default env: ${env.key}`);
            }
        }

        console.log('🌟 SHAVIYA-XMD V2 — MongoDB ready.');

        // Handle disconnection
        mongoose.connection.on('disconnected', () => {
            isConnected = false;
            console.log('[MongoDB] Disconnected. Will reconnect on next call.');
        });

    } catch (err) {
        isConnected = false;
        console.error('❌ MongoDB Connection Error:', err.message);
        // Retry after 10 seconds
        setTimeout(connectDB, 10000);
    }
}

module.exports = connectDB;
