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
   * Đăng xuất (xóa token)
   */
  logout: () => {
    localStorage.removeItem('token');
  },
};
