import { configureStore } from "@reduxjs/toolkit";
import authReducer    from "../features/auth/authSlice";
import storeReducer   from "../features/store/storeSlice";
import productReducer from "../features/product/productSlice";
import cartReducer    from "../features/cart/cartSlice";
import orderReducer   from "../features/order/orderSlice";
import wishlistReducer from "../features/wishlist/wishlistSlice";
import paymentReducer from "../features/payment/paymentSlice";
import adminReducer   from "../features/admin/adminSlice";
import couponReducer  from "../features/coupon/couponSlice";

const store = configureStore({
  reducer: {
    auth:     authReducer,
    store:    storeReducer,
    product:  productReducer,
    cart:     cartReducer,
    order:    orderReducer,
    wishlist: wishlistReducer,
    payment:  paymentReducer,
    admin:    adminReducer,
    coupon:   couponReducer,
  },
});

export default store;
