const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const clean = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const strongPassword = (p) => typeof p === "string" && p.length >= 8 && p.length <= 100 && /[A-Za-z]/.test(p) && /\d/.test(p);
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });
const signToken = (u) => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post("/signup", async (req, res, next) => {
  try {
    const name = clean(req.body.name, 50);
    const email = clean(req.body.email, 120).toLowerCase();
    const { password } = req.body;

    if (name.length < 2) return res.status(400).json({ success: false, message: "Please enter your name" });
    if (!EMAIL.test(email)) return res.status(400).json({ success: false, message: "Enter a valid email address" });
    if (!strongPassword(password)) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters and include a letter and a number" });
    }
    if (await User.findOne({ email })) {
      return res.status(409).json({ success: false, message: "An account with this email already exists" });
    }

    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    res.status(201).json({ success: true, token: signToken(user), user: publicUser(user) });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: "An account with this email already exists" });
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = clean(req.body.email, 120).toLowerCase();
    const { password } = req.body;
    if (!email || typeof password !== "string" || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }
    const user = await User.findOne({ email }).select("+password");
    // the same message for "no such user" and "wrong password" so emails cannot be probed
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    res.json({ success: true, token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
});

module.exports = router;
