const jwt = require("jsonwebtoken");
const User = require("../models/User");

const fail = (res, status, message) => res.status(status).json({ success: false, message });

// accepts "Authorization: Bearer <token>"
exports.requireAuth = async (req, res, next) => {
  try {
    const header = req.header("Authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
    if (!token) return fail(res, 401, "Please log in to continue");

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return fail(res, 401, "Your session has expired. Please log in again");
    }

    const user = await User.findById(payload.id);
    if (!user) return fail(res, 401, "Account no longer exists");
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

exports.requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") return fail(res, 403, "Admins only");
  next();
};
