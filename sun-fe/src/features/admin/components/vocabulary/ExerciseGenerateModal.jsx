import { useState } from 'react';
import styles from './ExerciseGenerateModal.module.css';

export default function ExerciseGenerateModal({ isOpen, onClose, onGenerate }) {
  const [level, setLevel] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [resultMsg, setResultMsg] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);
      setResultMsg(null);

      const res = await onGenerate(Number(level));
      setResultMsg(res?.message || `Đã sinh thành công bài tập cho HSK ${level}!`);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Có lỗi xảy ra khi tự động sinh bài tập.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerTitle}>
            <span className={styles.headerIcon}>⚡</span>
            <div>
              <h3>Tự động sinh bài tập</h3>
              <p className={styles.headerSub}>Tạo tự động bài tập điền từ, sắp xếp câu và luyện nghe từ vựng</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {error && <div className={styles.errorAlert}>{error}</div>}
        {resultMsg && <div className={styles.successAlert}>{resultMsg}</div>}

        <div className={styles.body}>
          <div className={styles.infoBox}>
            <p className={styles.infoTitle}>💡 Cơ chế hoạt động của bộ sinh bài tập:</p>
            <ul className={styles.infoList}>
              <li><strong>Điền từ vào chỗ trống:</strong> Tách từ vựng mục tiêu trong câu ví dụ làm ô trống.</li>
              <li><strong>Sắp xếp câu:</strong> Phân tách câu ví dụ thành các token độc lập để người học ghép câu.</li>
              <li><strong>Luyện nghe:</strong> Tận dụng file âm thanh mẫu để kiểm tra kỹ năng nhận diện câu.</li>
            </ul>
          </div>

          <div className={styles.formGroup}>
            <label>Chọn cấp độ HSK cần sinh bài tập:</label>
            <select
              value={level}
              onChange={e => setLevel(e.target.value)}
              className={styles.select}
              disabled={generating}
            >
              {[1, 2, 3, 4, 5, 6].map(lvl => (
                <option key={lvl} value={lvl}>HSK {lvl} (Level {lvl})</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={generating}
          >
            Đóng
          </button>
          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? 'Đang tạo bài tập...' : `Bắt đầu sinh bài tập HSK ${level}`}
          </button>
        </div>
      </div>
    </div>
  );
}
