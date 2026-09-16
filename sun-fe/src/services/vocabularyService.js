import api from '../lib/axios';

export const vocabularyService = {
  /**
   * Lấy tổng quan các bài học theo cấp độ HSK và phiên bản (HSK_2 hoặc HSK_3)
   * GET /api/v1/vocabulary/lessons?level={level}&pageSize={pageSize}&hskVersion={hskVersion}
   */
  getLessonOverview: async (level = 1, pageSize = 12, hskVersion = null) => {
    const params = { level, pageSize };
    if (hskVersion) params.hskVersion = hskVersion;
    const response = await api.get('/api/v1/vocabulary/lessons', { params });
    return response.data;
  },

  /**
   * Lấy danh sách từ vựng trong một bài học cụ thể (có lọc theo hskVersion)
   * GET /api/v1/vocabulary/lessons/{lessonNumber}?level={level}&pageSize={pageSize}&hskVersion={hskVersion}
   */
  getWordsByLesson: async (level = 1, lessonNumber = 1, pageSize = 12, hskVersion = null) => {
    const params = { level, pageSize };
    if (hskVersion) params.hskVersion = hskVersion;
    const response = await api.get(`/api/v1/vocabulary/lessons/${lessonNumber}`, { params });
    return response.data;
  },

  /**
   * Lấy danh sách từ vựng theo cấp độ (toàn bộ hoặc theo bài)
   * GET /api/v1/vocabulary?level={level}&lesson={lesson}&pageSize={pageSize}&hskVersion={hskVersion}
   */
  listByLevel: async (level = 1, lesson = null, pageSize = 12, hskVersion = null) => {
    const params = { level, pageSize };
    if (lesson) params.lesson = lesson;
    if (hskVersion) params.hskVersion = hskVersion;
    const response = await api.get('/api/v1/vocabulary', { params });
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
   * Bắt đầu học từ vựng (chuyển sang LEARNING)
   * POST /api/v1/me/vocabulary/{id}/learn
   */
  startLearning: async (vocabularyId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: true, localOnly: true };
    }
    try {
      const response = await api.post(`/api/v1/me/vocabulary/${vocabularyId}/learn`);
      return response.data;
    } catch (err) {
      return { success: true, localOnly: true };
    }
  },

  /**
   * Cập nhật trực tiếp trạng thái học tập của từ vựng (NEW, LEARNING, REVIEWING, MASTERED)
   * PATCH /api/v1/me/vocabulary/{id}/status?status={status}
   */
  updateStatus: async (vocabularyId, status) => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Khách vãng lai chưa đăng nhập: lưu local, không gọi backend
      return { success: true, localOnly: true };
    }
    try {
      const response = await api.patch(`/api/v1/me/vocabulary/${vocabularyId}/status`, null, {
        params: { status }
      });
      return response.data;
    } catch (err) {
      return { success: true, localOnly: true };
    }
  },

  /**
   * Đánh giá độ nhớ thẻ flashcard theo Spaced Repetition (SRS)
   * POST /api/v1/me/vocabulary/{id}/review?rating={rating}
   * Rating: 1 = Again (Chưa nhớ), 2 = Hard, 3 = Good (Biết/Nhớ tốt), 4 = Easy (Nhớ rồi)
   */
  recordReview: async (vocabularyId, rating = 3) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: true, localOnly: true };
    }
    try {
      const response = await api.post(`/api/v1/me/vocabulary/${vocabularyId}/review`, null, {
        params: { rating }
      });
      return response.data;
    } catch (err) {
      return { success: true, localOnly: true };
    }
  },

  /**
   * Lấy danh sách từ vựng đến hạn cần ôn tập hôm nay (theo thuật toán SRS)
   * GET /api/v1/me/vocabulary/review
   */
  getDueForReview: async () => {
    const token = localStorage.getItem('token');
    if (!token) return { result: [] };
    const response = await api.get('/api/v1/me/vocabulary/review');
    return response.data;
  },

  /**
   * Lấy danh sách từ vựng đã ghim vào danh sách ôn tập riêng
   * GET /api/v1/me/vocabulary/my-review-list?level={level}
   */
  getMyReviewList: async (level = 1) => {
    const token = localStorage.getItem('token');
    if (!token) return { result: [] };
    const response = await api.get('/api/v1/me/vocabulary/my-review-list', {
      params: { level }
    });
    return response.data;
  },

  /**
   * Thống kê tiến độ từ vựng theo trạng thái (NEW, LEARNING, REVIEWING, MASTERED)
   * GET /api/v1/me/vocabulary/summary?level={level}
   */
  getLearningSummary: async (level = 1) => {
    const token = localStorage.getItem('token');
    if (!token) return { result: {} };
    const response = await api.get('/api/v1/me/vocabulary/summary', {
      params: { level }
    });
    return response.data;
  }
};
