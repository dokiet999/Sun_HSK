import api from '../lib/axios';

export const vocabularyService = {
  /**
   * Lấy tổng quan các bài học theo cấp độ HSK
   * GET /api/v1/vocabulary/lessons?level={level}&pageSize={pageSize}
   */
  getLessonOverview: async (level = 1, pageSize = 12) => {
    const response = await api.get('/api/v1/vocabulary/lessons', {
      params: { level, pageSize }
    });
    return response.data;
  },

  /**
   * Lấy danh sách từ vựng trong một bài học cụ thể
   * GET /api/v1/vocabulary/lessons/{lessonNumber}?level={level}&pageSize={pageSize}
   */
  getWordsByLesson: async (level = 1, lessonNumber = 1, pageSize = 12) => {
    const response = await api.get(`/api/v1/vocabulary/lessons/${lessonNumber}`, {
      params: { level, pageSize }
    });
    return response.data;
  },

  /**
   * Lấy chi tiết một từ vựng
   * GET /api/v1/vocabulary/{id}
   */
  getWordDetail: async (id) => {
    const response = await api.get(`/api/v1/vocabulary/${id}`);
    return response.data;
  },

  /**
   * Ghim / bỏ ghim từ vựng vào danh sách ôn tập cá nhân
   * PATCH /api/v1/me/vocabulary/{id}/review-list
   */
  toggleReviewList: async (vocabularyId, inReviewList) => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Khách vãng lai chưa đăng nhập: lưu local, không gọi backend để tránh lỗi 401
      return { success: true, localOnly: true };
    }
    try {
      const response = await api.patch(`/api/v1/me/vocabulary/${vocabularyId}/review-list`, {
        inReviewList
      });
      return response.data;
    } catch (err) {
      return { success: true, localOnly: true };
    }
  },

  /**
   * Cập nhật trạng thái học tập của từ vựng
   * POST /api/v1/me/vocabulary/{id}/learn
   */
  updateStatus: async (vocabularyId, status) => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Khách vãng lai chưa đăng nhập: lưu local, không gọi backend
      return { success: true, localOnly: true };
    }
    try {
      const response = await api.post(`/api/v1/me/vocabulary/${vocabularyId}/learn`);
      return response.data;
    } catch (err) {
      return { success: true, localOnly: true };
    }
  }
};
