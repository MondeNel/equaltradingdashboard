import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401 — clear token and reload to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const token = localStorage.getItem('access_token')
      // Only force logout if we actually had a token (not a pre-auth request)
      if (token) {
        localStorage.removeItem('access_token')
        window.location.reload()
      }
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login',    data),
  me:       ()     => api.get('/auth/me'),
}

export const walletAPI = {
  get:          ()       => api.get('/wallet'),
  deposit:      (amount) => api.post('/wallet/deposit',  { amount }),
  withdraw:     (amount) => api.post('/wallet/withdraw', { amount }),
  transactions: ()       => api.get('/wallet/history'),
}

export const ordersAPI = {
  list:     ()           => api.get('/orders/pending'),
  place:    (data)       => api.post('/orders/place', data),
  cancel:   (id)         => api.delete(`/orders/${id}/cancel`),
  activate: (id, price)  => api.post(`/orders/${id}/activate?activation_price=${price}`),
}

export const tradesAPI = {
  open:     ()                          => api.get('/trades/open'),
  close:    (id, closePrice, reason)    => api.post(`/trades/${id}/close`, {
    close_price: closePrice ?? null,
    close_reason: reason ?? 'MANUAL',
  }),
  closeAll: ()                          => api.post('/trades/close-all'),
  history:  ()                          => api.get('/trades/history'),
}

export const pricesAPI = {
  all: ()       => api.get('/prices'),
  get: (symbol) => api.get(`/prices/${encodeURIComponent(symbol)}`),
}

export const peterAPI = {
  analyse: (data) => api.post('/peter/analyse', data),
}

export const subscriptionAPI = {
  plans:   ()       => api.get('/subscriptions/plans'),
  me:      ()       => api.get('/subscriptions/me'),
  upgrade: (plan)   => api.post('/subscriptions/upgrade', { plan }),
}

export default api