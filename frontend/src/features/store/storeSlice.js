import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosInstance";

export const fetchMyStore = createAsyncThunk(
  "store/fetchMyStore",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/stores/vendor/my-store");
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch store");
    }
  },
  {
    condition: (_, { getState }) => {
      const { store } = getState();
      if (store.loading) return false;
    },
  }
);

export const createStore = createAsyncThunk(
  "store/createStore",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/stores", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create store");
    }
  }
);

export const updateStore = createAsyncThunk(
  "store/updateStore",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/stores/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update store");
    }
  }
);

export const fetchAllStores = createAsyncThunk(
  "store/fetchAllStores",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/stores");
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch stores");
    }
  }
);

const storeSlice = createSlice({
  name: "store",
  initialState: {
    myStore: null,
    stores: [],
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    clearStoreState: (state) => {
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    const setLoading = (state) => {
      state.loading = true;
      state.error = null;
      state.success = false;
    };
    const setError = (state, action) => {
      state.loading = false;
      state.error = action.payload;
    };

    builder
      .addCase(fetchMyStore.pending, setLoading)
      .addCase(fetchMyStore.fulfilled, (state, action) => {
        state.loading = false;
        state.myStore = action.payload;
      })
      .addCase(fetchMyStore.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.myStore = null;
      })
      .addCase(createStore.pending, setLoading)
      .addCase(createStore.fulfilled, (state, action) => {
        state.loading = false;
        state.myStore = action.payload;
        state.success = true;
      })
      .addCase(createStore.rejected, setError)
      .addCase(updateStore.pending, setLoading)
      .addCase(updateStore.fulfilled, (state, action) => {
        state.loading = false;
        state.myStore = action.payload;
        state.success = true;
      })
      .addCase(updateStore.rejected, setError)
      .addCase(fetchAllStores.pending, setLoading)
      .addCase(fetchAllStores.fulfilled, (state, action) => {
        state.loading = false;
        state.stores = action.payload;
      })
      .addCase(fetchAllStores.rejected, setError);
  },
});

export const { clearStoreState } = storeSlice.actions;
export default storeSlice.reducer;
