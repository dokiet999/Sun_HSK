import { useState, useRef } from 'react';
import styles from './VocabularyImportModal.module.css';

export default function VocabularyImportModal({ isOpen, onClose, onImportSuccess }) {
  const [jsonText, setJsonText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [defaultLesson, setDefaultLesson] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Xử lý khi chọn file JSON
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setSuccessMsg(null);

    // Tự động gợi ý lessonNumber từ tên file (ví dụ: lesson_001.json -> lesson 1)
    const match = file.name.match(/lesson_?0*(\d+)/i);
    if (match && match[1]) {
      setDefaultLesson(parseInt(match[1], 10));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setJsonText(content);
        validateAndParse(content);
      }
    };
    reader.readAsText(file);
  };

  // Parse và kiểm tra JSON
  const validateAndParse = (text) => {
    if (!text.trim()) {
      setParsedData(null);
      return;
    }
    try {
      let data = JSON.parse(text);
      if (!Array.isArray(data)) {
        if (typeof data === 'object') {
          // Trường hợp object bọc danh sách
          data = data.words || data.data || [data];
        } else {
          throw new Error('Dữ liệu JSON phải là một mảng danh sách từ vựng.');
        }
      }

      // Chuẩn hóa dữ liệu tương tự VocabularyImportRequest backend
      const normalized = data.map((item, idx) => {
        const w = item.words || item;
        return {
          id: w.id || item.id,
          hanzi: w.hanzi,
          pinyin: w.pinyin,
          level: w.level || item.level || 1,
          lessonNumber: w.lesson_number || item.lesson_number,
          pos: w.pos,
          meaningVi: w.meaning_vi || w.meaningVi,
          examplesCount: (w.examples || []).length
        };
      });

      setParsedData(normalized);
      setError(null);
    } catch (err) {
      setParsedData(null);
      setError(`Lỗi định dạng JSON: ${err.message}`);
    }
  };

  const handleTextChange = (e) => {
    const text = e.target.value;
    setJsonText(text);
    validateAndParse(text);
  };

  const handleImport = async () => {
    if (!parsedData || parsedData.length === 0) {
      setError('Chưa có dữ liệu từ vựng hợp lệ để import.');
      return;
    }

    try {
      setImporting(true);
      setError(null);
      setSuccessMsg(null);

      const rawJson = JSON.parse(jsonText);
      const list = Array.isArray(rawJson) ? rawJson : (rawJson.words || rawJson.data || [rawJson]);
      const lessonNum = defaultLesson ? parseInt(defaultLesson, 10) : null;

      await onImportSuccess(list, lessonNum);
      setSuccessMsg(`Import thành công ${list.length} từ vựng vào hệ thống!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || 'Lỗi khi import từ vựng.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerTitle}>
            <span className={styles.headerIcon}>📥</span>
            <div>
              <h3>Import Từ vựng từ JSON</h3>
              <p className={styles.headerSub}>Tải lên file dataset như lesson_001.json hoặc dán chuỗi JSON trực tiếp</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {error && <div className={styles.errorAlert}>{error}</div>}
        {successMsg && <div className={styles.successAlert}>{successMsg}</div>}

        <div className={styles.body}>
          {/* Vùng chọn file */}
          <div
            className={styles.dropZone}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <div className={styles.dropContent}>
              <span className={styles.dropIcon}>📁</span>
              <div>
                <p className={styles.dropTitle}>
                  {fileName ? <strong>File đã chọn: {fileName}</strong> : 'Nhấn vào đây để chọn file JSON từ máy tính'}
                </p>
                <p className={styles.dropDesc}>Hỗ trợ định dạng chuẩn của Sun HSK (như lesson_001.json)</p>
              </div>
            </div>
          </div>

          {/* Thiết lập Bài số mặc định */}
          <div className={styles.lessonInputRow}>
            <label>Gán số bài học mặc định (Default Lesson Number):</label>
            <input
              type="number"
              min="1"
              value={defaultLesson}
              onChange={e => setDefaultLesson(e.target.value)}
              placeholder="Ví dụ: 1"
              className={styles.numInput}
            />
            <span className={styles.inputHint}>
              (Tự động gán nếu từ trong file JSON chưa có trường lesson_number)
            </span>
          </div>

          {/* Dán JSON trực tiếp */}
          <div className={styles.textSection}>
            <label className={styles.sectionLabel}>Hoặc dán nội dung JSON vào ô dưới:</label>
            <textarea
              rows={6}
              value={jsonText}
              onChange={handleTextChange}
              placeholder='[ { "id": 147, "hanzi": "你好", "pinyin": "nǐ hǎo", "meaning_vi": "xin chào", "level": 1 ... } ]'
              className={styles.textarea}
            />
          </div>

          {/* Xem trước dữ liệu (Preview) */}
          {parsedData && (
            <div className={styles.previewBox}>
              <div className={styles.previewHeader}>
                <span className={styles.previewCount}>
                  ✓ Đã nhận diện <strong>{parsedData.length}</strong> từ vựng
                </span>
                <span className={styles.previewLevel}>
                  HSK Level: {parsedData[0]?.level || 1}
                </span>
              </div>
              <div className={styles.previewTable}>
                {parsedData.slice(0, 4).map((item, idx) => (
                  <div key={idx} className={styles.previewRow}>
                    <span className={styles.previewHanzi}>{item.hanzi || '(Chưa có chữ)'}</span>
                    <span className={styles.previewPinyin}>{item.pinyin}</span>
                    <span className={styles.previewPos}>{item.pos || '-'}</span>
                    <span className={styles.previewMeaning}>{item.meaningVi}</span>
                    <span className={styles.previewExamples}>{item.examplesCount} ví dụ</span>
                  </div>
                ))}
                {parsedData.length > 4 && (
                  <div className={styles.previewMore}>
                    ...và {parsedData.length - 4} từ vựng khác
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={importing}
          >
            Đóng
          </button>
          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleImport}
            disabled={importing || !parsedData || parsedData.length === 0}
          >
            {importing ? 'Đang import dữ liệu...' : `Bắt đầu Import (${parsedData ? parsedData.length : 0} từ)`}
          </button>
        </div>
      </div>
    </div>
  );
}
