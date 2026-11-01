// Loads the 36 shop products (and optionally an admin account). Safe to run again.
//   MONGODB_URL=... ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='...' npm run seed
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Product = require("../models/Product");
const User = require("../models/User");
const products = require("../data/products.json");

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URL, { serverSelectionTimeoutMS: 20000 });
  for (const p of products) await Product.updateOne({ id: p.id }, { $set: p }, { upsert: true });
  console.log(`Products ready (${products.length})`);

  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const email = ADMIN_EMAIL.trim().toLowerCase();
    if (await User.findOne({ email })) {
      console.log("Admin already exists, skipped");
    } else {
      await User.create({ name: "Admin", email, password: await bcrypt.hash(ADMIN_PASSWORD, 10), role: "admin" });
      console.log(`Admin created: ${email}`);
    }
  }
};

module.exports = seed;

if (require.main === module) {
  seed()
    .then(() => mongoose.disconnect())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
