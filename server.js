const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const productRoutes = require("./routes/ProductRoutes");
const quoteRoutes = require("./routes/Quote");
const emailRoutes = require("./routes/EmailRoutes");

const app = express();

// Enable CORS
app.use(cors({
  origin: [
    "http://localhost:3000", // dev
    "https://h-a-appliances.vercel.app",
    "https://acsystems4u.com" // production
  ],
  credentials: true,
}));

// Body parser
app.use(express.json());

// ---------- Routes ----------
app.use("/api/products", productRoutes);
app.use("/api/quote", quoteRoutes);
app.use("/api", emailRoutes); // /api/send-confirmation

// Ping route for testing
app.get("/ping", (req, res) => res.json({ message: "Backend alive ✅" }));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Root
app.get("/", (req, res) => res.send("Cold Company API running..."));

// 404
app.use((req, res) => res.status(404).json({ message: "Endpoint not found" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
