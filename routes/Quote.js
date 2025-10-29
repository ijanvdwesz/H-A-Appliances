const express = require("express");
const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");
const Quote = require("../models/Quote");

const router = express.Router();
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

router.post("/", async (req, res) => {
  const data = req.body;

  // ✅ Save quote data to MongoDB
  try {
    await Quote.create(data);
  } catch (dbError) {
    console.error("❌ Database save error:", dbError);
    return res.status(500).json({ success: false, error: "Database error" });
  }

  // ✅ Build the HTML email
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
    const sentFrom = new Sender(process.env.SENDER_EMAIL, process.env.SENDER_NAME);

    const recipients = [
      new Recipient(data.email, data.name),
      new Recipient(process.env.SENDER_EMAIL, "H&A Appliances"),
    ];
console.log("Recipients:", recipients.map(r => r.email));
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject("New Quote Request - Cold Company")
      .setText(`New quote request from ${data.name}`)
      .setHtml(htmlContent);

    await mailerSend.email.send(emailParams);

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Email sending error:", error);
    res.status(500).json({ success: false, error: "MailerSend error" });
  }
});

module.exports = router;
