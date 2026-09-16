import api from '../lib/axios';

export const exerciseService = {
  /**
   * Lấy danh sách bài tập theo level và bài học.
   * Nếu type không truyền, lấy tất cả dạng bài tập (Fill Blank, Sentence Ordering, Listening).
   * GET /api/v1/exercises?level={level}&lesson={lesson}&type={type}&pageSize={pageSize}
   */
  getExercises: async (level = 1, lesson = null, type = null, pageSize = 30) => {
    const params = { level, pageSize };
    if (lesson) params.lesson = lesson;
    if (type) params.type = type;

    const response = await api.get('/api/v1/exercises', { params });
    return response.data;
  },

  /**
   * Nộp bài làm cho 1 câu hỏi bài tập.
   * POST /api/v1/exercises/{id}/attempt
   */
  submitAttempt: async (exerciseId, userAnswer, timeSpentSecs = 0) => {
    const token = localStorage.getItem('token');
    if (!token) {
      // User chưa đăng nhập: trả kết quả client không lưu history backend
      return { success: true, localOnly: true };
    }
    try {
      const response = await api.post(`/api/v1/exercises/${exerciseId}/attempt`, {
        userAnswer,
        timeSpentSecs
      });
      return response.data;
    } catch (err) {
      return { success: true, localOnly: true, error: err };
    }
  }
};
