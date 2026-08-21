import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Quan trọng để gửi/nhận cookie (nếu dùng)
});

// Interceptor cho Request: Tự động đính kèm token (nếu có)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor cho Response: Xử lý lỗi chung (như hết hạn token)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Bắt lỗi 401 Unauthorized (token hết hạn hoặc sai)
      if (error.response.status === 401) {
        console.warn('Token hết hạn hoặc không hợp lệ');
        // Ở đây có thể thêm logic logout hoặc tự động refresh token
        // localStorage.removeItem('token');
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
