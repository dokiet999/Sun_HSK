import { useState } from 'react'
import { adminService } from '../../../../services/adminService'
import QuestionBuilder from './QuestionBuilder'
import styles from './Builder.module.css'

export default function SectionBuilder({ examId, initialSections }) {
  const [sections, setSections] = useState(initialSections || [])
  const [isAdding, setIsAdding] = useState(false)
  const [form, setForm] = useState({ sectionType: 'LISTENING', title: '', instructions: '', timeLimit: 30, sortOrder: 0 })
  const [loading, setLoading] = useState(false)
  
  const [expandedSection, setExpandedSection] = useState(null)
  
  const [editSectionId, setEditSectionId] = useState(null)
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
      const res = await adminService.addSection(examId, form)
      setSections([...sections, res.result])
      setIsAdding(false)
      setForm({ sectionType: 'LISTENING', title: '', instructions: '', timeLimit: 30, sortOrder: sections.length + 1 })
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi thêm phần thi')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xoá phần thi này sẽ xoá toàn bộ câu hỏi bên trong. Tiếp tục?')) return
    try {
      await adminService.deleteSection(id)
      setSections(sections.filter(s => s.id !== id))
    } catch (err) {
      alert('Lỗi khi xoá phần thi')
    }
  }

  const handleStartEdit = (section, e) => {
    e.stopPropagation()
    setEditSectionId(section.id)
    setEditForm({
      sectionType: section.sectionType || 'LISTENING',
      title: section.title || '',
      instructions: section.instructions || '',
      timeLimit: section.timeLimit || 30,
      sortOrder: section.sortOrder || 0
    })
  }

  const handleSaveEdit = async () => {
    try {
      setLoading(true)
      const res = await adminService.updateSection(editSectionId, editForm)
      setSections(sections.map(s => s.id === editSectionId ? res.result : s))
      setEditSectionId(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật phần thi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.sectionBuilder}>
      <div className={styles.list}>
        {sections.map(section => (
          <div key={section.id} className={styles.listItem}>
            <div className={styles.listItemHeader} onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}>
              <span className={styles.listItemTitle}>
                {section.title || section.sectionType} ({section.questions?.length || 0} câu hỏi)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className={styles.btnSecondary} 
                  onClick={(e) => handleStartEdit(section, e)}
                  style={{ padding: '4px 8px', fontSize: '12px' }}>
                  Sửa
                </button>
                <button 
                  className={styles.btnDanger} 
                  onClick={(e) => { e.stopPropagation(); handleDelete(section.id) }}
                  style={{ padding: '4px 8px', fontSize: '12px' }}>
                  Xoá
                </button>
                <span>{expandedSection === section.id ? '▼' : '▶'}</span>
              </div>
            </div>

            {editSectionId === section.id && (
              <div style={{ padding: '16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Tiêu đề phần thi</label>
                    <input className={styles.input} name="title" value={editForm.title} onChange={handleEditChange} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Thời gian (phút)</label>
                    <input className={styles.input} type="number" name="timeLimit" value={editForm.timeLimit} onChange={handleEditChange} />
                  </div>
                  <div className={styles.formGroupFull}>
                    <label className={styles.label}>Hướng dẫn làm bài</label>
                    <textarea className={styles.textarea} name="instructions" value={editForm.instructions} onChange={handleEditChange} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button className={styles.btnPrimary} onClick={handleSaveEdit} disabled={loading}>Lưu cập nhật</button>
                  <button className={styles.btnSecondary} onClick={() => setEditSectionId(null)}>Hủy</button>
                </div>
              </div>
            )}
            
            {expandedSection === section.id && (
              <div style={{ padding: '16px 0', borderTop: '1px solid #e2e8f0' }}>
                <QuestionBuilder sectionId={section.id} initialQuestions={section.questions || []} />
              </div>
            )}
          </div>
        ))}
      </div>

      {isAdding ? (
        <div className={styles.card} style={{ marginTop: '16px' }}>
          <h4 className={styles.cardTitle} style={{ marginBottom: '16px' }}>Thêm phần thi mới</h4>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Loại kỹ năng</label>
              <select className={styles.select} name="sectionType" value={form.sectionType} onChange={handleChange}>
                <option value="LISTENING">Nghe (Listening)</option>
                <option value="READING">Đọc (Reading)</option>
                <option value="WRITING">Viết (Writing)</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Tiêu đề phần thi</label>
              <input className={styles.input} name="title" value={form.title} onChange={handleChange} placeholder="VD: Phần 1 - Nghe hiểu" />
            </div>
            <div className={styles.formGroupFull}>
              <label className={styles.label}>Hướng dẫn làm bài</label>
              <textarea className={styles.textarea} name="instructions" value={form.instructions} onChange={handleChange} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Thời gian (phút)</label>
              <input className={styles.input} type="number" name="timeLimit" value={form.timeLimit} onChange={handleChange} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Thứ tự hiển thị</label>
              <input className={styles.input} type="number" name="sortOrder" value={form.sortOrder} onChange={handleChange} />
            </div>
          </div>
          <div className={styles.actions}>
            <button className={styles.btnSecondary} onClick={() => setIsAdding(false)}>Huỷ</button>
            <button className={styles.btnPrimary} onClick={handleAdd} disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu phần thi'}
            </button>
          </div>
        </div>
      ) : (
        <button className={styles.addBtn} onClick={() => setIsAdding(true)}>
          + Thêm phần thi
        </button>
      )}
    </div>
  )
}
