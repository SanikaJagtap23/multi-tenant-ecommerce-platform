import { createSlice } from "@reduxjs/toolkit";

const TAX_RATE = 0.1;
const FREE_SHIPPING_THRESHOLD = 500;
const SHIPPING_COST = 49;

// ── helpers ──────────────────────────────────────────────────────────────────

export const groupByStore = (items) => {
  const groups = {};
  for (const item of items) {
    if (!groups[item.storeId]) {
      groups[item.storeId] = { storeId: item.storeId, storeName: item.storeName, items: [] };
    }
    groups[item.storeId].items.push(item);
  }
  return groups;
};

export const calcStoreTotals = (storeItems) => {
  const subtotal = parseFloat(storeItems.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2));
  const tax      = parseFloat((subtotal * TAX_RATE).toFixed(2));
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total    = parseFloat((subtotal + tax + shipping).toFixed(2));
  return { subtotal, tax, shipping, total };
};

const calcTotals = (items) => {
  const groups = Object.values(groupByStore(items));
  let subtotal = 0, tax = 0, shipping = 0;
  for (const g of groups) {
    const t = calcStoreTotals(g.items);
    subtotal += t.subtotal;
    tax      += t.tax;
    shipping += t.shipping;
  }
  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax:      parseFloat(tax.toFixed(2)),
    shipping,
    total: parseFloat((subtotal + tax + shipping).toFixed(2)),
  };
};

// ── user-scoped persistence ───────────────────────────────────────────────────

const cartKey  = (userId) => `cart_${userId}`;

const loadCart = (userId) => {
  if (!userId) return [];
  try {
    const data = localStorage.getItem(cartKey(userId));
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveCart = (items, userId) => {
  if (!userId) return;
  localStorage.setItem(cartKey(userId), JSON.stringify(items));
};

const removeCart = (userId) => {
  if (!userId) return;
  localStorage.removeItem(cartKey(userId));
};

// ── slice ─────────────────────────────────────────────────────────────────────

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    userId:   null,
    items:    [],
    subtotal: 0,
    tax:      0,
    shipping: 0,
    total:    0,
  },
  reducers: {
    // Called when user logs in or app loads with a session
    initCart(state, action) {
      const { userId } = action.payload;
      state.userId = userId;
      state.items  = loadCart(userId);
      Object.assign(state, calcTotals(state.items));
    },

    addToCart(state, action) {
      const { productId, name, price, image, stock, storeId, storeName, vendorId } = action.payload;

      const existing = state.items.find((i) => i.productId === productId);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + 1, stock);
      } else {
        state.items.push({ productId, name, price, image, stock, storeId, storeName, vendorId, quantity: 1 });
      }

      Object.assign(state, calcTotals(state.items));
      saveCart(state.items, state.userId);
    },

    removeFromCart(state, action) {
      state.items = state.items.filter((i) => i.productId !== action.payload);
      Object.assign(state, calcTotals(state.items));
      saveCart(state.items, state.userId);
    },

    updateQuantity(state, action) {
      const { productId, quantity } = action.payload;
      const item = state.items.find((i) => i.productId === productId);
      if (item) {
        item.quantity = Math.max(1, Math.min(quantity, item.stock));
      }
      Object.assign(state, calcTotals(state.items));
      saveCart(state.items, state.userId);
    },

    clearCart(state) {
      removeCart(state.userId);
      state.userId   = null;
      state.items    = [];
      state.subtotal = 0;
      state.tax      = 0;
      state.shipping = 0;
      state.total    = 0;
    },
  },
});

export const { initCart, addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
