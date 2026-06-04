import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem("userInfo");
  if (userInfo) {
    const { token } = JSON.parse(userInfo);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handling — clear stale session (but NOT on auth endpoints themselves)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthCall = url.includes("/auth/login") || url.includes("/auth/register");

    if (error.response?.status === 401 && !isAuthCall) {
      // Expired / invalid session on a protected route — clear and redirect
      localStorage.removeItem("userInfo");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
