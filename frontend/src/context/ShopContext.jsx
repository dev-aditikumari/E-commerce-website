import React, { createContext, useCallback, useEffect, useState } from "react";
import { api, getToken } from "../services/api";
import { productImage } from "../utils/productImage";

export const ShopContext = createContext(null);

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const round = (n) => Math.round(n * 100) / 100;
const withImage = (p) => ({ ...p, image: productImage(p.image) });
// the server cart -> { productId: quantity }
const toMap = (cart) => Object.fromEntries(cart.items.map((i) => [i.product.id, i.quantity]));

const ShopContextProvider = ({ children }) => {
  const [all_product, setProducts] = useState([]);
  const [newCollections, setNewCollections] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(() => readJson("user", null));
  // a visitor's cart lives in the browser; once logged in it lives on the server
  const [cartItems, setCartItems] = useState(() => (getToken() ? {} : readJson("guestCart", {})));
  const [promo, setPromo] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setCartItems({});
    setPromo(null);
  }, []);

  const syncCart = useCallback(async () => {
    try {
      const { cart } = await api("/cart");
      setCartItems(toMap(cart));
    } catch (err) {
      if (err.status === 401) logout(); // an expired login
    }
  }, [logout]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [all, fresh, hot] = await Promise.all([api("/products?limit=100"), api("/products/new"), api("/products/popular")]);
      setProducts(all.products.map(withImage));
      setNewCollections(fresh.products.map(withImage));
      setPopular(hot.products.map(withImage));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    if (getToken()) syncCart();
  }, [loadProducts, syncCart]);

  // ---------- cart ----------
  const changeGuestCart = (change) =>
    setCartItems((prev) => {
      const next = change({ ...prev });
      localStorage.setItem("guestCart", JSON.stringify(next));
      return next;
    });

  const serverCart = async (path, options) => {
    try {
      const { cart } = await api(path, options);
      setCartItems(toMap(cart));
    } catch (err) {
      if (err.status === 401) logout();
      else throw err;
    }
  };

  const addToCart = async (id) => {
    if (!getToken()) return changeGuestCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
    await serverCart("/cart/add", { method: "POST", body: { productId: id } });
  };

  const removeFromCart = async (id) => {
    if (!getToken()) {
      return changeGuestCart((c) => {
        if ((c[id] || 0) <= 1) delete c[id];
        else c[id] -= 1;
        return c;
      });
    }
    await serverCart("/cart/remove", { method: "POST", body: { productId: id } });
  };

  const removeLine = async (id) => {
    if (!getToken()) {
      return changeGuestCart((c) => {
        delete c[id];
        return c;
      });
    }
    await serverCart(`/cart/items/${id}`, { method: "DELETE" });
  };

  // ---------- totals ----------
  const getTotalCartItems = () => Object.values(cartItems).reduce((sum, n) => sum + n, 0);
  const getSubtotal = () => round(all_product.reduce((sum, p) => sum + (cartItems[p.id] || 0) * p.new_price, 0));
  const getDiscount = () => (promo ? round((getSubtotal() * promo.percent) / 100) : 0);
  const getTotalCartAmount = () => round(getSubtotal() - getDiscount());

  const applyPromo = async (code) => {
    const { promo: valid } = await api("/cart/promo", { method: "POST", body: { code } });
    setPromo(valid);
    return valid;
  };

  // ---------- accounts ----------
  const finishAuth = async ({ token, user: account }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(account));
    setUser(account);
    // what they put in the cart before logging in is added to their saved cart
    try {
      const { cart } = await api("/cart/merge", { method: "POST", body: { items: readJson("guestCart", {}) } });
      setCartItems(toMap(cart));
      localStorage.removeItem("guestCart");
    } catch {
      await syncCart();
    }
  };

  const login = async (email, password) => finishAuth(await api("/auth/login", { method: "POST", body: { email, password } }));
  const signup = async (name, email, password) =>
    finishAuth(await api("/auth/signup", { method: "POST", body: { name, email, password } }));

  const placeOrder = async (address) => {
    const { order } = await api("/orders", { method: "POST", body: { address, promoCode: promo?.code } });
    setCartItems({});
    setPromo(null);
    return order;
  };

  const value = {
    all_product, newCollections, popular, loading, error, reloadProducts: loadProducts,
    user, login, signup, logout,
    cartItems, addToCart, removeFromCart, removeLine,
    getTotalCartItems, getSubtotal, getDiscount, getTotalCartAmount,
    promo, applyPromo, clearPromo: () => setPromo(null),
    placeOrder,
  };
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export default ShopContextProvider;
