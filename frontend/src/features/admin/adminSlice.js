import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosInstance";

export const fetchAdminStats = createAsyncThunk(
  "admin/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/admin/stats");
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch stats");
    }
  }
);

export const fetchAdminUsers = createAsyncThunk(
  "admin/fetchUsers",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/admin/users", { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch users");
    }
  }
);

export const updateAdminUserStatus = createAsyncThunk(
  "admin/updateUserStatus",
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/admin/users/${id}/status`, { isActive });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update status");
    }
  }
);

export const updateAdminUserRole = createAsyncThunk(
  "admin/updateUserRole",
  async ({ id, role }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/admin/users/${id}/role`, { role });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update role");
    }
  }
);

export const deleteAdminUser = createAsyncThunk(
  "admin/deleteUser",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/users/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete user");
    }
  }
);

export const fetchAdminStores = createAsyncThunk(
  "admin/fetchStores",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/admin/stores", { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch stores");
    }
  }
);

export const toggleAdminStoreStatus = createAsyncThunk(
  "admin/toggleStoreStatus",
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/admin/stores/${id}/status`, { isActive });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update store");
    }
  }
);

export const deleteAdminStore = createAsyncThunk(
  "admin/deleteStore",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/stores/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete store");
    }
  }
);

export const fetchAdminOrders = createAsyncThunk(
  "admin/fetchOrders",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/admin/orders", { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch orders");
    }
  }
);

export const fetchAdminProducts = createAsyncThunk(
  "admin/fetchProducts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/admin/products", { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch products");
    }
  }
);

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    stats:          null,
    users:          [],
    usersTotal:     0,
    stores:         [],
    storesTotal:    0,
    orders:         [],
    ordersTotal:    0,
    products:       [],
    productsTotal:  0,
    loading:        false,
    error:          null,
  },
  reducers: {
    clearAdminError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    const pending  = (state)          => { state.loading = true;  state.error = null; };
    const rejected = (state, action)  => { state.loading = false; state.error = action.payload; };

    builder
      // Stats
      .addCase(fetchAdminStats.pending,   pending)
      .addCase(fetchAdminStats.fulfilled, (state, action) => { state.loading = false; state.stats = action.payload; })
      .addCase(fetchAdminStats.rejected,  rejected)

      // Users
      .addCase(fetchAdminUsers.pending,   pending)
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.loading    = false;
        state.users      = action.payload.data;
        state.usersTotal = action.payload.total;
      })
      .addCase(fetchAdminUsers.rejected, rejected)

      .addCase(updateAdminUserStatus.fulfilled, (state, action) => {
        const idx = state.users.findIndex((u) => u._id === action.payload._id);
        if (idx !== -1) state.users[idx] = action.payload;
      })
      .addCase(updateAdminUserRole.fulfilled, (state, action) => {
        const idx = state.users.findIndex((u) => u._id === action.payload._id);
        if (idx !== -1) state.users[idx] = action.payload;
      })
      .addCase(deleteAdminUser.fulfilled, (state, action) => {
        state.users      = state.users.filter((u) => u._id !== action.payload);
        state.usersTotal = Math.max(0, state.usersTotal - 1);
      })

      // Stores
      .addCase(fetchAdminStores.pending,   pending)
      .addCase(fetchAdminStores.fulfilled, (state, action) => {
        state.loading     = false;
        state.stores      = action.payload.data;
        state.storesTotal = action.payload.total;
      })
      .addCase(fetchAdminStores.rejected, rejected)

      .addCase(toggleAdminStoreStatus.fulfilled, (state, action) => {
        const idx = state.stores.findIndex((s) => s._id === action.payload._id);
        if (idx !== -1) state.stores[idx] = { ...state.stores[idx], isActive: action.payload.isActive };
      })
      .addCase(deleteAdminStore.fulfilled, (state, action) => {
        state.stores      = state.stores.filter((s) => s._id !== action.payload);
        state.storesTotal = Math.max(0, state.storesTotal - 1);
      })

      // Orders
      .addCase(fetchAdminOrders.pending,   pending)
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.loading     = false;
        state.orders      = action.payload.data;
        state.ordersTotal = action.payload.total;
      })
      .addCase(fetchAdminOrders.rejected, rejected)

      // Products
      .addCase(fetchAdminProducts.pending,   pending)
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        state.loading        = false;
        state.products       = action.payload.data;
        state.productsTotal  = action.payload.total;
      })
      .addCase(fetchAdminProducts.rejected, rejected);
  },
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;
