import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosInstance";

export const fetchWishlist = createAsyncThunk(
  "wishlist/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/wishlist");
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load wishlist");
    }
  }
);

export const toggleWishlist = createAsyncThunk(
  "wishlist/toggle",
  async (productId, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/wishlist/${productId}`);
      return data; // { wishlisted, wishlist }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update wishlist");
    }
  }
);

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: {
    items: [],       // populated product objects
    ids: [],         // just IDs for quick look-up
    loading: false,
    error: null,
  },
  reducers: {
    clearWishlist: (state) => {
      state.items = [];
      state.ids = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => { state.loading = true; })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.ids = action.payload.map((p) => p._id);
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        // Update IDs list from the server response
        state.ids = action.payload.wishlist.map((id) =>
          typeof id === "object" ? id._id || id.toString() : id.toString()
        );
      });
  },
});

export const { clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
