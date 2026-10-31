const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");

// the app is built in a function so tests can start it without opening a fixed port
exports.createApp = () => {
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

  const origins = (process.env.CLIENT_URL || "*").split(",").map((u) => u.trim().replace(/\/$/, "")).filter(Boolean);
  app.use(cors({ origin: origins.includes("*") ? "*" : origins }));
  app.use(express.json({ limit: "100kb" }));

  // strip Mongo operators ($where, a.b) from request bodies
  const sanitize = (v) => {
    if (Array.isArray(v)) return v.map(sanitize);
    if (v && typeof v === "object") {
      return Object.fromEntries(Object.entries(v).filter(([k]) => !k.startsWith("$") && !k.includes(".")).map(([k, x]) => [k, sanitize(x)]));
    }
    return v;
  };
  app.use((req, res, next) => {
    if (req.body) req.body = sanitize(req.body);
    next();
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    skipSuccessfulRequests: true, // only failed attempts count
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { success: false, message: "Too many attempts. Please try again in 15 minutes" },
  });
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 1000, skip: (req) => req.path === "/health", standardHeaders: "draft-7", legacyHeaders: false }));

  app.get("/", (_, res) => res.json({ success: true, message: "Shopper API is running" }));
  app.get("/health", (_, res) => {
    const up = mongoose.connection.readyState === 1;
    res.status(up ? 200 : 503).json({ status: up ? "ok" : "degraded" });
  });

  app.use("/api/products", require("./routes/products"));
  app.use("/api/auth", authLimiter, require("./routes/auth"));
  app.use("/api/cart", require("./routes/cart"));
  app.use("/api/orders", require("./routes/orders"));
  app.use("/api/newsletter", require("./routes/newsletter"));

  app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") return res.status(400).json({ success: false, message: "Invalid JSON" });
    console.error(err);
    res.status(500).json({ success: false, message: "Something went wrong" });
  });

  return app;
};
