import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance";

export const createOrder = createAsyncThunk(
  "order/create",
  async (orderData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/orders", orderData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createPaymentIntent = createAsyncThunk(
  "order/paymentIntent",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/orders/payment-intent", payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchMyOrders = createAsyncThunk(
  "order/fetchMy",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/orders/my");
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  "order/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/orders/${id}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchVendorOrders = createAsyncThunk(
  "order/fetchVendor",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/orders/vendor/orders", { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  "order/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(`/orders/${id}/status`, { status });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchVendorAnalytics = createAsyncThunk(
  "order/vendorAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/orders/vendor/analytics");
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchAdminAnalytics = createAsyncThunk(
  "order/adminAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/orders/admin/analytics");
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchAllOrdersAdmin = createAsyncThunk(
  "order/fetchAdmin",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/orders/admin/all", { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const orderSlice = createSlice({
  name: "order",
  initialState: {
    myOrders: [],
    vendorOrders: [],
    adminOrders: [],
    selectedOrder: null,
    vendorAnalytics: null,
    adminAnalytics: null,
    placedOrder: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    clearOrderState(state) {
      state.error = null;
      state.success = false;
      state.placedOrder = null;
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.loading = true; state.error = null; };
    const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(createOrder.pending, pending)
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.placedOrder = action.payload;
      })
      .addCase(createOrder.rejected, rejected)

      .addCase(fetchMyOrders.pending, pending)
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.myOrders = action.payload;
      })
      .addCase(fetchMyOrders.rejected, rejected)

      .addCase(fetchOrderById.pending, pending)
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, rejected)

      .addCase(fetchVendorOrders.pending, pending)
      .addCase(fetchVendorOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.vendorOrders = action.payload.orders;
      })
      .addCase(fetchVendorOrders.rejected, rejected)

      .addCase(updateOrderStatus.pending, pending)
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        state.vendorOrders = state.vendorOrders.map((o) =>
          o._id === updated._id ? updated : o
        );
        state.adminOrders = state.adminOrders.map((o) =>
          o._id === updated._id ? updated : o
        );
      })
      .addCase(updateOrderStatus.rejected, rejected)

      .addCase(fetchVendorAnalytics.pending, pending)
      .addCase(fetchVendorAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.vendorAnalytics = action.payload;
      })
      .addCase(fetchVendorAnalytics.rejected, rejected)

      .addCase(fetchAdminAnalytics.pending, pending)
      .addCase(fetchAdminAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.adminAnalytics = action.payload;
      })
      .addCase(fetchAdminAnalytics.rejected, rejected)

      .addCase(fetchAllOrdersAdmin.pending, pending)
      .addCase(fetchAllOrdersAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.adminOrders = action.payload.orders;
      })
      .addCase(fetchAllOrdersAdmin.rejected, rejected);
  },
});

export const { clearOrderState } = orderSlice.actions;
export default orderSlice.reducer;
