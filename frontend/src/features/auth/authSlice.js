import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosInstance";

const userFromStorage = localStorage.getItem("userInfo")
  ? JSON.parse(localStorage.getItem("userInfo"))
  : null;

const initialState = {
  userInfo: userFromStorage,
  loading: false,
  error: null,
};

export const register = createAsyncThunk(
  "auth/register",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/register", formData);
      localStorage.setItem("userInfo", JSON.stringify(data.data));
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Registration failed"
      );
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/login", formData);
      localStorage.setItem("userInfo", JSON.stringify(data.data));
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (formData, { getState, rejectWithValue }) => {
    try {
      const { data } = await api.put("/auth/profile", formData);
      const updated = { ...getState().auth.userInfo, ...data.data };
      localStorage.setItem("userInfo", JSON.stringify(updated));
      return updated;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update profile");
    }
  }
);

export const updatePassword = createAsyncThunk(
  "auth/updatePassword",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.put("/auth/password", formData);
      return data.message;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update password");
    }
  }
);

export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/auth/me");
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch profile");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.userInfo = null;
      state.error = null;
      localStorage.removeItem("userInfo");
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.userInfo = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.userInfo = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.userInfo = { ...state.userInfo, ...action.payload };
      })
      .addCase(updateProfile.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.userInfo = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updatePassword.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updatePassword.fulfilled, (state) => { state.loading = false; })
      .addCase(updatePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
