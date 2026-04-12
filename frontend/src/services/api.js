import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Re-attach token on every request (handles page refresh)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:    (data) => api.post('/auth/login',    data),
  register: (data) => api.post('/auth/register', data),
  me:       ()     => api.get('/auth/me'),
}

// ── Internships ──────────────────────────────────────────────────────────────
export const internshipsAPI = {
  search:        (params) => api.get('/internships/search',         { params }),
  getById:       (id)     => api.get(`/internships/${id}`),
  getMine:       (params) => api.get('/internships/my-internships', { params }),
  create:        (data)   => api.post('/internships',               data),
  update:        (id, data) => api.put(`/internships/${id}`,        data),
  delete:        (id)     => api.delete(`/internships/${id}`),
  incrementView: (id)     => api.put(`/internships/view/${id}`),
  dashboard:     ()       => api.get('/internships/dashboard/stats'),
  getApplicationsByInternship: (id) => api.get(`/applications/internship/${id}`),
}

// ── Applications ─────────────────────────────────────────────────────────────
export const applicationsAPI = {
  apply: (internshipId, formData) => api.post(`/applications/apply/${internshipId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMine: () => api.get('/applications/my-applications'),
  update: (id, formData) => api.put(`/applications/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  withdraw: (id) => api.delete(`/applications/${id}`)
}

export default api
