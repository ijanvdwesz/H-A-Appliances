const express = require("express");
const Brevo = require("@getbrevo/brevo");
const Quote = require("../models/Quote");
require("dotenv").config();

const router = express.Router();

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.authentications["apiKey"].apiKey = process.env.BREVO_API_KEY;

router.post("/", async (req, res) => {
  const data = req.body;

  try {
    // Save quote to database
    await Quote.create(data);

    // HTML content
    const htmlContent = `
      <div style="font-family:Arial, sans-serif; padding:20px; color:#333;">
        <h2 style="color:#0ea5e9;">New Quote Request</h2>
        <p>You received a new quote request from the website:</p>
        <table style="border-collapse:collapse; width:100%; margin-top:10px;">
          <tr><td><b>Services:</b></td><td>${data.services?.join(", ")}</td></tr>
          ${data.services?.includes("Cold Room") || data.services?.includes("Mobile Unit") ? 
            `<tr><td><b>Dimensions:</b></td><td>${data.length} × ${data.width} × ${data.height} m</td></tr>
             <tr><td><b>Temperature:</b></td><td>${data.temperature} °C</td></tr>` : ""}
          ${data.services?.includes("Aircon Installation") ? 
            `<tr><td><b>AC Room Size:</b></td><td>${data.acRoomSize} m²</td></tr>
             <tr><td><b>AC Type:</b></td><td>${data.acType}</td></tr>` : ""}
          ${data.services?.includes("Maintenance") ? 
            `<tr><td><b>Maintenance:</b></td><td>${data.maintenanceType} - ${data.maintenanceFreq}</td></tr>` : ""}
          ${data.specialInstructions ? `<tr><td><b>Notes:</b></td><td>${data.specialInstructions}</td></tr>` : ""}
          <tr><td><b>Name:</b></td><td>${data.name}</td></tr>
          <tr><td><b>Email:</b></td><td>${data.email}</td></tr>
          ${data.phone ? `<tr><td><b>Phone:</b></td><td>${data.phone}</td></tr>` : ""}
          ${data.location ? `<tr><td><b>Location:</b></td><td>${data.location}</td></tr>` : ""}
        </table>
        <p style="margin-top:20px;">— Cold Company Website</p>
      </div>
    `;

    // ✅ Send to customer
    await apiInstance.sendTransacEmail({
      sender: { email: process.env.SENDER_EMAIL, name: process.env.SENDER_NAME },
      to: [{ email: data.email, name: data.name }],
      subject: "Your Quote Request - Cold Company",
      htmlContent,
      textContent: `Hi ${data.name}, we received your quote request.`,
    });

    // ✅ Send to admin
    await apiInstance.sendTransacEmail({
      sender: { email: process.env.SENDER_EMAIL, name: process.env.SENDER_NAME },
      to: [{ email: process.env.ADMIN_EMAIL, name: "H&A Appliances" }],
      subject: "New Quote Request",
      htmlContent,
      textContent: `New quote request from ${data.name}.`,
    });

    res.status(200).json({ success: true });

  } catch (error) {
    console.error("❌ Brevo email error:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});

module.exports = router;
