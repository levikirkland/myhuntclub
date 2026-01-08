import axios from 'axios'

const api = axios.create({
  baseURL: '/api'
})

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global response handler: if unauthorized, redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('token')
      // Avoid importing the router here to prevent circular imports / TDZ errors.
      // Use a hard redirect to the login page instead.
      try { window.location.href = '/login' } catch (e) { /* ignore in non-browser env */ }
    }
    return Promise.reject(err)
  }
)

export default api
