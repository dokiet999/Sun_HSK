import api from '../lib/axios';

export const adminService = {
  /**
   * Lấy danh sách đề thi cho Admin
   * @param {number} page - Trang hiện tại (mặc định 0)
   * @param {number} size - Số phần tử mỗi trang (mặc định 100 để tự lọc trên frontend)
   */
  getExams: async (page = 0, size = 100) => {
    // API backend dùng Pageable (page bắt đầu từ 0)
    const response = await api.get(`/api/v1/admin/exams?page=${page}&size=${size}`);
    return response.data;
  },

  /**
   * Công bố đề thi (DRAFT -> PUBLISHED)
   * @param {string} id - UUID của đề thi
   */
  publishExam: async (id) => {
    const response = await api.put(`/api/v1/admin/exams/${id}/publish`);
    return response.data;
  },

  /**
   * Xóa đề thi
   * @param {string} id - UUID của đề thi
   */
  deleteExam: async (id) => {
    const response = await api.delete(`/api/v1/admin/exams/${id}`);
    return response.data;
  },

  // --- EXAM METADATA ---
  createExam: async (data) => {
    const response = await api.post('/api/v1/admin/exams', data);
    return response.data;
  },
  updateExam: async (id, data) => {
    const response = await api.put(`/api/v1/admin/exams/${id}`, data);
    return response.data;
  },
  getExamDetail: async (id) => {
    const response = await api.get(`/api/v1/admin/exams/${id}`);
    return response.data;
  },

  // --- SECTIONS ---
  addSection: async (examId, data) => {
    const response = await api.post(`/api/v1/admin/exams/${examId}/sections`, data);
    return response.data;
  },
  updateSection: async (sectionId, data) => {
    const response = await api.put(`/api/v1/admin/exams/sections/${sectionId}`, data);
    return response.data;
  },
  deleteSection: async (sectionId) => {
    const response = await api.delete(`/api/v1/admin/exams/sections/${sectionId}`);
    return response.data;
  },

  // --- QUESTIONS ---
  addQuestion: async (sectionId, data) => {
    const response = await api.post(`/api/v1/admin/exams/sections/${sectionId}/questions`, data);
    return response.data;
  },
  updateQuestion: async (questionId, data) => {
    const response = await api.put(`/api/v1/admin/exams/questions/${questionId}`, data);
    return response.data;
  },
  deleteQuestion: async (questionId) => {
    const response = await api.delete(`/api/v1/admin/exams/questions/${questionId}`);
    return response.data;
  },

  // --- OPTIONS ---
  addOption: async (questionId, data) => {
    const response = await api.post(`/api/v1/admin/exams/questions/${questionId}/options`, data);
    return response.data;
  },
  updateOption: async (optionId, data) => {
    const response = await api.put(`/api/v1/admin/exams/options/${optionId}`, data);
    return response.data;
  },
  deleteOption: async (optionId) => {
    const response = await api.delete(`/api/v1/admin/exams/options/${optionId}`);
    return response.data;
  },
};
