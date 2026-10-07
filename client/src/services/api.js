import axios from "axios";

/*
 * Single place for every backend call.
 * If your backend field names differ, fix them HERE (see the "ADAPTERS" section).
 */
const API_URL = import.meta.env.VITE_API_URL || "/api";

// ---------- token storage (swap for cookies later by editing only this block) ----------
const KEYS = { access: "lnz_access", refresh: "lnz_refresh", user: "lnz_user" };
export const tokenStore = {
  getAccess: () => localStorage.getItem(KEYS.access),
  getRefresh: () => localStorage.getItem(KEYS.refresh),
  getUser: () => {
    try { return JSON.parse(localStorage.getItem(KEYS.user)); } catch { return null; }
  },
  save: ({ accessToken, refreshToken, user }) => {
    if (accessToken) localStorage.setItem(KEYS.access, accessToken);
    if (refreshToken) localStorage.setItem(KEYS.refresh, refreshToken);
    if (user) localStorage.setItem(KEYS.user, JSON.stringify(user));
  },
  clear: () => Object.values(KEYS).forEach((k) => localStorage.removeItem(k)),
};

const api = axios.create({ baseURL: API_URL, timeout: 20000 });

// Attach the access token to every request
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401: try ONE refresh, then retry the original request. Never loops.
let refreshPromise = null;
const isAuthUrl = (url = "") => /\/auth\/(login|register|refresh|logout)/.test(url);

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    if (status !== 401 || !original || original._retry || isAuthUrl(original.url)) {
      return Promise.reject(error);
    }
    const refreshToken = tokenStore.getRefresh();
    if (!refreshToken) {
      tokenStore.clear();
      window.dispatchEvent(new Event("lnz:logout"));
      return Promise.reject(error);
    }
    original._retry = true;
    try {
      // one shared refresh call even if many requests fail together
      refreshPromise ??= axios.post(`${API_URL}/auth/refreshAccessToken`, { refreshToken }).finally(() => { refreshPromise = null; });
      const res = await refreshPromise;
      const newAccess = dig(res.data, "accessToken");
      const newRefresh = dig(res.data, "refreshToken");
      if (!newAccess) throw new Error("No access token in refresh response");
      tokenStore.save({ accessToken: newAccess, refreshToken: newRefresh });
      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch (refreshError) {
      tokenStore.clear();
      window.dispatchEvent(new Event("lnz:logout"));
      return Promise.reject(refreshError);
    }
  }
);

// ---------- ADAPTERS: tolerate different response wrappers ----------
// finds `key` at top level, or inside data / data.data
export function dig(obj, key) {
  if (!obj || typeof obj !== "object") return undefined;
  if (obj[key] !== undefined) return obj[key];
  if (obj.data && typeof obj.data === "object") return dig(obj.data, key);
  return undefined;
}
const asArray = (v) => (Array.isArray(v) ? v : []);

export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error?.response) return error?.code === "ERR_NETWORK" ? "Cannot reach the server. Is the backend running?" : fallback;
  const d = error.response.data;
  return (typeof d === "string" ? null : d?.message || d?.error) || fallback;
}

// Backend returns category as { _id, name } (populated) or a plain id string.
export const categoryName = (product) => {
  const c = product?.category;
  return typeof c === "object" && c ? c.name || "" : "";
};

export const getImageUrl = (product) => {
  const first = product?.images?.[0] ?? product?.image;
  return typeof first === "string" ? first : first?.url || first?.secure_url || "";
};
export const getImageUrls = (product) =>
  asArray(product?.images).map((i) => (typeof i === "string" ? i : i?.url || i?.secure_url)).filter(Boolean);

export const formatPrice = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n) || 0);

// ---------- AUTH ----------
export const authApi = {
  register: ({ name, email, password }) => api.post("/auth/register", { name, email, password, role: "client" }),
  login: async ({ email, password }) => {
    const res = await api.post("/auth/login", { email, password });
    return {
      accessToken: dig(res.data, "accessToken"),
      refreshToken: dig(res.data, "refreshToken"),
      user: dig(res.data, "user"),
    };
  },
  // Your backend has no mounted /auth/logout route, so logout is local (tokens are deleted in AuthContext).
};

// ---------- PRODUCTS ----------
export const productApi = {
  // Backend paginates (default 10 per page), so we ask for 100 at a time and fetch every page.
  list: async () => {
    const all = [];
    let page = 1;
    let pages = 1;
    do {
      const res = await api.get("/products", { params: { page, limit: 100 } });
      all.push(...asArray(res.data?.data ?? res.data?.products));
      pages = res.data?.pagination?.pages || 1;
      page += 1;
    } while (page <= pages && page <= 20);
    return all.filter((p) => p.isActive !== false);
  },
  get: async (id) => {
    const res = await api.get(`/products/${id}`);
    return dig(res.data, "product") ?? res.data?.data ?? res.data;
  },
};

// ---------- CART ----------
export const cartApi = {
  get: async () => {
    const res = await api.get("/cart");
    const cart = dig(res.data, "cart") ?? res.data?.data ?? res.data;
    return asArray(cart?.items ?? cart?.products);
  },
  add: (productId, quantity = 1) => api.post("/cart/items", { productId, quantity }),
  update: (productId, quantity) => api.put(`/cart/items/${productId}`, { quantity }),
  remove: (productId) => api.delete(`/cart/items/${productId}`),
  clear: () => api.delete("/cart"),
};

// ---------- ORDERS ----------
// Change this ONE function if your backend expects a different order body.
export const buildOrderPayload = ({ shippingAddress, paymentMethod }) => ({
  shippingAddress: {
    fullName: shippingAddress.fullName,
    phone: shippingAddress.phone,
    address: shippingAddress.address,
    city: shippingAddress.city,
    state: shippingAddress.state,
    pincode: shippingAddress.pincode,
  },
  paymentMethod, // "COD" now; "ONLINE" when Razorpay is added
});

export const normalizeOrder = (o) => ({
  ...o,
  id: o._id || o.id,
  items: asArray(o.items),
  total: o.totalAmount ?? 0,
  createdAt: o.createdAt || o.date,
});

export const orderApi = {
  create: async (payload) => {
    const res = await api.post("/orders", buildOrderPayload(payload));
    const order = dig(res.data, "order") ?? res.data?.data ?? res.data;
    return order ? normalizeOrder(order) : null;
  },
  myOrders: async () => {
    const res = await api.get("/orders/my-orders");
    return asArray(dig(res.data, "orders") ?? res.data?.data ?? res.data).map(normalizeOrder);
  },
  get: async (id) => {
    const res = await api.get(`/orders/my-orders/${id}`);
    return normalizeOrder(dig(res.data, "order") ?? res.data?.data ?? res.data);
  },
  cancel: (id) => api.put(`/orders/my-orders/${id}/cancel`),
};

export default api;
