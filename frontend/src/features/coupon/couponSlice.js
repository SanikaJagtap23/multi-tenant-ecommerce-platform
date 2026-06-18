import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance";

export const fetchVendorCoupons = createAsyncThunk(
  "coupon/fetchVendorCoupons",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/coupons/mine");
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load coupons");
    }
  }
);

export const createCoupon = createAsyncThunk(
  "coupon/createCoupon",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/coupons", payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create coupon");
    }
  }
);

export const deleteCoupon = createAsyncThunk(
  "coupon/deleteCoupon",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/coupons/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete coupon");
    }
  }
);

export const toggleCoupon = createAsyncThunk(
  "coupon/toggleCoupon",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(`/coupons/${id}/toggle`);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update coupon");
    }
  }
);

const couponSlice = createSlice({
  name: "coupon",
  initialState: {
    coupons: [],
    loading: false,
    error:   null,
  },
  reducers: {
    clearCouponError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendorCoupons.pending,  (s) => { s.loading = true;  s.error = null; })
      .addCase(fetchVendorCoupons.fulfilled,(s, a) => { s.loading = false; s.coupons = a.payload; })
      .addCase(fetchVendorCoupons.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(createCoupon.pending,  (s) => { s.loading = true;  s.error = null; })
      .addCase(createCoupon.fulfilled,(s, a) => { s.loading = false; s.coupons.unshift(a.payload); })
      .addCase(createCoupon.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(deleteCoupon.fulfilled,(s, a) => {
        s.coupons = s.coupons.filter((c) => c._id !== a.payload);
      })
      .addCase(deleteCoupon.rejected, (s, a) => { s.error = a.payload; })

      .addCase(toggleCoupon.fulfilled,(s, a) => {
        const idx = s.coupons.findIndex((c) => c._id === a.payload._id);
        if (idx !== -1) s.coupons[idx] = a.payload;
      });
  },
});

export const { clearCouponError } = couponSlice.actions;
export default couponSlice.reducer;
