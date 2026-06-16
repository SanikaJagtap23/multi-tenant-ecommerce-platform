import { describe, it, expect, beforeEach } from "vitest";
import cartReducer, {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  initCart,
} from "../features/cart/cartSlice";

// cartSlice uses localStorage — jsdom provides it in the test environment

const item1 = {
  productId: "prod-1",
  name:      "Wireless Headphones",
  price:     999,
  image:     "",
  stock:     10,
  storeId:   "store-1",
  storeName: "Tech Store",
  vendorId:  "vendor-1",
};

const item2 = {
  productId: "prod-2",
  name:      "USB Cable",
  price:     199,
  image:     "",
  stock:     5,
  storeId:   "store-1",
  storeName: "Tech Store",
  vendorId:  "vendor-1",
};

const emptyState = {
  userId:   null,
  items:    [],
  subtotal: 0,
  tax:      0,
  shipping: 0,
  total:    0,
};

describe("cartSlice — addToCart", () => {
  it("adds a new item to an empty cart", () => {
    const state = cartReducer(emptyState, addToCart(item1));

    expect(state.items).toHaveLength(1);
    expect(state.items[0].productId).toBe("prod-1");
    expect(state.items[0].quantity).toBe(1);
  });

  it("increments quantity when the same item is added again", () => {
    let state = cartReducer(emptyState, addToCart(item1));
    state     = cartReducer(state, addToCart(item1));

    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
  });

  it("does not exceed stock limit when adding", () => {
    let state = cartReducer(emptyState, addToCart({ ...item1, stock: 2 }));
    state     = cartReducer(state, addToCart({ ...item1, stock: 2 }));
    state     = cartReducer(state, addToCart({ ...item1, stock: 2 })); // would be 3 but stock is 2

    expect(state.items[0].quantity).toBe(2);
  });

  it("adds a second distinct item", () => {
    let state = cartReducer(emptyState, addToCart(item1));
    state     = cartReducer(state, addToCart(item2));

    expect(state.items).toHaveLength(2);
  });
});

describe("cartSlice — totals calculation", () => {
  it("calculates subtotal and tax correctly", () => {
    // price=999, qty=1 → subtotal=999, tax=99.9, shipping=0 (999 >= 500 free threshold)
    const state = cartReducer(emptyState, addToCart(item1));

    expect(state.subtotal).toBe(999);
    expect(state.tax).toBeCloseTo(99.9, 1);
    expect(state.total).toBeCloseTo(999 + 99.9 + 0, 1);
  });

  it("applies free shipping when subtotal is ≥ ₹500", () => {
    // item1 price=999 → free shipping
    const state = cartReducer(emptyState, addToCart(item1));
    expect(state.shipping).toBe(0);
  });

  it("charges ₹49 shipping when subtotal is < ₹500", () => {
    // item2 price=199 → paid shipping
    const state = cartReducer(emptyState, addToCart(item2));
    expect(state.shipping).toBe(49);
  });

  it("recalculates totals after quantity update", () => {
    let state = cartReducer(emptyState, addToCart(item2)); // qty=1, price=199
    state = cartReducer(state, updateQuantity({ productId: "prod-2", quantity: 3 })); // qty=3

    expect(state.subtotal).toBe(597);
    expect(state.tax).toBeCloseTo(59.7, 1);
    expect(state.shipping).toBe(0); // 597 > 500 → free
  });
});

describe("cartSlice — removeFromCart", () => {
  it("removes an item from the cart", () => {
    let state = cartReducer(emptyState, addToCart(item1));
    state     = cartReducer(state, addToCart(item2));
    state     = cartReducer(state, removeFromCart("prod-1"));

    expect(state.items).toHaveLength(1);
    expect(state.items[0].productId).toBe("prod-2");
  });

  it("recalculates totals after removal", () => {
    let state = cartReducer(emptyState, addToCart(item1));
    state     = cartReducer(state, removeFromCart("prod-1"));

    expect(state.subtotal).toBe(0);
    expect(state.tax).toBe(0);
    expect(state.total).toBe(0);
  });

  it("does nothing when removing a non-existent product ID", () => {
    let state = cartReducer(emptyState, addToCart(item1));
    state     = cartReducer(state, removeFromCart("non-existent-id"));

    expect(state.items).toHaveLength(1);
  });
});

describe("cartSlice — updateQuantity", () => {
  it("updates the quantity of an existing item", () => {
    let state = cartReducer(emptyState, addToCart(item1));
    state     = cartReducer(state, updateQuantity({ productId: "prod-1", quantity: 5 }));

    expect(state.items[0].quantity).toBe(5);
  });

  it("clamps quantity to minimum 1", () => {
    let state = cartReducer(emptyState, addToCart(item1));
    state     = cartReducer(state, updateQuantity({ productId: "prod-1", quantity: 0 }));

    expect(state.items[0].quantity).toBe(1);
  });

  it("clamps quantity to maximum stock", () => {
    let state = cartReducer(emptyState, addToCart({ ...item1, stock: 3 }));
    state     = cartReducer(state, updateQuantity({ productId: "prod-1", quantity: 100 }));

    expect(state.items[0].quantity).toBe(3);
  });
});

describe("cartSlice — clearCart", () => {
  it("empties all items and resets totals", () => {
    let state = cartReducer(emptyState, addToCart(item1));
    state     = cartReducer(state, addToCart(item2));
    state     = cartReducer(state, clearCart());

    expect(state.items).toHaveLength(0);
    expect(state.subtotal).toBe(0);
    expect(state.tax).toBe(0);
    expect(state.shipping).toBe(0);
    expect(state.total).toBe(0);
    expect(state.userId).toBeNull();
  });
});

describe("cartSlice — initCart", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads items from localStorage when userId is provided", () => {
    const userId = "user-123";
    const savedItems = [{ ...item1, quantity: 2 }];
    localStorage.setItem(`cart_${userId}`, JSON.stringify(savedItems));

    const state = cartReducer(emptyState, initCart({ userId }));

    expect(state.userId).toBe(userId);
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
  });

  it("starts with empty cart when localStorage has nothing for userId", () => {
    const state = cartReducer(emptyState, initCart({ userId: "new-user" }));

    expect(state.items).toHaveLength(0);
    expect(state.total).toBe(0);
  });
});
