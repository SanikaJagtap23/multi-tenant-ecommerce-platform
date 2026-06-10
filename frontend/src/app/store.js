import { configureStore } from "@reduxjs/toolkit";
import authReducer    from "../features/auth/authSlice";
import storeReducer   from "../features/store/storeSlice";
import productReducer from "../features/product/productSlice";
import cartReducer    from "../features/cart/cartSlice";
import orderReducer   from "../features/order/orderSlice";
import wishlistReducer from "../features/wishlist/wishlistSlice";
import paymentReducer from "../features/payment/paymentSlice";

const store = configureStore({
  reducer: {
    auth:     authReducer,
    store:    storeReducer,
    product:  productReducer,
    cart:     cartReducer,
    order:    orderReducer,
    wishlist: wishlistReducer,
    payment:  paymentReducer,
  },
});

export default store;
