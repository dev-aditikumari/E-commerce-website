const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.JWT_SECRET = "test-secret";

let mongod, server, base;
const api = async (path, { method = "GET", body, token } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
};
const signup = async (email, name = "Test User") => (await api("/api/auth/signup", { method: "POST", body: { name, email, password: "Passw0rd1" } })).body;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri("test"));
  const Product = require("../models/Product");
  await Product.insertMany(require("../data/products.json"));
  const User = require("../models/User");
  await User.create({ name: "Admin", email: "admin@test.com", password: await bcrypt.hash("Admin1234", 10), role: "admin" });
  server = require("../app").createApp().listen(0);
  base = `http://localhost:${server.address().port}`;
});

after(async () => {
  server.close();
  await mongoose.disconnect();
  await mongod.stop();
});

test("health check reports the database is up", async () => {
  assert.equal((await api("/health")).body.status, "ok");
});

test("products: list, filter, search, sort and paginate", async () => {
  const all = (await api("/api/products")).body;
  assert.equal(all.total, 36);
  assert.equal((await api("/api/products?category=men")).body.total, 12);
  assert.equal((await api("/api/products?category=bogus")).status, 400);
  const search = (await api("/api/products?search=blouse")).body;
  assert.ok(search.total > 0 && search.products.every((p) => /blouse/i.test(p.name)));
  const asc = (await api("/api/products?sort=price-asc")).body.products.map((p) => p.new_price);
  assert.deepEqual(asc, [...asc].sort((a, b) => a - b));
  const page = (await api("/api/products?limit=10&page=2")).body;
  assert.equal(page.products.length, 10);
  assert.equal(page.pages, 4);
  assert.equal(all.products[0]._id, undefined, "internal fields are not exposed");
});

test("products: new, popular, single and related", async () => {
  assert.equal((await api("/api/products/new")).body.products.length, 8);
  assert.equal((await api("/api/products/popular")).body.products.length, 4);
  const one = await api("/api/products/5");
  assert.equal(one.body.product.id, 5);
  assert.equal((await api("/api/products/9999")).status, 404);
  const related = (await api("/api/products/5/related")).body.products;
  assert.equal(related.length, 4);
  assert.ok(related.every((p) => p.id !== 5 && p.category === one.body.product.category));
});

test("signup validates input and rejects duplicates", async () => {
  assert.equal((await api("/api/auth/signup", { method: "POST", body: { name: "A", email: "bad", password: "x" } })).status, 400);
  assert.equal((await api("/api/auth/signup", { method: "POST", body: { name: "Ann Lee", email: "ann@test.com", password: "short" } })).status, 400);
  const ok = await api("/api/auth/signup", { method: "POST", body: { name: "Ann Lee", email: "Ann@Test.com", password: "Passw0rd1" } });
  assert.equal(ok.status, 201);
  assert.ok(ok.body.token);
  assert.equal(ok.body.user.email, "ann@test.com");
  assert.equal(ok.body.user.password, undefined, "the password never comes back");
  assert.equal((await api("/api/auth/signup", { method: "POST", body: { name: "Ann Lee", email: "ann@test.com", password: "Passw0rd1" } })).status, 409);
});

test("login: right password works, wrong password and unknown email look the same", async () => {
  await signup("bob@test.com");
  const good = await api("/api/auth/login", { method: "POST", body: { email: "bob@test.com", password: "Passw0rd1" } });
  assert.equal(good.status, 200);
  const wrong = await api("/api/auth/login", { method: "POST", body: { email: "bob@test.com", password: "nope12345" } });
  const unknown = await api("/api/auth/login", { method: "POST", body: { email: "ghost@test.com", password: "nope12345" } });
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.equal(wrong.body.message, unknown.body.message);
  const me = await api("/api/auth/me", { token: good.body.token });
  assert.equal(me.body.user.email, "bob@test.com");
  assert.equal((await api("/api/auth/me")).status, 401);
  assert.equal((await api("/api/auth/me", { token: "garbage" })).status, 401);
});

test("database operators in the request body are ignored (NoSQL injection)", async () => {
  const res = await api("/api/auth/login", { method: "POST", body: { email: { $gt: "" }, password: { $gt: "" } } });
  assert.equal(res.status, 400);
});

test("cart: add, remove, merge and clear, always priced by the server", async () => {
  const { token } = await signup("cart@test.com");
  assert.equal((await api("/api/cart")).status, 401);
  let cart = (await api("/api/cart/add", { method: "POST", token, body: { productId: 1 } })).body.cart;
  cart = (await api("/api/cart/add", { method: "POST", token, body: { productId: 1 } })).body.cart;
  cart = (await api("/api/cart/add", { method: "POST", token, body: { productId: 2 } })).body.cart;
  assert.equal(cart.count, 3);
  assert.equal(cart.subtotal, 50 * 2 + 85);
  assert.equal((await api("/api/cart/add", { method: "POST", token, body: { productId: 9999 } })).status, 404);
  cart = (await api("/api/cart/remove", { method: "POST", token, body: { productId: 1 } })).body.cart;
  assert.equal(cart.items.find((i) => i.product.id === 1).quantity, 1);
  cart = (await api("/api/cart/remove", { method: "POST", token, body: { productId: 1 } })).body.cart;
  assert.equal(cart.items.some((i) => i.product.id === 1), false, "a line disappears at zero");
  assert.equal((await api("/api/cart/remove", { method: "POST", token, body: { productId: 1 } })).status, 404);

  cart = (await api("/api/cart/merge", { method: "POST", token, body: { items: { 2: 2, 3: 1, 9999: 5, 4: -1 } } })).body.cart;
  assert.equal(cart.items.find((i) => i.product.id === 2).quantity, 3);
  assert.ok(cart.items.some((i) => i.product.id === 3));
  assert.equal(cart.items.some((i) => i.product.id === 9999 || i.product.id === 4), false, "unknown products and bad quantities are skipped");

  cart = (await api("/api/cart/items/2", { method: "DELETE", token })).body.cart;
  assert.equal(cart.items.some((i) => i.product.id === 2), false, "a whole line can be removed at once");

  cart = (await api("/api/cart", { method: "DELETE", token })).body.cart;
  assert.equal(cart.count, 0);
});

test("promo codes: valid ones give a discount, invalid ones are rejected", async () => {
  const { token } = await signup("promo@test.com");
  assert.equal((await api("/api/cart/promo", { method: "POST", body: { code: "NOPE" } })).status, 400);
  assert.equal((await api("/api/cart/promo", { method: "POST", body: { code: "welcome10" } })).body.promo.percent, 10, "no login needed to check a code");
  await api("/api/cart/add", { method: "POST", token, body: { productId: 1 } });
  await api("/api/cart/add", { method: "POST", token, body: { productId: 1 } });
  const cart = (await api("/api/cart?promo=WELCOME10", { token })).body.cart;
  assert.equal(cart.subtotal, 100);
  assert.equal(cart.discount, 10);
  assert.equal(cart.total, 90);
});

const address = { fullName: "Test User", phone: "9876543210", line1: "12 MG Road", city: "Pune", pincode: "411001" };

test("orders: need a login, a cart and a valid address", async () => {
  assert.equal((await api("/api/orders", { method: "POST", body: { address } })).status, 401);
  const { token } = await signup("order1@test.com");
  assert.equal((await api("/api/orders", { method: "POST", token, body: { address } })).body.message, "Your cart is empty");
  await api("/api/cart/add", { method: "POST", token, body: { productId: 1 } });
  const bad = await api("/api/orders", { method: "POST", token, body: { address: { ...address, phone: "abc" } } });
  assert.equal(bad.status, 400);
});

test("orders: placing one snapshots prices, applies the promo and empties the cart", async () => {
  const { token } = await signup("order2@test.com");
  await api("/api/cart/add", { method: "POST", token, body: { productId: 1 } });
  await api("/api/cart/add", { method: "POST", token, body: { productId: 1 } });
  await api("/api/cart/add", { method: "POST", token, body: { productId: 2 } });
  const placed = await api("/api/orders", { method: "POST", token, body: { address, promoCode: "SHOPPER20", total: 1 } });
  assert.equal(placed.status, 201);
  const o = placed.body.order;
  assert.equal(o.subtotal, 185);
  assert.equal(o.discount, 37);
  assert.equal(o.total, 148, "the total is computed by the server, not taken from the browser");
  assert.equal(o.items.length, 2);
  assert.equal((await api("/api/cart", { token })).body.cart.count, 0);

  const mine = (await api("/api/orders", { token })).body.orders;
  assert.equal(mine.length, 1);
  assert.equal((await api(`/api/orders/${o._id}`, { token })).body.order.total, 148);

  const other = await signup("order3@test.com");
  assert.equal((await api(`/api/orders/${o._id}`, { token: other.token })).status, 404, "you cannot read someone else's order");
  assert.equal((await api("/api/orders/not-an-id", { token })).status, 404);
});

test("admin: only admins can create, edit and delete products", async () => {
  const customer = (await signup("cust@test.com")).token;
  const admin = (await api("/api/auth/login", { method: "POST", body: { email: "admin@test.com", password: "Admin1234" } })).body.token;
  const product = { name: "Test Jacket", category: "men", image: "product_1.png", new_price: 40, old_price: 60 };
  assert.equal((await api("/api/products", { method: "POST", body: product })).status, 401);
  assert.equal((await api("/api/products", { method: "POST", token: customer, body: product })).status, 403);
  assert.equal((await api("/api/products", { method: "POST", token: admin, body: { ...product, new_price: "free" } })).status, 400);
  const created = await api("/api/products", { method: "POST", token: admin, body: product });
  assert.equal(created.status, 201);
  const id = created.body.product.id;
  assert.equal(id, 37);
  assert.equal((await api(`/api/products/${id}`, { method: "PUT", token: admin, body: { new_price: 35 } })).body.product.new_price, 35);
  assert.equal((await api(`/api/products/${id}`, { method: "DELETE", token: customer })).status, 403);
  assert.equal((await api(`/api/products/${id}`, { method: "DELETE", token: admin })).status, 200);
  assert.equal((await api(`/api/products/${id}`)).status, 404);
});

test("unknown routes and bad JSON return clean errors", async () => {
  assert.equal((await api("/api/nothing")).status, 404);
  const res = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{not json" });
  assert.equal(res.status, 400);
});

test("newsletter: valid emails are accepted (twice is fine), invalid ones are not", async () => {
  assert.equal((await api("/api/newsletter", { method: "POST", body: { email: "nope" } })).status, 400);
  assert.equal((await api("/api/newsletter", { method: "POST", body: { email: "fan@test.com" } })).status, 201);
  assert.equal((await api("/api/newsletter", { method: "POST", body: { email: "FAN@test.com" } })).status, 201);
  assert.equal(await require("../models/Subscriber").countDocuments({ email: "fan@test.com" }), 1);
});
