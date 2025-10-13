const mongoose = require("mongoose");

const QuoteSchema = new mongoose.Schema({
  services: [String],
  length: String,
  width: String,
  height: String,
  temperature: String,
  acRoomSize: String,
  acType: String,
  maintenanceType: String,
  maintenanceFreq: String,
  specialInstructions: String,
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  location: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Quote", QuoteSchema);
