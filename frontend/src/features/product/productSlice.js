import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosInstance";

export const fetchMyProducts = createAsyncThunk(
  "product/fetchMyProducts",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/products/vendor/my-products");
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch products");
    }
  },
  {
    condition: (_, { getState }) => {
      const { product } = getState();
      if (product.loading) return false;
    },
  }
);

export const fetchAllProducts = createAsyncThunk(
  "product/fetchAllProducts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/products", { params });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch products");
    }
  }
);

export const fetchProductById = createAsyncThunk(
  "product/fetchProductById",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/products/${id}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch product");
    }
  }
);

export const createProduct = createAsyncThunk(
  "product/createProduct",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create product");
    }
  }
);

export const updateProduct = createAsyncThunk(
  "product/updateProduct",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/products/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update product");
    }
  }
);

export const deleteProduct = createAsyncThunk(
  "product/deleteProduct",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/products/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete product");
    }
  }
);

const productSlice = createSlice({
  name: "product",
  initialState: {
    products: [],
    myProducts: [],
    selectedProduct: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    clearProductState: (state) => {
      state.error = null;
      state.success = false;
      state.selectedProduct = null;
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
      .addCase(fetchMyProducts.pending, setLoading)
      .addCase(fetchMyProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.myProducts = action.payload;
      })
      .addCase(fetchMyProducts.rejected, setError)
      .addCase(fetchAllProducts.pending, setLoading)
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchAllProducts.rejected, setError)
      .addCase(fetchProductById.pending, setLoading)
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, setError)
      .addCase(createProduct.pending, setLoading)
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.myProducts.unshift(action.payload);
        state.success = true;
      })
      .addCase(createProduct.rejected, setError)
      .addCase(updateProduct.pending, setLoading)
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.myProducts = state.myProducts.map((p) =>
          p._id === action.payload._id ? action.payload : p
        );
        state.success = true;
      })
      .addCase(updateProduct.rejected, setError)
      .addCase(deleteProduct.pending, setLoading)
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.myProducts = state.myProducts.filter((p) => p._id !== action.payload);
        state.success = true;
      })
      .addCase(deleteProduct.rejected, setError);
  },
});

export const { clearProductState } = productSlice.actions;
export default productSlice.reducer;
