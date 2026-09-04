import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

// Instance chính dùng cho toàn bộ ứng dụng
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Gửi/nhận cookie (chứa refreshToken)
});

// Instance phụ chuyên dùng để refresh token, tránh bị interceptor lặp vô tận
const refreshClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Trạng thái hàng đợi refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Hàm gọi API refresh token
 */
export async function refreshAuthToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  try {
    const response = await refreshClient.post('/api/v1/auth/refresh', {
      refreshToken: refreshToken || undefined,
    });

    const data = response.data?.result;
    if (data && data.accessToken) {
      localStorage.setItem('token', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data.accessToken;
    }
    throw new Error('Không nhận được accessToken mới từ server');
  } catch (err) {
    throw err;
  }
}

/**
 * Đọc thời gian hết hạn (ms) từ access token
 */
export function getTokenExpirationTime(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp ? payload.exp * 1000 : null;
  } catch (e) {
    return null;
  }
}

/**
 * Kiểm tra xem token có sắp hết hạn trong vòng bufferMs hay không
 */
export function isTokenExpiringSoon(bufferMs = 2 * 60 * 1000) {
  const token = localStorage.getItem('token');
  if (!token) return false;
  const expTime = getTokenExpirationTime(token);
  if (!expTime) return false;
  return expTime - Date.now() < bufferMs;
}

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

// Interceptor cho Response: Tự động refresh token khi gặp 401
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Không xử lý nếu không có response hoặc không phải lỗi 401
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || '';
    // Nếu request bị 401 chính là API login hoặc refresh thì không lặp lại
    if (requestUrl.includes('/api/v1/auth/login') || requestUrl.includes('/api/v1/auth/refresh')) {
      return Promise.reject(error);
    }

    // Đã thử retry 1 lần mà vẫn 401 thì dừng để tránh vòng lặp vô hạn
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Đang có request khác thực hiện refresh -> đưa vào hàng đợi chờ
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newToken = await refreshAuthToken();
      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      // Refresh thất bại (Refresh token hết hạn 7 ngày hoặc không hợp lệ)
      console.warn('Phiên đăng nhập đã hết hạn, chuyển hướng về trang đăng nhập');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

// Cơ chế hẹn giờ chủ động kiểm tra và refresh token trước khi hết hạn
let proactiveRefreshTimer = null;
export function startProactiveRefresh() {
  if (proactiveRefreshTimer) clearInterval(proactiveRefreshTimer);

  proactiveRefreshTimer = setInterval(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Nếu token còn dưới 3 phút là hết hạn -> tự động refresh ngầm
    if (isTokenExpiringSoon(3 * 60 * 1000) && !isRefreshing) {
      try {
        console.log('[Auth] Tự động làm mới access token trước khi hết hạn...');
        await refreshAuthToken();
        console.log('[Auth] Token đã được tự động làm mới thành công.');
      } catch (err) {
        console.warn('[Auth] Không thể tự động làm mới token:', err.message);
      }
    }
  }, 60 * 1000); // Kiểm tra mỗi 1 phút
}

// Bắt đầu timer khi file được load (nếu đang ở môi trường browser)
if (typeof window !== 'undefined') {
  startProactiveRefresh();
}

export default api;
