import api from '../lib/axios';

export const authService = {
  /**
   * Gọi API đăng nhập
   * @param {string} email
   * @param {string} password
   */
  login: async (email, password) => {
    const response = await api.post('/api/v1/auth/login', { email, password });
    return response.data;
  },

  /**
   * Gọi API đăng ký
   * @param {Object} data - { email, password, username, displayName }
   */
  register: async (data) => {
    const response = await api.post('/api/v1/auth/register', data);
    return response.data;
  },

  /**
   * Gọi API refresh token
   * @param {string} [refreshToken]
   */
  refreshToken: async (refreshToken) => {
    const token = refreshToken || localStorage.getItem('refreshToken');
    const response = await api.post('/api/v1/auth/refresh', { refreshToken: token });
    return response.data;
  },

  /**
   * Đăng xuất (xóa token local và gọi server logout)
   */
  logout: async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch (e) {
      // Bỏ qua lỗi mạng khi logout
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },
};
