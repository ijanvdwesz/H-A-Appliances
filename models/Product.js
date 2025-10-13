const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    image: { type: String, required: true },
    productCode: { type: String, unique: true, sparse: true }, // optional unique identifier
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String },
    stockStatus: { type: String, enum: ["in_stock", "out_of_stock", "dropship"], default: "dropship" },
    sourceUrl: { type: String }, // original site we scraped from
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
