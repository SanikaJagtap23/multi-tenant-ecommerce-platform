import { describe, it, expect, beforeEach, vi } from "vitest";
import authReducer, {
  logout,
  clearError,
  openAuthModal,
  closeAuthModal,
  login,
  register,
} from "../features/auth/authSlice";

// Mock axios so async thunks don't make real HTTP calls
vi.mock("../api/axiosInstance", () => ({
  default: {
    post: vi.fn(),
    get:  vi.fn(),
    put:  vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request:  { use: vi.fn() },
      response: { use: vi.fn() },
    },
    create: vi.fn(),
  },
}));

const initialState = {
  userInfo:      null,
  addresses:     [],
  loading:       false,
  error:         null,
  authModalOpen: false,
  authModalTab:  "customer",
};

describe("authSlice — initial state", () => {
  it("has correct initial state when localStorage is empty", () => {
    localStorage.removeItem("userInfo");
    // Re-derive initial state by running reducer with undefined
    const state = authReducer(undefined, { type: "@@INIT" });

    expect(state.userInfo).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.authModalOpen).toBe(false);
  });
});

describe("authSlice — synchronous actions", () => {
  it("logout clears userInfo and addresses", () => {
    const loggedInState = { ...initialState, userInfo: { _id: "1", name: "Test", token: "abc" } };
    const state = authReducer(loggedInState, logout());

    expect(state.userInfo).toBeNull();
    expect(state.addresses).toEqual([]);
    expect(state.error).toBeNull();
  });

  it("logout removes userInfo from localStorage", () => {
    localStorage.setItem("userInfo", JSON.stringify({ _id: "1", token: "abc" }));
    authReducer(initialState, logout());
    expect(localStorage.getItem("userInfo")).toBeNull();
  });

  it("clearError sets error to null", () => {
    const errorState = { ...initialState, error: "Something went wrong" };
    const state = authReducer(errorState, clearError());
    expect(state.error).toBeNull();
  });

  it("openAuthModal opens the modal and sets tab", () => {
    const state = authReducer(initialState, openAuthModal("vendor"));

    expect(state.authModalOpen).toBe(true);
    expect(state.authModalTab).toBe("vendor");
    expect(state.error).toBeNull();
  });

  it("openAuthModal defaults to customer tab when no payload", () => {
    const state = authReducer(initialState, openAuthModal());
    expect(state.authModalTab).toBe("customer");
  });

  it("closeAuthModal closes the modal and clears error", () => {
    const openState = { ...initialState, authModalOpen: true, error: "Some error" };
    const state = authReducer(openState, closeAuthModal());

    expect(state.authModalOpen).toBe(false);
    expect(state.error).toBeNull();
  });
});

describe("authSlice — async thunk state transitions", () => {
  it("sets loading=true when login.pending fires", () => {
    const state = authReducer(initialState, { type: login.pending.type });
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it("sets userInfo and loading=false when login.fulfilled fires", () => {
    const user = { _id: "1", name: "John", email: "john@example.com", role: "customer", token: "tok" };
    const state = authReducer(initialState, { type: login.fulfilled.type, payload: user });

    expect(state.loading).toBe(false);
    expect(state.userInfo).toEqual(user);
  });

  it("sets error and loading=false when login.rejected fires", () => {
    const state = authReducer(initialState, { type: login.rejected.type, payload: "Invalid credentials" });

    expect(state.loading).toBe(false);
    expect(state.error).toBe("Invalid credentials");
    expect(state.userInfo).toBeNull();
  });

  it("sets loading=true when register.pending fires", () => {
    const state = authReducer(initialState, { type: register.pending.type });
    expect(state.loading).toBe(true);
  });

  it("sets userInfo when register.fulfilled fires", () => {
    const user = { _id: "2", name: "Jane", email: "jane@example.com", role: "vendor", token: "tok2" };
    const state = authReducer(initialState, { type: register.fulfilled.type, payload: user });

    expect(state.userInfo).toEqual(user);
    expect(state.loading).toBe(false);
  });

  it("sets error when register.rejected fires", () => {
    const state = authReducer(initialState, { type: register.rejected.type, payload: "Email already exists" });

    expect(state.error).toBe("Email already exists");
    expect(state.loading).toBe(false);
  });
});
