const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxLength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    // the shopping cart lives on the user so it follows them across devices
    cart: [
      {
        _id: false,
        productId: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1, max: 99 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
