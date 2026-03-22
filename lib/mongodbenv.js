// mongodbenv.js

const mongoose = require("mongoose");

// ===============================
// Environment Variables Schema
// ===============================
const envVarSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true, // createdAt / updatedAt auto
  }
);

// ===============================
// Model Export
// ===============================
const EnvVar = mongoose.model("EnvVar", envVarSchema);

module.exports = EnvVar;
