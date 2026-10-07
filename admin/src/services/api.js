import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

// ---------- token storage ----------
const KEYS = { access: "lnz_admin_access", refresh: "lnz_admin_refresh", user: "lnz_admin_user" };
export const tokenStore = {
  getAccess: () => localStorage.getItem(KEYS.access),
  getRefresh: () => localStorage.getItem(KEYS.refresh),
  getUser: () => { try { return JSON.parse(localStorage.getItem(KEYS.user)); } catch { return null; } },
  save: ({ accessToken, refreshToken, user }) => {
    if (accessToken) localStorage.setItem(KEYS.access, accessToken);
    if (refreshToken) localStorage.setItem(KEYS.refresh, refreshToken);
    if (user) localStorage.setItem(KEYS.user, JSON.stringify(user));
  },
  clear: () => Object.values(KEYS).forEach((k) => localStorage.removeItem(k)),
};

const api = axios.create({ baseURL: API_URL, timeout: 60000 }); // long timeout: image uploads go to Cloudinary

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401: refresh once, retry once. Never loops.
let refreshPromise = null;
const isAuthUrl = (url = "") => /\/auth\//.test(url);

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || !original || original._retry || isAuthUrl(original.url)) return Promise.reject(error);
    const refreshToken = tokenStore.getRefresh();
    if (!refreshToken) {
      tokenStore.clear();
      window.dispatchEvent(new Event("lnz:logout"));
      return Promise.reject(error);
    }
    original._retry = true;
    try {
      refreshPromise ??= axios.post(`${API_URL}/auth/refreshAccessToken`, { refreshToken }).finally(() => { refreshPromise = null; });
      const res = await refreshPromise;
      const newAccess = res.data?.accessToken;
      if (!newAccess) throw new Error("No access token in refresh response");
      tokenStore.save({ accessToken: newAccess });
      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch (e) {
      tokenStore.clear();
      window.dispatchEvent(new Event("lnz:logout"));
      return Promise.reject(e);
    }
  }
);

// ---------- helpers ----------
const asArray = (v) => (Array.isArray(v) ? v : []);

export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error?.response) return error?.code === "ERR_NETWORK" ? "Cannot reach the server. Is the backend running?" : fallback;
  const d = error.response.data;
  if (Array.isArray(d?.errors) && d.errors.length) return d.errors.join(". ");
  return (typeof d === "string" ? null : d?.message) || fallback;
}
export const categoryOf = (p) => (typeof p?.category === "object" && p.category ? p.category : { _id: p?.category || "", name: "" });
export const formatPrice = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n) || 0);

// ---------- AUTH ----------
export const authApi = {
  login: async ({ email, password }) => {
    const res = await api.post("/auth/login", { email, password });
    return { accessToken: res.data?.accessToken, refreshToken: res.data?.refreshToken, user: res.data?.user };
  },
};

// ---------- PRODUCTS ----------
// NOTE: GET /products only returns ACTIVE products (backend filters isActive: true).
export const productApi = {
  list: async () => {
    const all = [];
    let page = 1, pages = 1;
    do {
      const res = await api.get("/products", { params: { page, limit: 100 } });
      all.push(...asArray(res.data?.data));
      pages = res.data?.pagination?.pages || 1;
      page += 1;
    } while (page <= pages && page <= 20);
    return all;
  },
  get: async (id) => (await api.get(`/products/${id}`)).data?.data,
  create: (formData) => api.post("/products", formData),   // multipart: axios sets the boundary itself
  update: (id, formData) => api.put(`/products/${id}`, formData),
  remove: (id) => api.delete(`/products/${id}`),
};

// ---------- CATEGORIES ----------
export const categoryApi = {
  list: async () => asArray((await api.get("/categories")).data?.data),
  create: (body) => api.post("/categories", body),
  update: (id, body) => api.put(`/categories/${id}`, body),
  remove: (id) => api.delete(`/categories/${id}`),
};

// ---------- ORDERS (admin) ----------
export const orderApi = {
  list: async () => asArray((await api.get("/orders", { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }, params: { _: Date.now() } })).data?.data),
  updateStatus: async (id, orderStatus) => (await api.put(`/orders/${id}/status`, { orderStatus })).data?.data,
};

export default api;
