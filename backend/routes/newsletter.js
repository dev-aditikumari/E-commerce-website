const express = require("express");
const Subscriber = require("../models/Subscriber");

const router = express.Router();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

router.post("/", async (req, res, next) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase().slice(0, 120) : "";
    if (!EMAIL.test(email)) return res.status(400).json({ success: false, message: "Enter a valid email address" });
    // subscribing twice is fine: the answer is the same and nothing is duplicated
    await Subscriber.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
    res.status(201).json({ success: true, message: "Thanks for subscribing" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
