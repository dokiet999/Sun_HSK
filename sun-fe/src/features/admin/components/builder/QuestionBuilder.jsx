import { useState } from 'react'
import { adminService } from '../../../../services/adminService'
import styles from './Builder.module.css'

export default function QuestionBuilder({ sectionId, initialQuestions }) {
  const [questions, setQuestions] = useState(initialQuestions || [])
  const [isAdding, setIsAdding] = useState(false)
  
  const [form, setForm] = useState({
    questionType: 'MULTIPLE_CHOICE',
    content: '',
    points: 1,
    sortOrder: 0,
    explanation: '',
    correctAnswer: ''
  })
  const [loading, setLoading] = useState(false)

  const [editQuestionId, setEditQuestionId] = useState(null)
  const [editForm, setEditForm] = useState({})

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }))
  }

  const handleEditChange = (e) => {
    const { name, value, type } = e.target
    setEditForm(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }))
  }

  const handleAdd = async () => {
    try {
      setLoading(true)
      const res = await adminService.addQuestion(sectionId, form)
      setQuestions([...questions, { ...res.result, options: [] }])
      setIsAdding(false)
      setForm({ ...form, content: '', sortOrder: questions.length + 1 })
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
      points: q.points || 1,
      sortOrder: q.sortOrder || 0,
      explanation: q.explanation || '',
      correctAnswer: q.correctAnswer || ''
    })
  }

  const handleSaveEdit = async () => {
    try {
      setLoading(true)
      const res = await adminService.updateQuestion(editQuestionId, editForm)
      setQuestions(questions.map(q => q.id === editQuestionId ? { ...res.result, options: q.options } : q))
      setEditQuestionId(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật câu hỏi')
    } finally {
      setLoading(false)
    }
  }

  // Handle options logic
  const handleAddOption = async (questionId) => {
    const optContent = window.prompt("Nhập nội dung đáp án (VD: A. ...):")
    if (!optContent) return
    const isCorrect = window.confirm("Đây là đáp án ĐÚNG?")
    
    try {
      const res = await adminService.addOption(questionId, { content: optContent, isCorrect, sortOrder: 0 })
      setQuestions(questions.map(q => {
        if (q.id === questionId) {
          return { ...q, options: [...(q.options || []), res.result] }
        }
        return q
      }))
    } catch (err) {
      alert('Lỗi khi thêm đáp án')
    }
  }

  const handleEditOption = async (questionId, opt) => {
    const newContent = window.prompt("Nhập nội dung mới cho đáp án:", opt.content)
    if (newContent === null) return // Cancel
    const isCorrect = window.confirm("Đây là đáp án ĐÚNG?")
    
    try {
      const res = await adminService.updateOption(opt.id, { content: newContent, isCorrect, sortOrder: opt.sortOrder })
      setQuestions(questions.map(q => {
        if (q.id === questionId) {
          return { ...q, options: q.options.map(o => o.id === opt.id ? res.result : o) }
        }
        return q
      }))
    } catch (err) {
      alert('Lỗi khi cập nhật đáp án')
    }
  }

  const handleDeleteOption = async (questionId, optionId) => {
    if (!window.confirm('Xoá đáp án này?')) return
    try {
      await adminService.deleteOption(optionId)
      setQuestions(questions.map(q => {
        if (q.id === questionId) {
          return { ...q, options: q.options.filter(o => o.id !== optionId) }
        }
        return q
      }))
    } catch (err) {
      alert('Lỗi khi xoá đáp án')
    }
  }

  return (
    <div style={{ marginLeft: '16px' }}>
      <h4 style={{ fontSize: '14px', marginBottom: '12px', color: '#475569' }}>Danh sách câu hỏi:</h4>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {questions.map((q, idx) => (
          <div key={q.id} style={{ border: '1px solid #cbd5e1', padding: '12px', borderRadius: '6px', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ fontSize: '14px' }}>Câu {idx + 1}: {q.content}</strong>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className={styles.btnSecondary} onClick={() => handleStartEdit(q)} style={{ padding: '4px 8px', fontSize: '12px' }}>Sửa</button>
                <button className={styles.btnDanger} onClick={() => handleDelete(q.id)} style={{ padding: '4px 8px', fontSize: '12px' }}>Xoá</button>
              </div>
            </div>
            
            {editQuestionId === q.id && (
              <div style={{ padding: '12px', background: '#f8fafc', border: '1px dashed #cbd5e1', marginBottom: '12px', borderRadius: '6px' }}>
                <div className={styles.formGroupFull} style={{ marginBottom: '8px' }}>
                  <label className={styles.label}>Nội dung câu hỏi</label>
                  <textarea className={styles.textarea} name="content" value={editForm.content} onChange={handleEditChange} />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.label}>Điểm</label>
                    <input className={styles.input} type="number" name="points" value={editForm.points} onChange={handleEditChange} />
                  </div>
                  {editForm.questionType === 'FILL_BLANK' && (
                    <div className={styles.formGroup} style={{ flex: 1 }}>
                      <label className={styles.label}>Đáp án đúng</label>
                      <input className={styles.input} name="correctAnswer" value={editForm.correctAnswer} onChange={handleEditChange} />
                    </div>
                  )}
                </div>
                <div className={styles.formGroupFull} style={{ marginBottom: '8px' }}>
                  <label className={styles.label}>Giải thích</label>
                  <textarea className={styles.textarea} style={{ minHeight: '40px' }} name="explanation" value={editForm.explanation} onChange={handleEditChange} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className={styles.btnPrimary} onClick={handleSaveEdit} disabled={loading}>Lưu</button>
                  <button className={styles.btnSecondary} onClick={() => setEditQuestionId(null)}>Hủy</button>
                </div>
              </div>
            )}

            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
              Dạng: {q.questionType} | Điểm: {q.points}
            </div>

            {/* Options list for MULTIPLE_CHOICE */}
            {q.questionType === 'MULTIPLE_CHOICE' && (
              <div style={{ marginLeft: '12px', borderLeft: '2px solid #e2e8f0', paddingLeft: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>Các lựa chọn:</div>
                {q.options?.map(opt => (
                  <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ color: opt.isCorrect ? '#16a34a' : '#64748b', flex: 1 }}>
                      {opt.isCorrect ? '✅' : '❌'} {opt.content}
                    </span>
                    <span style={{ cursor: 'pointer', color: '#3b82f6' }} onClick={() => handleEditOption(q.id, opt)}>✏️</span>
                    <span style={{ cursor: 'pointer', color: '#dc2626' }} onClick={() => handleDeleteOption(q.id, opt.id)}>×</span>
                  </div>
                ))}
                <button 
                  onClick={() => handleAddOption(q.id)}
                  style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '13px', cursor: 'pointer', marginTop: '8px' }}>
                  + Thêm lựa chọn
                </button>
              </div>
            )}
            
            {q.questionType === 'FILL_BLANK' && (
              <div style={{ fontSize: '13px', color: '#16a34a', marginTop: '8px' }}>
                Đáp án đúng: {q.correctAnswer}
              </div>
            )}
          </div>
        ))}
      </div>

      {isAdding ? (
        <div style={{ border: '1px solid #93c5fd', padding: '16px', borderRadius: '6px', marginTop: '16px', background: '#eff6ff' }}>
          <h5 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Tạo câu hỏi mới</h5>
          <div className={styles.formGrid}>
            <div className={styles.formGroupFull}>
              <label className={styles.label}>Nội dung câu hỏi</label>
              <textarea className={styles.textarea} name="content" value={form.content} onChange={handleChange} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Dạng câu hỏi</label>
              <select className={styles.select} name="questionType" value={form.questionType} onChange={handleChange}>
                <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                <option value="FILL_BLANK">Điền từ</option>
                <option value="MATCHING">Nối từ</option>
                <option value="TRUE_FALSE">Đúng / Sai</option>
                <option value="SHORT_ANSWER">Tự luận ngắn</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Điểm</label>
              <input className={styles.input} type="number" name="points" value={form.points} onChange={handleChange} />
            </div>
            {form.questionType === 'FILL_BLANK' && (
              <div className={styles.formGroupFull}>
                <label className={styles.label}>Đáp án chính xác (Fill blank)</label>
                <input className={styles.input} name="correctAnswer" value={form.correctAnswer} onChange={handleChange} />
              </div>
            )}
            <div className={styles.formGroupFull}>
              <label className={styles.label}>Giải thích đáp án</label>
              <textarea className={styles.textarea} style={{ minHeight: '50px' }} name="explanation" value={form.explanation} onChange={handleChange} />
            </div>
          </div>
          <div className={styles.actions}>
            <button className={styles.btnSecondary} onClick={() => setIsAdding(false)}>Huỷ</button>
            <button className={styles.btnPrimary} onClick={handleAdd} disabled={loading}>Lưu câu hỏi</button>
          </div>
        </div>
      ) : (
        <button className={styles.addBtn} style={{ marginTop: '16px', width: 'auto' }} onClick={() => setIsAdding(true)}>
          + Thêm câu hỏi
        </button>
      )}
    </div>
  )
}
