import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance";

export const createPaymentIntent = createAsyncThunk(
  "payment/createIntent",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/payments/intent", payload);
      return data; // { intentId, orderIds, total }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const confirmPayment = createAsyncThunk(
  "payment/confirm",
  async (intentId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(`/payments/confirm/${intentId}`);
      return data; // { success, orders }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const failPayment = createAsyncThunk(
  "payment/fail",
  async ({ intentId, reason }, { rejectWithValue }) => {
    try {
      await axiosInstance.post(`/payments/fail/${intentId}`, { reason });
      return { success: true };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const paymentSlice = createSlice({
  name: "payment",
  initialState: {
    intentId:        null,
    orderIds:        [],
    total:           0,
    confirmedOrders: [],
    loading:         false,
    error:           null,
  },
  reducers: {
    clearPaymentState(state) {
      state.intentId        = null;
      state.orderIds        = [];
      state.total           = 0;
      state.confirmedOrders = [];
      state.error           = null;
    },
  },
  extraReducers: (builder) => {
    const pending  = (state)         => { state.loading = true;  state.error = null; };
    const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(createPaymentIntent.pending, pending)
      .addCase(createPaymentIntent.fulfilled, (state, action) => {
        state.loading  = false;
        state.intentId = action.payload.intentId;
        state.orderIds = action.payload.orderIds;
        state.total    = action.payload.total;
      })
      .addCase(createPaymentIntent.rejected, rejected)

      .addCase(confirmPayment.pending, pending)
      .addCase(confirmPayment.fulfilled, (state, action) => {
        state.loading        = false;
        state.confirmedOrders = action.payload.orders;
      })
      .addCase(confirmPayment.rejected, rejected)

      .addCase(failPayment.pending,   pending)
      .addCase(failPayment.fulfilled, (state) => { state.loading = false; })
      .addCase(failPayment.rejected,  rejected);
  },
});

export const { clearPaymentState } = paymentSlice.actions;
export default paymentSlice.reducer;
