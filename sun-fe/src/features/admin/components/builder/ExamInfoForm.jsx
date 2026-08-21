import { useState, useEffect } from 'react'
import { adminService } from '../../../../services/adminService'
import styles from './Builder.module.css'

export default function ExamInfoForm({ exam, onCreated, onUpdated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    hskVersion: 'HSK_3',
    hskLevel: 3,
    examType: 'MOCK',
    timeLimit: 90,
    passingScore: 60
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (exam) {
      setForm({
        title: exam.title || '',
        description: exam.description || '',
        hskVersion: exam.hskVersion || 'HSK_3',
        hskLevel: exam.hskLevel || 3,
        examType: exam.examType || 'MOCK',
        timeLimit: exam.timeLimit || 90,
        passingScore: exam.passingScore || 60
      })
    }
  }, [exam])

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }))
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      if (exam && exam.id) {
        const res = await adminService.updateExam(exam.id, form)
        alert('Cập nhật thông tin thành công!')
        onUpdated?.(res.result)
      } else {
        const res = await adminService.createExam(form)
        alert('Tạo đề thi thành công! Vui lòng tiếp tục thêm phần thi.')
        onCreated?.(res.result)
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu đề thi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>Thông tin chung</h3>
      </div>
      <div className={styles.formGrid}>
        <div className={styles.formGroupFull}>
          <label className={styles.label}>Tiêu đề đề thi</label>
          <input className={styles.input} name="title" value={form.title} onChange={handleChange} placeholder="VD: HSK 3 - Đề thi thật 2024" />
        </div>
        <div className={styles.formGroupFull}>
          <label className={styles.label}>Mô tả</label>
          <textarea className={styles.textarea} name="description" value={form.description} onChange={handleChange} placeholder="Mô tả ngắn về đề thi này..." />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Phiên bản HSK</label>
          <select className={styles.select} name="hskVersion" value={form.hskVersion} onChange={handleChange}>
            <option value="HSK_2">HSK Cũ (1-6)</option>
            <option value="HSK_3">HSK 3.0 (1-9)</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Cấp độ (1-9)</label>
          <input className={styles.input} type="number" min="1" max="9" name="hskLevel" value={form.hskLevel} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Loại đề</label>
          <select className={styles.select} name="examType" value={form.examType} onChange={handleChange}>
            <option value="MOCK">Thi thử (MOCK)</option>
            <option value="REAL">Đề thật (REAL)</option>
            <option value="PRACTICE">Luyện tập (PRACTICE)</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Thời gian (phút)</label>
          <input className={styles.input} type="number" name="timeLimit" value={form.timeLimit} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Điểm đỗ (%)</label>
          <input className={styles.input} type="number" name="passingScore" value={form.passingScore} onChange={handleChange} />
        </div>
      </div>
      <div className={styles.actions}>
        <button className={styles.btnPrimary} onClick={handleSave} disabled={loading}>
          {loading ? 'Đang lưu...' : (exam ? 'Cập nhật thông tin' : 'Tạo đề thi')}
        </button>
      </div>
    </div>
  )
}
