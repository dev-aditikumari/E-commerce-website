const express = require("express");
const Product = require("../models/Product");
const { requireAuth } = require("../middleware/auth");
const { buildCart, promoPercent } = require("../utils/cart");

const router = express.Router();
// checking a promo code does not need an account
router.post("/promo", (req, res) => {
  const percent = promoPercent(req.body.code);
  if (!percent) return res.status(400).json({ success: false, message: "That promo code is not valid" });
  res.json({ success: true, promo: { code: req.body.code.trim().toUpperCase(), percent } });
});

router.use(requireAuth);

const MAX_PER_ITEM = 99;
const sendCart = async (req, res) => res.json({ success: true, cart: await buildCart(req.user, req.query.promo || req.body?.promo) });

const productExists = async (id) => Number.isInteger(id) && (await Product.exists({ id }));

router.get("/", async (req, res, next) => {
  try {
    await sendCart(req, res);
  } catch (err) {
    next(err);
  }
});

// add one of a product
router.post("/add", async (req, res, next) => {
  try {
    const productId = Number(req.body.productId);
    if (!(await productExists(productId))) return res.status(404).json({ success: false, message: "Product not found" });
    const line = req.user.cart.find((l) => l.productId === productId);
    if (line) line.quantity = Math.min(line.quantity + 1, MAX_PER_ITEM);
    else req.user.cart.push({ productId, quantity: 1 });
    await req.user.save();
    await sendCart(req, res);
  } catch (err) {
    next(err);
  }
});

// remove one of a product (the line disappears at zero)
router.post("/remove", async (req, res, next) => {
  try {
    const productId = Number(req.body.productId);
    const line = req.user.cart.find((l) => l.productId === productId);
    if (!line) return res.status(404).json({ success: false, message: "That item is not in your cart" });
    line.quantity -= 1;
    if (line.quantity <= 0) req.user.cart = req.user.cart.filter((l) => l.productId !== productId);
    await req.user.save();
    await sendCart(req, res);
  } catch (err) {
    next(err);
  }
});

// merge the cart a visitor built before logging in: { items: { "12": 2, "5": 1 } }
router.post("/merge", async (req, res, next) => {
  try {
    const items = req.body.items && typeof req.body.items === "object" ? req.body.items : {};
    for (const [rawId, rawQty] of Object.entries(items)) {
      const productId = Number(rawId);
      const quantity = Math.floor(Number(rawQty));
      if (!(quantity > 0) || !(await productExists(productId))) continue;
      const line = req.user.cart.find((l) => l.productId === productId);
      if (line) line.quantity = Math.min(line.quantity + quantity, MAX_PER_ITEM);
      else req.user.cart.push({ productId, quantity: Math.min(quantity, MAX_PER_ITEM) });
    }
    await req.user.save();
    await sendCart(req, res);
  } catch (err) {
    next(err);
  }
});

// remove a product from the cart completely, whatever the quantity
router.delete("/items/:productId", async (req, res, next) => {
  try {
    const productId = Number(req.params.productId);
    req.user.cart = req.user.cart.filter((l) => l.productId !== productId);
    await req.user.save();
    await sendCart(req, res);
  } catch (err) {
    next(err);
  }
});

router.delete("/", async (req, res, next) => {
  try {
    req.user.cart = [];
    await req.user.save();
    await sendCart(req, res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
