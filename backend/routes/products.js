const express = require("express");
const Product = require("../models/Product");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();
const CATEGORIES = ["men", "women", "kid"];
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const PUBLIC_FIELDS = "-_id -__v -createdAt -updatedAt";

// GET /api/products?category=men&search=shirt&sort=price-asc&page=1&limit=12
router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) {
      if (!CATEGORIES.includes(req.query.category)) {
        return res.status(400).json({ success: false, message: "Unknown category" });
      }
      filter.category = req.query.category;
    }
    if (typeof req.query.search === "string" && req.query.search.trim()) {
      filter.name = { $regex: escapeRegex(req.query.search.trim().slice(0, 60)), $options: "i" };
    }

    const sorts = { "price-asc": { new_price: 1, id: 1 }, "price-desc": { new_price: -1, id: 1 }, newest: { id: -1 } };
    const sort = sorts[req.query.sort] || { id: 1 };
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 100, 1), 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);

    const [products, total] = await Promise.all([
      Product.find(filter).select(PUBLIC_FIELDS).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);
    res.json({ success: true, products, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

router.get("/new", async (req, res, next) => {
  try {
    const products = await Product.find({ isNew: true }).select(PUBLIC_FIELDS).sort({ id: 1 }).lean();
    res.json({ success: true, products });
  } catch (err) {
    next(err);
  }
});

router.get("/popular", async (req, res, next) => {
  try {
    const products = await Product.find({ isPopular: true }).select(PUBLIC_FIELDS).sort({ id: 1 }).lean();
    res.json({ success: true, products });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const product = await Product.findOne({ id: Number(req.params.id) }).select(PUBLIC_FIELDS).lean();
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/related", async (req, res, next) => {
  try {
    const product = await Product.findOne({ id: Number(req.params.id) }).lean();
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    const products = await Product.find({ category: product.category, id: { $ne: product.id } })
      .select(PUBLIC_FIELDS)
      .sort({ id: 1 })
      .limit(4)
      .lean();
    res.json({ success: true, products });
  } catch (err) {
    next(err);
  }
});

// ---- admin only ----
const validateProduct = (body, partial = false) => {
  const errors = [];
  const has = (k) => body[k] !== undefined;
  if (!partial || has("name")) if (typeof body.name !== "string" || body.name.trim().length < 2) errors.push("name");
  if (!partial || has("category")) if (!CATEGORIES.includes(body.category)) errors.push("category");
  if (!partial || has("image")) if (typeof body.image !== "string" || !body.image.trim()) errors.push("image");
  for (const k of ["new_price", "old_price"]) {
    if (!partial || has(k)) if (!(Number(body[k]) >= 0) || body[k] === "" || body[k] === null) errors.push(k);
  }
  return errors;
};

router.post("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const errors = validateProduct(req.body);
    if (errors.length) return res.status(400).json({ success: false, message: `Invalid: ${errors.join(", ")}` });
    const last = await Product.findOne().sort({ id: -1 }).lean();
    const product = await Product.create({
      id: (last?.id || 0) + 1,
      name: req.body.name.trim(),
      category: req.body.category,
      image: req.body.image.trim(),
      new_price: Number(req.body.new_price),
      old_price: Number(req.body.old_price),
      description: typeof req.body.description === "string" ? req.body.description : "",
    });
    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const errors = validateProduct(req.body, true);
    if (errors.length) return res.status(400).json({ success: false, message: `Invalid: ${errors.join(", ")}` });
    const allowed = ["name", "category", "image", "new_price", "old_price", "description"];
    const update = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const product = await Product.findOneAndUpdate({ id: Number(req.params.id) }, update, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const result = await Product.deleteOne({ id: Number(req.params.id) });
    if (!result.deletedCount) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
