const express = require("express");
const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

const router = express.Router();
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

router.post("/send-confirmation", async (req, res) => {
  const { name, email, total, address, cart } = req.body;

  try {
    const cartItemsHtml = cart
      ?.map(
        (item) => `
        <tr>
          <td style="padding:5px 10px;">${item.name}</td>
          <td style="padding:5px 10px; text-align:center;">${item.quantity}</td>
          <td style="padding:5px 10px; text-align:right;">R${(
            item.price * item.quantity
          ).toFixed(2)}</td>
        </tr>`
      )
      .join("") || "";

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
          <tbody>${cartItemsHtml}</tbody>
        </table>

        <p><strong>Delivery Address:</strong> ${address}</p>
        <p><strong>Total:</strong> R${total.toFixed(2)}</p>

        <p>We'll notify you once your order ships.</p>
        <p>Kind regards,<br/>Cold Company Team</p>
      </div>
    `;

    const sentFrom = new Sender(process.env.SENDER_EMAIL, process.env.SENDER_NAME);
    const recipients = [
      new Recipient(email, name),
      new Recipient(process.env.SENDER_EMAIL, "H&A Aplliances"),
    ];
console.log("Recipients:", recipients.map(r => r.email));
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject("Your Cold Company Order Confirmation")
      .setText(`Hi ${name}, thank you for your order! Total: R${total.toFixed(2)}`)
      .setHtml(htmlMessage);

    await mailerSend.email.send(emailParams);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Email send failed:", error);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
});

module.exports = router;
