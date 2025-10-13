const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const Quote = require("../models/Quote"); // ✅ Make sure you have this model created

// Example model (models/Quote.js):
// const mongoose = require("mongoose");
// const QuoteSchema = new mongoose.Schema({
//   services: [String],
//   length: String,
//   width: String,
//   height: String,
//   temperature: String,
//   acRoomSize: String,
//   acType: String,
//   maintenanceType: String,
//   maintenanceFreq: String,
//   specialInstructions: String,
//   name: String,
//   email: String,
//   phone: String,
//   location: String,
//   createdAt: { type: Date, default: Date.now }
// });
// module.exports = mongoose.model("Quote", QuoteSchema);

router.post("/", async (req, res) => {
  const data = req.body;

  // ✅ Save to MongoDB first
  try {
    await Quote.create(data);
  } catch (dbError) {
    console.error("❌ Database save error:", dbError);
    return res.status(500).json({ success: false, error: "DB error" });
  }

  // ✅ Setup mail transport
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // ✅ Build the HTML email
  const htmlContent = `
    <div style="font-family:Arial, sans-serif; padding:20px; color:#333;">
      <h2 style="color:#0ea5e9;">New Quote Request</h2>
      <p>You received a new quote request from the website:</p>
      <table style="border-collapse:collapse; width:100%; margin-top:10px;">
        <tr>
          <td style="padding:8px; border:1px solid #ccc;"><b>Services Requested</b></td>
          <td style="padding:8px; border:1px solid #ccc;">${data.services?.join(", ")}</td>
        </tr>

        ${
          data.services?.includes("Cold Room") || data.services?.includes("Mobile Unit")
            ? `
          <tr>
            <td style="padding:8px; border:1px solid #ccc;"><b>Cold Room / Mobile Details</b></td>
            <td style="padding:8px; border:1px solid #ccc;">
              ${data.length || data.width || data.height ? `${data.length} × ${data.width} × ${data.height} m<br/>` : ""}
              ${data.temperature ? `Temperature: ${data.temperature} °C` : ""}
            </td>
          </tr>` : ""
        }

        ${
          data.services?.includes("Aircon Installation")
            ? `
          <tr>
            <td style="padding:8px; border:1px solid #ccc;"><b>Aircon Details</b></td>
            <td style="padding:8px; border:1px solid #ccc;">
              ${data.acRoomSize ? `Room Size: ${data.acRoomSize} m²<br/>` : ""}
              ${data.acType ? `AC Type: ${data.acType}` : ""}
            </td>
          </tr>` : ""
        }

        ${
          data.services?.includes("Maintenance")
            ? `
          <tr>
            <td style="padding:8px; border:1px solid #ccc;"><b>Maintenance Details</b></td>
            <td style="padding:8px; border:1px solid #ccc;">
              ${data.maintenanceType || "N/A"} ${data.maintenanceFreq ? `- ${data.maintenanceFreq}` : ""}
            </td>
          </tr>` : ""
        }

        ${
          data.specialInstructions
            ? `
          <tr>
            <td style="padding:8px; border:1px solid #ccc;"><b>Special Instructions</b></td>
            <td style="padding:8px; border:1px solid #ccc;">${data.specialInstructions}</td>
          </tr>` : ""
        }

        <tr>
          <td style="padding:8px; border:1px solid #ccc;"><b>Name</b></td>
          <td style="padding:8px; border:1px solid #ccc;">${data.name}</td>
        </tr>
        <tr>
          <td style="padding:8px; border:1px solid #ccc;"><b>Email</b></td>
          <td style="padding:8px; border:1px solid #ccc;">${data.email}</td>
        </tr>

        ${data.phone ? `
          <tr><td style="padding:8px; border:1px solid #ccc;"><b>Phone</b></td>
          <td style="padding:8px; border:1px solid #ccc;">${data.phone}</td></tr>` : ""}

        ${data.location ? `
          <tr><td style="padding:8px; border:1px solid #ccc;"><b>Location</b></td>
          <td style="padding:8px; border:1px solid #ccc;">${data.location}</td></tr>` : ""}
      </table>

      <p style="margin-top:20px;">— ColdCompany Website</p>
    </div>
  `;

  // ✅ Send email
  try {
    await transporter.sendMail({
      from: `"ColdCompany Website" <${process.env.EMAIL_USER}>`,
      to: "ijanvdwestz@gmail.com",
      subject: "New Quote Request",
      html: htmlContent,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Email sending error:", error);
    res.status(500).json({ success: false, error: "Email error" });
  }
});

module.exports = router;
