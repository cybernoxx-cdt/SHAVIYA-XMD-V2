const mongoose = require("mongoose");
const EnvVar = require("./mongodbenv");

const MONGODB_URI = process.env.MONGODB_URI || "";

const credsSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  credsJson: { type: Object, required: true },
  updatedAt: { type: Date, default: Date.now }
});

const CredsModel = mongoose.models.ShaviyaXMDCreds || mongoose.model("ShaviyaXMDCreds", credsSchema);

async function connectDB() {
  if (!MONGODB_URI) {
    console.log("[MongoDB] No MONGODB_URI set — skipping DB connection.");
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("🛜 MongoDB Connected ✅");

    const defaultEnv = [
      { key: "PREFIX", value: "." },
      { key: "ALIVE_MSG", value: "Hello 👋 I am SHAVIYA-XMD V2 💎" }
    ];

    for (const env of defaultEnv) {
      const exists = await EnvVar.findOne({ key: env.key });
      if (!exists) {
        await EnvVar.create(env);
        console.log(`➕ Created default env: ${env.key}`);
      }
    }

    console.log("🌟 SHAVIYA-XMD V2 — Environment variables and Models ready.");
  } catch (err) {
    console.error("❌ MongoDB Error:", err.message);
  }
}

module.exports = connectDB;
