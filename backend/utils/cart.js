const Product = require("../models/Product");

// promo codes the shop accepts, as a percentage off the subtotal
const PROMOS = { WELCOME10: 10, SHOPPER20: 20 };

const round = (n) => Math.round(n * 100) / 100;

exports.PROMOS = PROMOS;

exports.promoPercent = (code) => {
  if (typeof code !== "string") return 0;
  return PROMOS[code.trim().toUpperCase()] || 0;
};

// turns the stored [{productId, quantity}] into lines with product details and totals
exports.buildCart = async (user, promoCode) => {
  const ids = user.cart.map((line) => line.productId);
  const products = await Product.find({ id: { $in: ids } }).lean();
  const byId = new Map(products.map((p) => [p.id, p]));

  const items = [];
  for (const line of user.cart) {
    const p = byId.get(line.productId);
    if (!p) continue; // the product was removed from the shop
    items.push({
      product: { id: p.id, name: p.name, image: p.image, category: p.category, new_price: p.new_price, old_price: p.old_price },
      quantity: line.quantity,
      lineTotal: round(p.new_price * line.quantity),
    });
  }

  const subtotal = round(items.reduce((sum, i) => sum + i.lineTotal, 0));
  const percent = exports.promoPercent(promoCode);
  const discount = round((subtotal * percent) / 100);
  return {
    items,
    count: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal,
    promo: percent ? { code: promoCode.trim().toUpperCase(), percent } : null,
    discount,
    total: round(subtotal - discount),
  };
};
