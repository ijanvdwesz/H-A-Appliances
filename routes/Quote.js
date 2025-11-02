const express = require("express");
const nodemailer = require("nodemailer");
const Quote = require("../models/Quote");
require("dotenv").config();

const router = express.Router();

// Nodemailer transporter with Brevo SMTP
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SENDER_EMAIL,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

// Send quote request email
router.post("/", async (req, res) => {
  const data = req.body;

  try {
    await Quote.create(data);
  } catch (dbError) {
    console.error("❌ Database save error:", dbError);
    return res.status(500).json({ success: false, error: "Database error" });
  }

  const htmlContent = `
    <div style="font-family:Arial, sans-serif; padding:20px; color:#333;">
      <h2 style="color:#0ea5e9;">New Quote Request</h2>
      <p>You received a new quote request from the website:</p>
      <table style="border-collapse:collapse; width:100%; margin-top:10px;">
        <tr><td><b>Services:</b></td><td>${data.services?.join(", ")}</td></tr>
        ${
          data.services?.includes("Cold Room") || data.services?.includes("Mobile Unit")
            ? `<tr><td><b>Dimensions:</b></td><td>${data.length} × ${data.width} × ${data.height} m</td></tr>
               <tr><td><b>Temperature:</b></td><td>${data.temperature} °C</td></tr>`
            : ""
        }
        ${
          data.services?.includes("Aircon Installation")
            ? `<tr><td><b>AC Room Size:</b></td><td>${data.acRoomSize} m²</td></tr>
               <tr><td><b>AC Type:</b></td><td>${data.acType}</td></tr>`
            : ""
        }
        ${
          data.services?.includes("Maintenance")
            ? `<tr><td><b>Maintenance:</b></td><td>${data.maintenanceType} - ${data.maintenanceFreq}</td></tr>`
            : ""
        }
        ${data.specialInstructions ? `<tr><td><b>Notes:</b></td><td>${data.specialInstructions}</td></tr>` : ""}
        <tr><td><b>Name:</b></td><td>${data.name}</td></tr>
        <tr><td><b>Email:</b></td><td>${data.email}</td></tr>
        ${data.phone ? `<tr><td><b>Phone:</b></td><td>${data.phone}</td></tr>` : ""}
        ${data.location ? `<tr><td><b>Location:</b></td><td>${data.location}</td></tr>` : ""}
      </table>
      <p style="margin-top:20px;">— Cold Company Website</p>
    </div>
  `;

  try {
    // Email to customer
    await transporter.sendMail({
      from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
      to: data.email,
      subject: "Your Quote Request - Cold Company",
      text: `Hi ${data.name}, we received your quote request.`,
      html: htmlContent,
    });

    // Email to company
    await transporter.sendMail({
      from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
      to: process.env.SENDER_EMAIL,
      subject: "New Quote Request",
      text: `New quote request from ${data.name}`,
      html: htmlContent,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Email send failed:", error);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
});

module.exports = router;
