import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const newslettersAPI = {
  list: (params) => api.get('/newsletters', { params }),
  get: (slug) => api.get(`/newsletters/${slug}`),
  create: (data) => api.post('/newsletters', data),
  update: (id, data) => api.put(`/newsletters/${id}`, data),
  remove: (id) => api.delete(`/newsletters/${id}`),
};

export const subscribersAPI = {
  list: (params) => api.get('/subscribers', { params }),
  create: (data) => api.post('/subscribers', data),
  update: (id, data) => api.patch(`/subscribers/${id}`, data),
  remove: (id) => api.delete(`/subscribers/${id}`),
  import: (emails) => api.post('/subscribers/import', { emails }),
  unsubscribe: (email) => api.post('/subscribers/unsubscribe', { email }),
};

export const campaignsAPI = {
  list: () => api.get('/campaigns'),
  get: (id) => api.get(`/campaigns/${id}`),
  create: (data) => api.post('/campaigns', data),
  remove: (id) => api.delete(`/campaigns/${id}`),
};

export const statsAPI = {
  get: () => api.get('/stats'),
};
