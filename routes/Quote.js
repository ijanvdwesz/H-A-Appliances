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
    await Quote.create(data);

    // ✅ SAFE VALUES (prevents empty spam emails)
    const services = data.services?.join(", ") || "Not specified";

    const hasColdOrMobile =
      data.services?.includes("Cold Room") ||
      data.services?.includes("Mobile Unit");

    const hasCold = data.services?.includes("Cold Room");
    const hasMobile = data.services?.includes("Mobile Unit");

    const htmlContent = `
      <div style="font-family:Arial,sans-serif;background:#f4fbff;padding:20px;color:#222;">
        <h2 style="color:#0b5ed7;">New Quote Request</h2>

        <table style="width:100%;border-collapse:collapse;">
          <tr><td><b>Services:</b></td><td>${services}</td></tr>

          ${
            hasCold
              ? `<tr><td><b>Cold Room Dimensions:</b></td><td>${
                  data.length || "-"
                } × ${data.width || "-"} × ${data.height || "-"} m</td></tr>
                 <tr><td><b>Temperature:</b></td><td>${
                   data.temperature || "-"
                 } °C</td></tr>`
              : ""
          }

          ${
            hasMobile
              ? `<tr><td><b>Service Type:</b></td><td>Mobile Refrigeration Unit</td></tr>`
              : ""
          }

          ${
            data.services?.includes("Aircon Installation")
              ? `<tr><td><b>AC Room Size:</b></td><td>${
                  data.acRoomSize || "-"
                } m²</td></tr>
                 <tr><td><b>AC Type:</b></td><td>${
                   data.acType || "-"
                 }</td></tr>`
              : ""
          }

          ${
            data.services?.includes("Maintenance")
              ? `<tr><td><b>Maintenance:</b></td><td>${
                  data.maintenanceType || "-"
                } - ${data.maintenanceFreq || "-"}</td></tr>`
              : ""
          }

          ${
            data.specialInstructions
              ? `<tr><td><b>Notes:</b></td><td>${data.specialInstructions}</td></tr>`
              : ""
          }

          <tr><td><b>Name:</b></td><td>${data.name}</td></tr>
          <tr><td><b>Email:</b></td><td>${data.email}</td></tr>
          ${data.phone ? `<tr><td><b>Phone:</b></td><td>${data.phone}</td></tr>` : ""}
          ${data.location ? `<tr><td><b>Location:</b></td><td>${data.location}</td></tr>` : ""}
        </table>

        <p style="margin-top:20px;font-size:12px;color:#666;">
          — ACSystems4U Quote System
        </p>
      </div>
    `;

    // =========================
    // ✅ CUSTOMER EMAIL
    // =========================
    await apiInstance.sendTransacEmail({
      sender: {
        email: process.env.SENDER_EMAIL,
        name: process.env.SENDER_NAME,
      },
      to: [{ email: data.email, name: data.name }],
      replyTo: {
        email: process.env.SENDER_EMAIL,
        name: process.env.SENDER_NAME,
      },
      subject: "We received your quote request",
      htmlContent,
      textContent: `Hi ${data.name}, we received your quote request.`,
    });

    // =========================
    // ✅ ADMIN EMAIL
    // =========================
    await apiInstance.sendTransacEmail({
      sender: {
        email: process.env.SENDER_EMAIL,
        name: process.env.SENDER_NAME,
      },
      to: [{ email: process.env.ADMIN_EMAIL, name: "ACSystems4U" }],
      replyTo: {
        email: data.email,
        name: data.name,
      },
      subject: `New Quote Request - ${data.name}`,
      htmlContent,
      textContent: `New quote request from ${data.name}`,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Brevo email error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});

module.exports = router;