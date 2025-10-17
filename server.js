const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const productRoutes = require("./routes/ProductRoutes");
const quoteRoutes = require("./routes/Quote");
const emailRoutes = require("./routes/EmailRoutes");

const app = express();

app.use(cors({
  origin: [
     "http://localhost:3000", // dev
    "https://h-a-appliances.vercel.app" // permanent production URL
  ],
  credentials: true,
}));

app.use(express.json());

// Routes
app.use("/api/products", productRoutes);
app.use("/api/quote", quoteRoutes);
app.use("/api", emailRoutes); // ✅ Mounts /api/send-confirmation

// MongoDB Atlas connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Root route
app.get("/", (req, res) => res.send("Cold Company API running..."));

// 404 catch-all
app.use((req, res) => res.status(404).json({ message: "Endpoint not found" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
