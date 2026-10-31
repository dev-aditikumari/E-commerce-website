const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // a snapshot, so an order keeps its prices even if the product changes later
    items: [
      {
        _id: false,
        productId: Number,
        name: String,
        image: String,
        price: Number,
        quantity: Number,
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    promoCode: { type: String, default: null },
    total: { type: Number, required: true },
    address: {
      fullName: String,
      phone: String,
      line1: String,
      city: String,
      pincode: String,
    },
    paymentMethod: { type: String, enum: ["cod"], default: "cod" },
    status: { type: String, enum: ["placed", "shipped", "delivered", "cancelled"], default: "placed" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
