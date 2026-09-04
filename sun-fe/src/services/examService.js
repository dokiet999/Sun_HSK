import api from '../lib/axios';

export const examService = {
  /**
   * Lấy danh sách đề thi (đã published)
   * GET /api/v1/exams
   */
  listExams: async (params = {}) => {
    const response = await api.get('/api/v1/exams', { params });
    return response.data;
  },

  /**
   * Lấy chi tiết đề thi (không bao gồm đáp án đúng)
   * GET /api/v1/exams/{id}
   */
  getExamDetail: async (id) => {
    const response = await api.get(`/api/v1/exams/${id}`);
    return response.data;
  },

  /**
   * Bắt đầu làm bài thi (Tạo session mới)
   * POST /api/v1/exams/{id}/attempts
   */
  startAttempt: async (id) => {
    const response = await api.post(`/api/v1/exams/${id}/attempts`);
    return response.data;
  },

  /**
   * Lưu câu trả lời realtime
   * POST /api/v1/exams/attempts/{attemptId}/answers
   */
  saveAnswer: async (attemptId, questionId, selectedOptionId, textAnswer = null, orderAnswer = null) => {
    const response = await api.post(`/api/v1/exams/attempts/${attemptId}/answers`, {
      questionId,
      selectedOptionId,
      textAnswer,
      orderAnswer
    });
    return response.data;
  },

  /**
   * Nộp bài thi
   * POST /api/v1/exams/attempts/{attemptId}/submit
   */
  submitAttempt: async (attemptId, submitData = {}) => {
    const response = await api.post(`/api/v1/exams/attempts/${attemptId}/submit`, submitData);
    return response.data;
  },

  /**
   * Xem kết quả bài thi sau khi nộp
   * GET /api/v1/exams/attempts/{attemptId}/result
   */
  getResult: async (attemptId) => {
    const response = await api.get(`/api/v1/exams/attempts/${attemptId}/result`);
    return response.data;
  },

  /**
   * Xem lịch sử làm bài của user
   * GET /api/v1/exams/attempts/history
   */
  getHistory: async (page = 0, size = 10) => {
    const response = await api.get(`/api/v1/exams/attempts/history?page=${page}&size=${size}`);
    return response.data;
  },
};
