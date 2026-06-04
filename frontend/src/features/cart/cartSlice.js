import { createSlice } from "@reduxjs/toolkit";

const TAX_RATE = 0.1;
const FREE_SHIPPING_THRESHOLD = 500;
const SHIPPING_COST = 49;

// ── helpers ──────────────────────────────────────────────────────────────────

/** Group items by storeId */
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

/** Per-store totals */
export const calcStoreTotals = (storeItems) => {
  const subtotal = parseFloat(storeItems.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2));
  const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = parseFloat((subtotal + tax + shipping).toFixed(2));
  return { subtotal, tax, shipping, total };
};

/** Grand totals across all stores */
const calcTotals = (items) => {
  const groups = Object.values(groupByStore(items));
  let subtotal = 0, tax = 0, shipping = 0;
  for (const g of groups) {
    const t = calcStoreTotals(g.items);
    subtotal += t.subtotal;
    tax += t.tax;
    shipping += t.shipping;
  }
  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    shipping,
    total: parseFloat((subtotal + tax + shipping).toFixed(2)),
  };
};

// ── persistence ───────────────────────────────────────────────────────────────

const loadCart = () => {
  try {
    const data = localStorage.getItem("cart");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveCart = (items) => {
  localStorage.setItem("cart", JSON.stringify(items));
};

// ── slice ─────────────────────────────────────────────────────────────────────

const savedItems = loadCart();

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: savedItems,
    ...calcTotals(savedItems),
  },
  reducers: {
    addToCart(state, action) {
      const { productId, name, price, image, stock, storeId, storeName, vendorId } = action.payload;

      const existing = state.items.find((i) => i.productId === productId);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + 1, stock);
      } else {
        state.items.push({ productId, name, price, image, stock, storeId, storeName, vendorId, quantity: 1 });
      }

      Object.assign(state, calcTotals(state.items));
      saveCart(state.items);
    },

    removeFromCart(state, action) {
      state.items = state.items.filter((i) => i.productId !== action.payload);
      Object.assign(state, calcTotals(state.items));
      saveCart(state.items);
    },

    updateQuantity(state, action) {
      const { productId, quantity } = action.payload;
      const item = state.items.find((i) => i.productId === productId);
      if (item) {
        item.quantity = Math.max(1, Math.min(quantity, item.stock));
      }
      Object.assign(state, calcTotals(state.items));
      saveCart(state.items);
    },

    clearCart(state) {
      state.items = [];
      state.subtotal = 0;
      state.tax = 0;
      state.shipping = 0;
      state.total = 0;
      localStorage.removeItem("cart");
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
