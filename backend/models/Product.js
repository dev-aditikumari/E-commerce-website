const mongoose = require("mongoose");

// `id` is a small number (not the Mongo _id) so product links stay short: /product/12
const productSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, maxLength: 200 },
    category: { type: String, required: true, enum: ["men", "women", "kid"], index: true },
    image: { type: String, required: true, trim: true },
    new_price: { type: Number, required: true, min: 0 },
    old_price: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true, maxLength: 2000, default: "" },
    isNew: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false },
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

module.exports = mongoose.model("Product", productSchema);
