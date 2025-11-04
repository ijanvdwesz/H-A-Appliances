const express = require("express");
const Brevo = require("@getbrevo/brevo");
require("dotenv").config();

const router = express.Router();

// ✅ Brevo client setup
const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.authentications["apiKey"].apiKey = process.env.BREVO_API_KEY;

// ---------- ORDER CONFIRMATION ----------
router.post("/send-confirmation", async (req, res) => {
  const { name, email, total, address, cart } = req.body;

  console.log("📩 Received order confirmation request:", { name, email, total });

  try {
    // Cart items HTML
    const cartItemsHtml = cart?.length
      ? cart
          .map(
            (item) => `
            <tr>
              <td style="padding:5px 10px;">${item.name}</td>
              <td style="padding:5px 10px; text-align:center;">${item.quantity}</td>
              <td style="padding:5px 10px; text-align:right;">R${(item.price * item.quantity).toFixed(2)}</td>
            </tr>`
          )
          .join("")
      : "<tr><td colspan='3'>No items</td></tr>";

    const htmlMessage = `
      <div style="font-family:'Orbitron',sans-serif; color:#0f172a; background:#e0f7ff; padding:20px;">
        <h2 style="color:#38bdf8;">Hi ${name},</h2>
        <p>Thank you for your order! 🧊</p>

        <h3 style="color:#0ea5e9;">Order Summary:</h3>
        <table style="width:100%; border-collapse: collapse; margin-bottom:15px;">
          <thead>
            <tr style="background:#38bdf8; color:#0f172a;">
              <th>Product</th><th>Qty</th><th>Price</th>
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

    // Send email to customer
    const customerResponse = await apiInstance.sendTransacEmail({
      sender: { email: process.env.SENDER_EMAIL, name: process.env.SENDER_NAME },
      to: [{ email, name }],
      subject: "Your Cold Company Order Confirmation",
      htmlContent: htmlMessage,
      textContent: `Hi ${name}, thank you for your order! Total: R${total.toFixed(2)}.`,
    });
    console.log("✅ Email sent to customer:", customerResponse);

    // Send email to company
    const companyResponse = await apiInstance.sendTransacEmail({
      sender: { email: process.env.SENDER_EMAIL, name: process.env.SENDER_NAME },
      to: [{ email: process.env.SENDER_EMAIL, name: "H&A Appliances" }],
      subject: `New Order from ${name}`,
      htmlContent: htmlMessage,
      textContent: `New order from ${name}, total R${total.toFixed(2)}.`,
    });
    console.log("✅ Email sent to company:", companyResponse);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Brevo email error:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});

module.exports = router;
