import { useState } from 'react'
import { adminService } from '../../../../services/adminService'
import styles from './Builder.module.css'

const QUESTION_TYPE_CONFIG = {
  MULTIPLE_CHOICE: {
    label: 'Trắc nghiệm',
    badgeClass: 'badgeReading',
    icon: '🔤',
    description: 'Học viên đọc câu hỏi và chọn 1 đáp án đúng trong các phương án (A, B, C, D).',
    showAudio: true,
    showImage: true,
    showCorrectAnswer: false,
    showOptions: true,
  },
  DIALOGUE_LISTENING: {
    label: 'Nghe chọn đáp án',
    badgeClass: 'badgeListening',
    icon: '🎧',
    description: 'Bài nghe hội thoại hoặc câu nói. Dán đường dẫn URL file âm thanh (.mp3, .wav) để học viên nghe.',
    showAudio: true,
    audioPriority: true,
    showImage: false,
    showCorrectAnswer: false,
    showOptions: true,
  },
  PICTURE_SELECTION: {
    label: 'Nghe / Chọn tranh',
    badgeClass: 'badgeListening',
    icon: '🖼️',
    description: 'Học viên nghe file âm thanh hoặc đọc câu hỏi rồi chọn bức tranh phù hợp nhất.',
    showAudio: true,
    showImage: true,
    showCorrectAnswer: false,
    showOptions: true,
    allowOptionImage: true,
  },
  TRUE_FALSE: {
    label: 'Đúng / Sai',
    badgeClass: 'badgeReading',
    icon: '⚖️',
    description: 'Học viên phán đoán câu khẳng định là Đúng (✓) hay Sai (✗). Chọn đáp án đúng bên dưới để tự động tạo phương án.',
    showAudio: true,
    showImage: true,
    showCorrectAnswer: false,
    showOptions: false,
    isTrueFalse: true,
  },
  FILL_IN_BLANK: {
    label: 'Điền vào chỗ trống',
    badgeClass: 'badgeReading',
    icon: '✍️',
    description: 'Học viên điền từ/cụm từ thích hợp vào chỗ trống (sử dụng dấu ___ trong câu hỏi).',
    showAudio: false,
    showImage: false,
    showCorrectAnswer: true,
    correctAnswerLabel: 'Từ / Chữ Hán cần điền (Đáp án đúng)',
    correctAnswerPlaceholder: 'Ví dụ: 漂亮 hoặc 已经',
    showOptions: false,
  },
  SENTENCE_ORDERING: {
    label: 'Sắp xếp câu',
    badgeClass: 'badgeWriting',
    icon: '🔀',
    description: 'Sắp xếp các từ hoặc vế câu rời rạc thành một câu hoàn chỉnh đúng ngữ pháp.',
    showAudio: false,
    showImage: false,
    showCorrectAnswer: true,
    correctAnswerLabel: 'Câu hoàn chỉnh sau khi sắp xếp đúng',
    correctAnswerPlaceholder: 'Ví dụ: 我打算下个星期去中国旅游。',
    showOptions: true,
  },
  WRITING: {
    label: 'Viết (Tự luận)',
    badgeClass: 'badgeWriting',
    icon: '📝',
    description: 'Tự luận viết câu hoặc đoạn văn. Giáo viên chấm thủ công sau khi thi.',
    showAudio: false,
    showImage: true,
    showCorrectAnswer: true,
    correctAnswerLabel: 'Bài văn mẫu / Tiêu chuẩn chấm điểm',
    correctAnswerPlaceholder: 'Nhập gợi ý đáp án hoặc bài mẫu để đối chiếu...',
    showOptions: false,
  },
  MATCHING: {
    label: 'Nối cặp',
    badgeClass: 'badgeReading',
    icon: '🔗',
    description: 'Nối các cặp từ, hình ảnh hoặc mẫu câu tương ứng với nhau.',
    showAudio: false,
    showImage: true,
    showCorrectAnswer: false,
    showOptions: true,
  },
}

export default function QuestionBuilder({ sectionId, initialQuestions }) {
  const [questions, setQuestions] = useState(initialQuestions || [])
  const [isAdding, setIsAdding] = useState(false)

  const [form, setForm] = useState({
    questionType: 'MULTIPLE_CHOICE',
    content: '',
    audioUrl: '',
    imageUrl: '',
    points: 1,
    sortOrder: 0,
    explanation: '',
    correctAnswer: ''
  })
  const [tfAnswer, setTfAnswer] = useState('TRUE') // 'TRUE' | 'FALSE' for quick True/False toggle
  const [loading, setLoading] = useState(false)

  const [editQuestionId, setEditQuestionId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editTfAnswer, setEditTfAnswer] = useState('TRUE')

  // Trạng thái cho việc thêm option mới
  const [newOption, setNewOption] = useState({}) // { questionId: { content, imageUrl, isCorrect } }
  // Trạng thái cho việc sửa option
  const [editingOptionId, setEditingOptionId] = useState(null)
  const [editOptionForm, setEditOptionForm] = useState({ content: '', imageUrl: '', isCorrect: false })

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }))
  }

  const handleEditChange = (e) => {
    const { name, value, type } = e.target
    setEditForm(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }))
  }

  const handleAdd = async () => {
    if (!form.content.trim() && !form.audioUrl.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi hoặc link file âm thanh')
      return
    }

    try {
      setLoading(true)
      const res = await adminService.addQuestion(sectionId, form)
      const createdQ = res.result
      let updatedOptions = []

      // Nếu là dạng TRUE_FALSE, tự động tạo 2 options Đúng / Sai
      if (form.questionType === 'TRUE_FALSE') {
        try {
          const opt1 = await adminService.addOption(createdQ.id, {
            content: 'Đúng',
            isCorrect: tfAnswer === 'TRUE',
            sortOrder: 1
          })
          const opt2 = await adminService.addOption(createdQ.id, {
            content: 'Sai',
            isCorrect: tfAnswer === 'FALSE',
            sortOrder: 2
          })
          updatedOptions = [opt1.result, opt2.result]
        } catch (e) {
          console.error('Không thể tạo tự động options Đúng/Sai', e)
        }
      }

      setQuestions([...questions, { ...createdQ, options: updatedOptions }])
      setIsAdding(false)
      setForm({
        questionType: form.questionType,
        content: '',
        audioUrl: '',
        imageUrl: '',
        points: form.points || 1,
        sortOrder: questions.length + 1,
        explanation: '',
        correctAnswer: ''
      })
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi thêm câu hỏi')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xoá câu hỏi này?')) return
    try {
      await adminService.deleteQuestion(id)
      setQuestions(questions.filter(q => q.id !== id))
    } catch (err) {
      alert('Lỗi khi xoá câu hỏi')
    }
  }

  const handleStartEdit = (q) => {
    setEditQuestionId(q.id)
    setEditForm({
      questionType: q.questionType || 'MULTIPLE_CHOICE',
      content: q.content || '',
      audioUrl: q.audioUrl || '',
      imageUrl: q.imageUrl || '',
      points: q.points || 1,
      sortOrder: q.sortOrder || 0,
      explanation: q.explanation || '',
      correctAnswer: q.correctAnswer || ''
    })

    if (q.questionType === 'TRUE_FALSE') {
      const correctOpt = q.options?.find(o => o.isCorrect)
      if (correctOpt) {
        setEditTfAnswer(correctOpt.content?.toLowerCase() === 'sai' ? 'FALSE' : 'TRUE')
      }
    }
  }

  const handleSaveEdit = async () => {
    try {
      setLoading(true)
      const res = await adminService.updateQuestion(editQuestionId, editForm)
      
      // Nếu là TRUE_FALSE và đã có options, cập nhật lại isCorrect của 2 options
      const currentQ = questions.find(q => q.id === editQuestionId)
      let currentOptions = currentQ?.options || []

      if (editForm.questionType === 'TRUE_FALSE' && currentOptions.length >= 2) {
        try {
          const optTrue = currentOptions.find(o => o.content?.toLowerCase() === 'đúng') || currentOptions[0]
          const optFalse = currentOptions.find(o => o.content?.toLowerCase() === 'sai') || currentOptions[1]

          if (optTrue) {
            const u1 = await adminService.updateOption(optTrue.id, {
              content: optTrue.content,
              isCorrect: editTfAnswer === 'TRUE',
              sortOrder: 1
            })
            optTrue.isCorrect = editTfAnswer === 'TRUE'
          }
          if (optFalse) {
            const u2 = await adminService.updateOption(optFalse.id, {
              content: optFalse.content,
              isCorrect: editTfAnswer === 'FALSE',
              sortOrder: 2
            })
            optFalse.isCorrect = editTfAnswer === 'FALSE'
          }
        } catch (e) {
          console.error('Lỗi khi cập nhật options Đúng/Sai', e)
        }
      }

      setQuestions(questions.map(q => q.id === editQuestionId ? { ...res.result, options: currentOptions } : q))
      setEditQuestionId(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật câu hỏi')
    } finally {
      setLoading(false)
    }
  }

  // Handle options logic
  const handleNewOptionChange = (questionId, field, value) => {
    setNewOption(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], [field]: value }
    }))
  }

  const handleAddOption = async (questionId) => {
    const optData = newOption[questionId]
    if (!optData || (!optData.content?.trim() && !optData.imageUrl?.trim())) return

    try {
      setLoading(true)
      const res = await adminService.addOption(questionId, {
        content: optData.content || '',
        imageUrl: optData.imageUrl || null,
        isCorrect: optData.isCorrect || false,
        sortOrder: 0
      })
      setQuestions(questions.map(q => {
        if (q.id === questionId) {
          return { ...q, options: [...(q.options || []), res.result] }
        }
        return q
      }))
      // Reset
      setNewOption(prev => ({ ...prev, [questionId]: { content: '', imageUrl: '', isCorrect: false } }))
    } catch (err) {
      alert('Lỗi khi thêm đáp án')
    } finally {
      setLoading(false)
    }
  }

  const handleStartEditOption = (opt) => {
    setEditingOptionId(opt.id)
    setEditOptionForm({ content: opt.content, imageUrl: opt.imageUrl || '', isCorrect: opt.isCorrect })
  }

  const handleSaveEditOption = async (questionId, optId, sortOrder) => {
    if (!editOptionForm.content.trim() && !editOptionForm.imageUrl.trim()) return

    try {
      setLoading(true)
      const res = await adminService.updateOption(optId, {
        content: editOptionForm.content,
        imageUrl: editOptionForm.imageUrl || null,
        isCorrect: editOptionForm.isCorrect,
        sortOrder
      })
      setQuestions(questions.map(q => {
        if (q.id === questionId) {
          return { ...q, options: q.options.map(o => o.id === optId ? res.result : o) }
        }
        return q
      }))
      setEditingOptionId(null)
    } catch (err) {
      alert('Lỗi khi cập nhật đáp án')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOption = async (questionId, optionId) => {
    if (!window.confirm('Xoá đáp án này?')) return
    try {
      setLoading(true)
      await adminService.deleteOption(optionId)
      setQuestions(questions.map(q => {
        if (q.id === questionId) {
          return { ...q, options: q.options.filter(o => o.id !== optionId) }
        }
        return q
      }))
    } catch (err) {
      alert('Lỗi khi xoá đáp án')
    } finally {
      setLoading(false)
    }
  }

  const currentTypeConfig = QUESTION_TYPE_CONFIG[form.questionType] || QUESTION_TYPE_CONFIG.MULTIPLE_CHOICE
  const editTypeConfig = editForm.questionType ? (QUESTION_TYPE_CONFIG[editForm.questionType] || QUESTION_TYPE_CONFIG.MULTIPLE_CHOICE) : null

  return (
    <div style={{ marginLeft: '16px' }}>
      <h4 style={{ fontSize: '14px', marginBottom: '12px', color: '#475569' }}>
        Danh sách câu hỏi trong phần thi ({questions.length}):
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {questions.map((q, idx) => {
          const typeConf = QUESTION_TYPE_CONFIG[q.questionType] || QUESTION_TYPE_CONFIG.MULTIPLE_CHOICE

          return (
            <div key={q.id} style={{ border: '1px solid #cbd5e1', padding: '14px', borderRadius: '8px', background: '#fff' }}>
              {/* Header câu hỏi */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>Câu {idx + 1}:</strong>
                    <span className={`${styles.badge} ${styles[typeConf.badgeClass] || styles.badgeDefault}`}>
                      {typeConf.icon} {typeConf.label}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>({q.points} điểm)</span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                    {q.content || <em style={{ color: '#94a3b8' }}>[Chỉ có file nghe / ảnh]</em>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className={styles.btnSecondary} onClick={() => handleStartEdit(q)} style={{ padding: '4px 10px', fontSize: '12px' }}>Sửa</button>
                  <button className={styles.btnDanger} onClick={() => handleDelete(q.id)} style={{ padding: '4px 10px', fontSize: '12px' }}>Xoá</button>
                </div>
              </div>

              {/* Player Audio nếu câu hỏi có audio */}
              {q.audioUrl && (
                <div className={styles.mediaPreviewBox} style={{ margin: '8px 0' }}>
                  <div className={styles.mediaPreviewLabel}>
                    <span>🎵 File âm thanh đính kèm:</span>
                    <a href={q.audioUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#2563eb', textDecoration: 'underline' }}>Mở link</a>
                  </div>
                  <audio controls src={q.audioUrl} className={styles.audioPlayer}>
                    Trình duyệt không hỗ trợ phát audio.
                  </audio>
                </div>
              )}

              {/* Preview Ảnh nếu câu hỏi có image */}
              {q.imageUrl && (
                <div className={styles.mediaPreviewBox} style={{ margin: '8px 0' }}>
                  <div className={styles.mediaPreviewLabel}>
                    <span>🖼️ Ảnh đề bài:</span>
                  </div>
                  <img src={q.imageUrl} alt="Ảnh câu hỏi" className={styles.imagePreview} onError={(e) => { e.target.style.display = 'none' }} />
                </div>
              )}

              {/* FORM CHỈNH SỬA CÂU HỎI */}
              {editQuestionId === q.id && (
                <div style={{ padding: '16px', background: '#f8fafc', border: '1.5px dashed #3b82f6', margin: '12px 0', borderRadius: '8px' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '12px', color: '#1e3a8a' }}>
                    ✏️ Chỉnh sửa câu hỏi #{idx + 1}
                  </div>

                  {editTypeConfig && (
                    <div className={styles.typeIntroBox}>
                      <span>{editTypeConfig.icon}</span>
                      <span><strong>{editTypeConfig.label}</strong>: {editTypeConfig.description}</span>
                    </div>
                  )}

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Dạng câu hỏi</label>
                      <select className={styles.select} name="questionType" value={editForm.questionType} onChange={handleEditChange}>
                        <option value="MULTIPLE_CHOICE">🔤 Trắc nghiệm</option>
                        <option value="DIALOGUE_LISTENING">🎧 Nghe chọn đáp án</option>
                        <option value="PICTURE_SELECTION">🖼️ Nghe / Chọn tranh</option>
                        <option value="TRUE_FALSE">⚖️ Đúng / Sai</option>
                        <option value="FILL_IN_BLANK">✍️ Điền vào chỗ trống</option>
                        <option value="SENTENCE_ORDERING">🔀 Sắp xếp câu</option>
                        <option value="WRITING">📝 Viết (Tự luận)</option>
                        <option value="MATCHING">🔗 Nối cặp</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Điểm số</label>
                      <input className={styles.input} type="number" min="1" name="points" value={editForm.points} onChange={handleEditChange} />
                    </div>

                    {/* Audio URL Input */}
                    {(editTypeConfig?.showAudio || editForm.audioUrl) && (
                      <div className={styles.formGroupFull}>
                        <label className={styles.label}>
                          Đường dẫn Audio (URL file .mp3, .wav) {editTypeConfig?.audioPriority && <span style={{ color: '#e11d48' }}>*</span>}
                        </label>
                        <input
                          className={styles.input}
                          type="url"
                          name="audioUrl"
                          placeholder="https://domain.com/path/to/listening-audio.mp3"
                          value={editForm.audioUrl}
                          onChange={handleEditChange}
                        />
                        {editForm.audioUrl && (
                          <div className={styles.mediaPreviewBox}>
                            <div className={styles.mediaPreviewLabel}>🎵 Nghe thử:</div>
                            <audio controls src={editForm.audioUrl} className={styles.audioPlayer}>
                              Trình duyệt không hỗ trợ thẻ audio.
                            </audio>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Image URL Input */}
                    {(editTypeConfig?.showImage || editForm.imageUrl) && (
                      <div className={styles.formGroupFull}>
                        <label className={styles.label}>Đường dẫn ảnh đề bài (URL .jpg, .png)</label>
                        <input
                          className={styles.input}
                          type="url"
                          name="imageUrl"
                          placeholder="https://domain.com/path/to/question-image.jpg"
                          value={editForm.imageUrl}
                          onChange={handleEditChange}
                        />
                        {editForm.imageUrl && (
                          <div className={styles.mediaPreviewBox}>
                            <div className={styles.mediaPreviewLabel}>🖼️ Xem trước ảnh:</div>
                            <img src={editForm.imageUrl} alt="Preview" className={styles.imagePreview} onError={(e) => { e.target.style.display = 'none' }} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content TextArea */}
                    <div className={styles.formGroupFull}>
                      <label className={styles.label}>
                        {editForm.questionType === 'DIALOGUE_LISTENING' ? 'Transcript / Câu hỏi nghe' :
                         editForm.questionType === 'FILL_IN_BLANK' ? 'Nội dung câu hỏi (chứa dấu ___ cho chỗ trống)' :
                         editForm.questionType === 'WRITING' ? 'Đề bài tự luận' :
                         'Nội dung câu hỏi'}
                      </label>
                      <textarea
                        className={styles.textarea}
                        name="content"
                        value={editForm.content}
                        onChange={handleEditChange}
                        placeholder="Nhập nội dung câu hỏi..."
                      />
                    </div>

                    {/* True/False Selector */}
                    {editForm.questionType === 'TRUE_FALSE' && (
                      <div className={styles.formGroupFull}>
                        <label className={styles.label}>Đáp án đúng cho câu này:</label>
                        <div className={styles.tfContainer}>
                          <div
                            className={`${styles.tfCard} ${editTfAnswer === 'TRUE' ? styles.tfActiveTrue : ''}`}
                            onClick={() => setEditTfAnswer('TRUE')}
                          >
                            ✓ Đúng (True)
                          </div>
                          <div
                            className={`${styles.tfCard} ${editTfAnswer === 'FALSE' ? styles.tfActiveFalse : ''}`}
                            onClick={() => setEditTfAnswer('FALSE')}
                          >
                            ✗ Sai (False)
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Correct Answer Input (Fill-in-blank, Sentence ordering, Writing) */}
                    {editTypeConfig?.showCorrectAnswer && (
                      <div className={styles.formGroupFull}>
                        <label className={styles.label}>{editTypeConfig.correctAnswerLabel || 'Đáp án đúng'}</label>
                        <input
                          className={styles.input}
                          name="correctAnswer"
                          placeholder={editTypeConfig.correctAnswerPlaceholder || 'Nhập đáp án...'}
                          value={editForm.correctAnswer}
                          onChange={handleEditChange}
                        />
                      </div>
                    )}

                    {/* Explanation */}
                    <div className={styles.formGroupFull}>
                      <label className={styles.label}>Giải thích đáp án</label>
                      <textarea
                        className={styles.textarea}
                        style={{ minHeight: '50px' }}
                        name="explanation"
                        value={editForm.explanation}
                        onChange={handleEditChange}
                        placeholder="Giải thích chi tiết vì sao chọn đáp án này..."
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                    <button className={styles.btnPrimary} onClick={handleSaveEdit} disabled={loading}>Lưu thay đổi</button>
                    <button className={styles.btnSecondary} onClick={() => setEditQuestionId(null)}>Hủy</button>
                  </div>
                </div>
              )}

              {/* Hiển thị đáp án đúng cho các loại không dùng options */}
              {['FILL_IN_BLANK', 'SENTENCE_ORDERING'].includes(q.questionType) && (
                <div style={{ fontSize: '13px', color: '#16a34a', marginTop: '6px', fontWeight: '500' }}>
                  🎯 Đáp án đúng: <strong>{q.correctAnswer}</strong>
                </div>
              )}
              {q.questionType === 'WRITING' && q.correctAnswer && (
                <div style={{ fontSize: '13px', color: '#2563eb', marginTop: '6px' }}>
                  📝 Gợi ý / Bài mẫu: {q.correctAnswer}
                </div>
              )}
              {q.explanation && (
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>
                  💡 Giải thích: {q.explanation}
                </div>
              )}

              {/* OPTIONS LIST CHO CÁC LOẠI CẦN OPTIONS */}
              {typeConf.showOptions && (
                <div style={{ marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                    Các lựa chọn trả lời:
                  </div>

                  {q.options?.map(opt => (
                    <div key={opt.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      fontSize: '13px', 
                      marginBottom: '8px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: opt.isCorrect ? '#f0fdf4' : '#f8fafc',
                      border: `1px solid ${opt.isCorrect ? '#86efac' : '#e2e8f0'}`
                    }}>
                      {editingOptionId === opt.id ? (
                        <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            placeholder="Nội dung đáp án"
                            value={editOptionForm.content}
                            onChange={e => setEditOptionForm({ ...editOptionForm, content: e.target.value })}
                            style={{ flex: 1, minWidth: '150px', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                          {typeConf.allowOptionImage && (
                            <input
                              type="url"
                              placeholder="URL ảnh đáp án (tùy chọn)"
                              value={editOptionForm.imageUrl}
                              onChange={e => setEditOptionForm({ ...editOptionForm, imageUrl: e.target.value })}
                              style={{ flex: 1, minWidth: '150px', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            />
                          )}
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: '600', color: editOptionForm.isCorrect ? '#16a34a' : '#475569' }}>
                            <input
                              type="checkbox"
                              checked={editOptionForm.isCorrect}
                              onChange={e => setEditOptionForm({ ...editOptionForm, isCorrect: e.target.checked })}
                            />
                            Đáp án đúng
                          </label>
                          <button onClick={() => handleSaveEditOption(q.id, opt.id, opt.sortOrder)} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Lưu</button>
                          <button onClick={() => setEditingOptionId(null)} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
                        </div>
                      ) : (
                        <>
                          <span style={{ color: opt.isCorrect ? '#16a34a' : '#475569', flex: 1, fontWeight: opt.isCorrect ? '600' : 'normal', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{opt.isCorrect ? '✅' : '⚪'}</span>
                            {opt.imageUrl && (
                              <img src={opt.imageUrl} alt="" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                            )}
                            <span>{opt.content || <em>[Ảnh tranh]</em>}</span>
                          </span>
                          <span style={{ cursor: 'pointer', color: '#3b82f6', fontSize: '13px' }} onClick={() => handleStartEditOption(opt)}>✏️ Sửa</span>
                          <span style={{ cursor: 'pointer', color: '#dc2626', fontSize: '16px', marginLeft: '6px' }} onClick={() => handleDeleteOption(q.id, opt.id)}>×</span>
                        </>
                      )}
                    </div>
                  ))}

                  {/* Form thêm option mới cho câu hỏi */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px', background: '#f1f5f9', padding: '10px', borderRadius: '6px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Nhập nội dung lựa chọn (VD: A. 苹果)..."
                      value={newOption[q.id]?.content || ''}
                      onChange={(e) => handleNewOptionChange(q.id, 'content', e.target.value)}
                      style={{ flex: 1, minWidth: '160px', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px' }}
                    />
                    {typeConf.allowOptionImage && (
                      <input
                        type="url"
                        placeholder="URL ảnh lựa chọn (nếu có)..."
                        value={newOption[q.id]?.imageUrl || ''}
                        onChange={(e) => handleNewOptionChange(q.id, 'imageUrl', e.target.value)}
                        style={{ flex: 1, minWidth: '160px', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px' }}
                      />
                    )}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>
                      <input
                        type="checkbox"
                        checked={newOption[q.id]?.isCorrect || false}
                        onChange={(e) => handleNewOptionChange(q.id, 'isCorrect', e.target.checked)}
                      />
                      Là đáp án đúng
                    </label>
                    <button
                      onClick={() => handleAddOption(q.id)}
                      disabled={loading || (!newOption[q.id]?.content?.trim() && !newOption[q.id]?.imageUrl?.trim())}
                      style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                      + Thêm lựa chọn
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* FORM TẠO CÂU HỎI MỚI (ĐƯỢC THIẾT KẾ THEO TỪNG LOẠI CÂU HỎI) */}
      {isAdding ? (
        <div style={{ border: '1.5px solid #60a5fa', padding: '20px', borderRadius: '8px', marginTop: '16px', background: '#f0f7ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h5 style={{ margin: 0, fontSize: '16px', color: '#1e40af' }}>
              ➕ Tạo câu hỏi mới cho phần thi
            </h5>
            <button className={styles.btnSecondary} onClick={() => setIsAdding(false)} style={{ padding: '4px 10px', fontSize: '12px' }}>
              ✕ Đóng
            </button>
          </div>

          {/* Banner mô tả dạng câu hỏi */}
          <div className={styles.typeIntroBox}>
            <span style={{ fontSize: '16px' }}>{currentTypeConfig.icon}</span>
            <div>
              <strong>{currentTypeConfig.label}:</strong> {currentTypeConfig.description}
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Dạng câu hỏi</label>
              <select className={styles.select} name="questionType" value={form.questionType} onChange={handleChange}>
                <option value="MULTIPLE_CHOICE">🔤 Trắc nghiệm (4 đáp án)</option>
                <option value="DIALOGUE_LISTENING">🎧 Nghe chọn đáp án (Listening)</option>
                <option value="PICTURE_SELECTION">🖼️ Nghe / Chọn tranh (Picture)</option>
                <option value="TRUE_FALSE">⚖️ Phán đoán Đúng / Sai</option>
                <option value="FILL_IN_BLANK">✍️ Điền vào chỗ trống</option>
                <option value="SENTENCE_ORDERING">🔀 Sắp xếp câu</option>
                <option value="WRITING">📝 Viết (Tự luận)</option>
                <option value="MATCHING">🔗 Nối cặp</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Điểm số</label>
              <input className={styles.input} type="number" min="1" name="points" value={form.points} onChange={handleChange} />
            </div>

            {/* Audio URL Input (Cho các dạng bài nghe) */}
            {currentTypeConfig.showAudio && (
              <div className={styles.formGroupFull}>
                <label className={styles.label} style={{ color: currentTypeConfig.audioPriority ? '#0369a1' : 'inherit' }}>
                  Đường dẫn Audio (URL file .mp3, .wav) {currentTypeConfig.audioPriority && <span style={{ color: '#e11d48' }}>*</span>}
                </label>
                <input
                  className={styles.input}
                  type="url"
                  name="audioUrl"
                  placeholder="Dán link file âm thanh (VD: https://media.mandarinzone.com/uploads/audio.mp3)..."
                  value={form.audioUrl}
                  onChange={handleChange}
                />
                <div className={styles.fieldHint}>
                  💡 Dán trực tiếp URL file âm thanh từ web hoặc hosting của bạn.
                </div>
                {form.audioUrl && (
                  <div className={styles.mediaPreviewBox}>
                    <div className={styles.mediaPreviewLabel}>
                      <span>🎵 Nghe thử Audio vừa nhập:</span>
                    </div>
                    <audio controls src={form.audioUrl} className={styles.audioPlayer}>
                      Trình duyệt không hỗ trợ thẻ audio.
                    </audio>
                  </div>
                )}
              </div>
            )}

            {/* Image URL Input (Cho câu hỏi có hình ảnh) */}
            {currentTypeConfig.showImage && (
              <div className={styles.formGroupFull}>
                <label className={styles.label}>Đường dẫn ảnh đề bài (URL .jpg, .png)</label>
                <input
                  className={styles.input}
                  type="url"
                  name="imageUrl"
                  placeholder="Dán link ảnh (VD: https://i.imgur.com/example.png)..."
                  value={form.imageUrl}
                  onChange={handleChange}
                />
                <div className={styles.fieldHint}>
                  💡 Dán link ảnh minh họa cho câu hỏi (từ Imgur, Cloudinary, ImgBB hoặc trang web khác).
                </div>
                {form.imageUrl && (
                  <div className={styles.mediaPreviewBox}>
                    <div className={styles.mediaPreviewLabel}>
                      <span>🖼️ Xem trước ảnh:</span>
                    </div>
                    <img src={form.imageUrl} alt="Xem trước" className={styles.imagePreview} onError={(e) => { e.target.style.display = 'none' }} />
                  </div>
                )}
              </div>
            )}

            {/* Nội dung câu hỏi */}
            <div className={styles.formGroupFull}>
              <label className={styles.label}>
                {form.questionType === 'DIALOGUE_LISTENING' ? 'Transcript / Nội dung câu hỏi' :
                 form.questionType === 'FILL_IN_BLANK' ? 'Nội dung câu hỏi (chứa dấu ___ cho chỗ trống)' :
                 form.questionType === 'WRITING' ? 'Đề bài tự luận' :
                 'Nội dung câu hỏi'}
              </label>
              <textarea
                className={styles.textarea}
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder={
                  form.questionType === 'FILL_IN_BLANK' ? 'Ví dụ: 他今天去学校___书。' :
                  form.questionType === 'DIALOGUE_LISTENING' ? 'Nhập transcript hoặc câu hỏi (nếu có)...' :
                  'Nhập nội dung đề bài...'
                }
              />
            </div>

            {/* Chọn nhanh Đúng / Sai nếu là TRUE_FALSE */}
            {form.questionType === 'TRUE_FALSE' && (
              <div className={styles.formGroupFull}>
                <label className={styles.label}>Chọn đáp án đúng cho câu này:</label>
                <div className={styles.tfContainer}>
                  <div
                    className={`${styles.tfCard} ${tfAnswer === 'TRUE' ? styles.tfActiveTrue : ''}`}
                    onClick={() => setTfAnswer('TRUE')}
                  >
                    ✓ Đúng (True)
                  </div>
                  <div
                    className={`${styles.tfCard} ${tfAnswer === 'FALSE' ? styles.tfActiveFalse : ''}`}
                    onClick={() => setTfAnswer('FALSE')}
                  >
                    ✗ Sai (False)
                  </div>
                </div>
                <div className={styles.fieldHint}>
                  💡 Hệ thống sẽ tự động tạo 2 phương án "Đúng" và "Sai", bạn không cần tạo lựa chọn thủ công.
                </div>
              </div>
            )}

            {/* Ô nhập đáp án đúng riêng cho Fill-in-blank, Sentence ordering, Writing */}
            {currentTypeConfig.showCorrectAnswer && (
              <div className={styles.formGroupFull}>
                <label className={styles.label} style={{ color: '#0f766e', fontWeight: '600' }}>
                  {currentTypeConfig.correctAnswerLabel || 'Đáp án đúng'}
                </label>
                <input
                  className={styles.input}
                  name="correctAnswer"
                  placeholder={currentTypeConfig.correctAnswerPlaceholder || 'Nhập đáp án...'}
                  value={form.correctAnswer}
                  onChange={handleChange}
                />
              </div>
            )}

            {/* Giải thích đáp án */}
            <div className={styles.formGroupFull}>
              <label className={styles.label}>Giải thích đáp án</label>
              <textarea
                className={styles.textarea}
                style={{ minHeight: '50px' }}
                name="explanation"
                placeholder="Giải thích ngữ pháp hoặc từ vựng để học viên hiểu sau khi nộp bài..."
                value={form.explanation}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.btnSecondary} onClick={() => setIsAdding(false)}>Huỷ</button>
            <button className={styles.btnPrimary} onClick={handleAdd} disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu câu hỏi'}
            </button>
          </div>
        </div>
      ) : (
        <button
          className={styles.addBtn}
          style={{ marginTop: '16px', width: 'auto', background: '#fff' }}
          onClick={() => setIsAdding(true)}
        >
          + Thêm câu hỏi vào phần thi này
        </button>
      )}
    </div>
  )
}
