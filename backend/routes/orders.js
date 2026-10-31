const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const { requireAuth } = require("../middleware/auth");
const { buildCart } = require("../utils/cart");

const router = express.Router();
router.use(requireAuth);

const text = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const readAddress = (a = {}) => {
  const address = {
    fullName: text(a.fullName, 60),
    phone: text(a.phone, 20),
    line1: text(a.line1, 120),
    city: text(a.city, 60),
    pincode: text(a.pincode, 10),
  };
  if (address.fullName.length < 2) return { error: "Enter the full name for delivery" };
  if (!/^\+?\d{7,15}$/.test(address.phone.replace(/[\s-]/g, ""))) return { error: "Enter a valid phone number" };
  if (address.line1.length < 5) return { error: "Enter the delivery address" };
  if (address.city.length < 2) return { error: "Enter the city" };
  if (!/^[A-Za-z0-9 -]{4,10}$/.test(address.pincode)) return { error: "Enter a valid pincode" };
  return { address };
};

// place an order from the cart on the server (prices come from the database, never the browser)
router.post("/", async (req, res, next) => {
  try {
    const { address, error } = readAddress(req.body.address);
    if (error) return res.status(400).json({ success: false, message: error });

    const cart = await buildCart(req.user, req.body.promoCode);
    if (!cart.items.length) return res.status(400).json({ success: false, message: "Your cart is empty" });

    const order = await Order.create({
      user: req.user._id,
      items: cart.items.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        image: i.product.image,
        price: i.product.new_price,
        quantity: i.quantity,
      })),
      subtotal: cart.subtotal,
      discount: cart.discount,
      promoCode: cart.promo ? cart.promo.code : null,
      total: cart.total,
      address,
      paymentMethod: "cod",
    });

    req.user.cart = [];
    await req.user.save();
    res.status(201).json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, orders });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: "Order not found" });
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).lean();
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
