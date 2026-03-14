import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8001";

const api = axios.create({ baseURL: BASE });

// ── Inject JWT on every request ───────────────────────────────────────────────
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem("equal_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ── Handle 401 — clear auth and redirect to login ────────────────────────────
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const hadToken = !!localStorage.getItem("equal_token");
      localStorage.removeItem("equal_token");
      localStorage.removeItem("equal_user");
      if (hadToken) window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post("/api/auth/register", data),
  // data: { display_name, email, password, country, currency_code, currency_symbol }

  login: (email, password) =>
    api.post("/api/auth/login", new URLSearchParams({ username: email, password }), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }),

  me: () => api.get("/api/auth/me"),
};

// ── Wallet ────────────────────────────────────────────────────────────────────
export const walletAPI = {
  get:      ()           => api.get("/api/wallet"),
  deposit:  (amount)     => api.post("/api/wallet/deposit",  { amount }),
  withdraw: (amount)     => api.post("/api/wallet/withdraw", { amount }),
  history:  ()           => api.get("/api/wallet/history"),
};

// ── Prices ────────────────────────────────────────────────────────────────────
export const pricesAPI = {
  get: (symbol) => api.get(`/api/prices/${symbol}`),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const ordersAPI = {
  place:    (data) => api.post("/api/orders/place", data),
  pending:  ()     => api.get("/api/orders/pending"),
  cancel:   (id)   => api.delete(`/api/orders/${id}`),
  activate: (id, price) => api.post(`/api/orders/${id}/activate`, { activation_price: price }),
};

// ── Trades ────────────────────────────────────────────────────────────────────
export const tradesAPI = {
  open:     ()                         => api.get("/api/trades/open"),
  close:    (id, closePrice, reason)   => api.post(`/api/trades/${id}/close`, {
    close_price: closePrice ?? null,
    close_reason: reason ?? "MANUAL",
  }),
  closeAll: ()                         => api.post("/api/trades/close-all"),
  history:  ()                         => api.get("/api/trades/history"),
};

// ── Subscriptions ────────────────────────────────────────────────────────────
export const subscriptionAPI = {
  plans:   ()     => api.get("/api/subscriptions/plans"),
  me:      ()     => api.get("/api/subscriptions/me"),
  upgrade: (plan) => api.post("/api/subscriptions/upgrade", { plan }),
};

// ── Peter ────────────────────────────────────────────────────────────────────
export const peterAPI = {
  analyse: (data) => api.post("/api/peter/analyse", data),
};

export default api;
