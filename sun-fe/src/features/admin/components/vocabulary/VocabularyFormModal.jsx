import { useState, useEffect } from 'react';
import styles from './VocabularyFormModal.module.css';

const POS_OPTIONS = [
  'Danh từ',
  'Động từ',
  'Tính từ',
  'Đại từ',
  'Phó từ',
  'Lượng từ',
  'Thán từ',
  'Giới từ',
  'Liên từ',
  'Trợ từ',
  'Hậu tố',
  'Khác'
];

export default function VocabularyFormModal({ isOpen, onClose, initialData, onSave }) {
  const isEdit = Boolean(initialData && initialData.id);

  const [formData, setFormData] = useState({
    id: null,
    level: 1,
    lessonNumber: 1,
    sortOrder: 0,
    position: 0,
    hanzi: '',
    pinyin: '',
    hv: '',
    pos: 'Danh từ',
    meaningVi: '',
    en: '',
    audioPath: '',
    example: '',
    examples: []
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id ?? null,
        level: initialData.hskLevel ?? initialData.level ?? 1,
        lessonNumber: initialData.lessonNumber ?? 1,
        sortOrder: initialData.sortOrder ?? 0,
        position: initialData.position ?? 0,
        hanzi: initialData.hanzi || '',
        pinyin: initialData.pinyin || '',
        hv: initialData.hanViet || initialData.hv || '',
        pos: initialData.pos || 'Danh từ',
        meaningVi: initialData.meaningVi || '',
        en: initialData.meaningEn || initialData.en || '',
        audioPath: initialData.audioPath || '',
        example: (initialData.collocations && initialData.collocations.length > 0)
          ? initialData.collocations.map(c => `${c.text} (${c.meaningVi || ''})`).join(' / ')
          : (initialData.example || ''),
        examples: (initialData.examples || []).map(e => ({
          zh: e.zh || '',
          vi: e.vi || '',
          audioPath: e.audioPath || ''
        }))
      });
    } else {
      setFormData({
        id: null,
        level: 1,
        lessonNumber: 1,
        sortOrder: 0,
        position: 0,
        hanzi: '',
        pinyin: '',
        hv: '',
        pos: 'Danh từ',
        meaningVi: '',
        en: '',
        audioPath: '',
        example: '',
        examples: [{ zh: '', vi: '', audioPath: '' }]
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleExampleChange = (index, field, value) => {
    setFormData(prev => {
      const nextExamples = [...prev.examples];
      nextExamples[index] = { ...nextExamples[index], [field]: value };
      return { ...prev, examples: nextExamples };
    });
  };

  const handleAddExample = () => {
    setFormData(prev => ({
      ...prev,
      examples: [...prev.examples, { zh: '', vi: '', audioPath: '' }]
    }));
  };

  const handleRemoveExample = (index) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.hanzi.trim()) {
      setError('Vui lòng nhập chữ Hán.');
      return;
    }
    if (!formData.pinyin.trim()) {
      setError('Vui lòng nhập Pinyin.');
      return;
    }
    if (!formData.meaningVi.trim()) {
      setError('Vui lòng nhập nghĩa tiếng Việt.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Lọc các ví dụ hợp lệ
      const cleanedExamples = formData.examples
        .filter(ex => ex.zh && ex.zh.trim())
        .map(ex => ({
          zh: ex.zh.trim(),
          vi: ex.vi ? ex.vi.trim() : '',
          audio_path: ex.audioPath ? ex.audioPath.trim() : null
        }));

      const payload = {
        id: formData.id,
        level: Number(formData.level),
        lesson_number: Number(formData.lessonNumber),
        sort_order: Number(formData.sortOrder) || 0,
        position: Number(formData.position) || 0,
        hanzi: formData.hanzi.trim(),
        pinyin: formData.pinyin.trim(),
        hv: formData.hv ? formData.hv.trim() : null,
        pos: formData.pos,
        meaning_vi: formData.meaningVi.trim(),
        en: formData.en ? formData.en.trim() : null,
        audio_path: formData.audioPath ? formData.audioPath.trim() : null,
        example: formData.example ? formData.example.trim() : null,
        examples: cleanedExamples
      };

      await onSave(payload, isEdit ? formData.id : null);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu từ vựng.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerTitle}>
            <span className={styles.headerIcon}>{isEdit ? '✏️' : '➕'}</span>
            <div>
              <h3>{isEdit ? 'Chỉnh sửa từ vựng' : 'Thêm từ vựng mới'}</h3>
              <p className={styles.headerSub}>
                {isEdit ? `ID: #${formData.id} - ${formData.hanzi}` : 'Nhập thông tin từ vựng HSK, ví dụ và cụm từ'}
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {error && <div className={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.scrollArea}>
            {/* Hàng 1: Level, Lesson, Vị trí */}
            <div className={styles.row3}>
              <div className={styles.formGroup}>
                <label>Cấp độ HSK *</label>
                <select
                  value={formData.level}
                  onChange={e => handleChange('level', e.target.value)}
                  className={styles.input}
                >
                  {[1, 2, 3, 4, 5, 6, 7].map(lvl => (
                    <option key={lvl} value={lvl}>HSK {lvl === 7 ? '7–9' : lvl}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Bài học (Lesson) *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.lessonNumber}
                  onChange={e => handleChange('lessonNumber', e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Thứ tự (Sort order)</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={e => handleChange('sortOrder', e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>

            {/* Hàng 2: Chữ Hán, Pinyin, Hán Việt */}
            <div className={styles.row3}>
              <div className={styles.formGroup}>
                <label>Chữ Hán (Hanzi) *</label>
                <input
                  type="text"
                  value={formData.hanzi}
                  onChange={e => handleChange('hanzi', e.target.value)}
                  placeholder="Ví dụ: 你好"
                  className={`${styles.input} ${styles.hanziInput}`}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Phiên âm (Pinyin) *</label>
                <input
                  type="text"
                  value={formData.pinyin}
                  onChange={e => handleChange('pinyin', e.target.value)}
                  placeholder="Ví dụ: nǐ hǎo"
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Âm Hán Việt</label>
                <input
                  type="text"
                  value={formData.hv}
                  onChange={e => handleChange('hv', e.target.value)}
                  placeholder="Ví dụ: nhĩ hảo"
                  className={styles.input}
                />
              </div>
            </div>

            {/* Hàng 3: Từ loại, Nghĩa tiếng Việt, Nghĩa tiếng Anh */}
            <div className={styles.row3}>
              <div className={styles.formGroup}>
                <label>Từ loại (POS)</label>
                <input
                  type="text"
                  list="pos-options"
                  value={formData.pos}
                  onChange={e => handleChange('pos', e.target.value)}
                  placeholder="Danh từ, Động từ..."
                  className={styles.input}
                />
                <datalist id="pos-options">
                  {POS_OPTIONS.map(pos => <option key={pos} value={pos} />)}
                </datalist>
              </div>
              <div className={styles.formGroup} style={{ flex: 1.5 }}>
                <label>Nghĩa tiếng Việt *</label>
                <input
                  type="text"
                  value={formData.meaningVi}
                  onChange={e => handleChange('meaningVi', e.target.value)}
                  placeholder="Ví dụ: xin chào, chào bạn"
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Nghĩa tiếng Anh (en)</label>
                <input
                  type="text"
                  value={formData.en}
                  onChange={e => handleChange('en', e.target.value)}
                  placeholder="Ví dụ: hello"
                  className={styles.input}
                />
              </div>
            </div>

            {/* Đường dẫn Audio */}
            <div className={styles.formGroup}>
              <label>Đường dẫn Audio (Audio path)</label>
              <input
                type="text"
                value={formData.audioPath}
                onChange={e => handleChange('audioPath', e.target.value)}
                placeholder="Ví dụ: words/147.mp3"
                className={styles.input}
              />
            </div>

            {/* Cụm từ thường gặp (Collocations) */}
            <div className={styles.formGroup}>
              <label>Cụm từ thường gặp (Collocations)</label>
              <textarea
                rows={2}
                value={formData.example}
                onChange={e => handleChange('example', e.target.value)}
                placeholder="Ví dụ: 你好，很高兴认识你。(Xin chào, rất vui được gặp bạn.) / 你们好 (chào các bạn)"
                className={styles.textarea}
              />
              <span className={styles.hint}>Mẹo: Phân cách các cụm từ bằng dấu gạch chéo `/` hoặc chấm phẩy `;`</span>
            </div>

            {/* Danh sách câu ví dụ động */}
            <div className={styles.examplesSection}>
              <div className={styles.examplesHeader}>
                <h4>Danh sách câu ví dụ</h4>
                <button
                  type="button"
                  className={styles.addExBtn}
                  onClick={handleAddExample}
                >
                  + Thêm ví dụ
                </button>
              </div>

              {formData.examples.map((ex, idx) => (
                <div key={idx} className={styles.exampleCard}>
                  <div className={styles.exampleCardHeader}>
                    <span className={styles.exampleBadge}>Ví dụ {idx + 1}</span>
                    {formData.examples.length > 1 && (
                      <button
                        type="button"
                        className={styles.removeExBtn}
                        onClick={() => handleRemoveExample(idx)}
                      >
                        ✕ Xóa dòng
                      </button>
                    )}
                  </div>
                  <div className={styles.exampleGrid}>
                    <div className={styles.formGroup}>
                      <label>Câu tiếng Trung *</label>
                      <input
                        type="text"
                        value={ex.zh}
                        onChange={e => handleExampleChange(idx, 'zh', e.target.value)}
                        placeholder="Ví dụ: 你好！"
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Bản dịch tiếng Việt</label>
                      <input
                        type="text"
                        value={ex.vi}
                        onChange={e => handleExampleChange(idx, 'vi', e.target.value)}
                        placeholder="Ví dụ: Xin chào!"
                        className={styles.input}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={saving}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Thêm từ vựng')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
