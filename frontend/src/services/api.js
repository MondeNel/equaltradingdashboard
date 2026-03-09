import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => api.get('/auth/me'),
}

export const walletAPI = {
  get:          ()       => api.get('/wallet'),
  deposit:      (amount) => api.post('/wallet/deposit',  { amount }),
  withdraw:     (amount) => api.post('/wallet/withdraw', { amount }),
  transactions: ()       => api.get('/wallet/transactions'),
}

export const tradesAPI = {
  open:     ()   => api.get('/trades/open'),
  close:    (id) => api.post(`/trades/${id}/close`),
  closeAll: ()   => api.post('/trades/close-all'),
  history:  ()   => api.get('/trades/history'),
}

export const ordersAPI = {
  list:   ()     => api.get('/orders'),
  place:  (data) => api.post('/orders', data),
  cancel: (id)   => api.delete(`/orders/${id}`),
}

export const pricesAPI = {
  all: ()       => api.get('/prices'),
  get: (symbol) => api.get(`/prices/${encodeURIComponent(symbol)}`),
}

export const peterAPI = {
  analyse: (data) => api.post('/peter/analyse', data),
}

export default api