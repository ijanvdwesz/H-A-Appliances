const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const productRoutes = require("./routes/ProductRoutes");
const quoteRoutes = require("./routes/quote");
const emailRoutes = require("./routes/emailRoutes"); // ✅ NEW

const app = express();
app.use(cors());
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
