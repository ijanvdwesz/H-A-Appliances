// backend/routes/emailRoutes.js
const express = require("express");
const nodemailer = require("nodemailer");

const router = express.Router();

router.post("/send-confirmation", async (req, res) => {
  const { name, email, total, address, cart } = req.body;

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail", // or your SMTP service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Create formatted HTML cart summary
    const cartItemsHtml = cart
      .map(
        (item) =>
          `<tr>
             <td style="padding:5px 10px;">${item.name}</td>
             <td style="padding:5px 10px; text-align:center;">${item.quantity}</td>
             <td style="padding:5px 10px; text-align:right;">R${(
               item.price * item.quantity
             ).toFixed(2)}</td>
           </tr>`
      )
      .join("");

    const htmlMessage = `
      <div style="font-family: 'Orbitron', sans-serif; color:#0f172a; background:#e0f7ff; padding:20px;">
        <h2 style="color:#38bdf8;">Hi ${name},</h2>
        <p>Thank you for your order! 🧊</p>

        <h3 style="color:#0ea5e9;">Order Summary:</h3>
        <table style="width:100%; border-collapse: collapse; margin-bottom:15px;">
          <thead>
            <tr style="background:#38bdf8; color:#0f172a;">
              <th style="padding:5px 10px;">Product</th>
              <th style="padding:5px 10px; text-align:center;">Qty</th>
              <th style="padding:5px 10px; text-align:right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${cartItemsHtml}
          </tbody>
        </table>

        <p><strong>Delivery Address:</strong> ${address}</p>
        <p><strong>Total:</strong> R${total.toFixed(2)}</p>

        <p>We'll notify you once your order ships.</p>
        <p>Kind regards,<br/>Cold Company Team</p>
      </div>
    `;

    // Send the email
    await transporter.sendMail({
      from: `"Cold Company" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Cold Company Order Confirmation",
      text: `Hi ${name}, thank you for your order! Total: R${total.toFixed(2)}`,
      html: htmlMessage,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Email send failed:", error);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
});

module.exports = router;
