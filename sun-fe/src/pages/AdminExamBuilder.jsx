import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../layouts/AdminLayout'
import { adminService } from '../services/adminService'
import ExamInfoForm from '../features/admin/components/builder/ExamInfoForm'
import SectionBuilder from '../features/admin/components/builder/SectionBuilder'
import styles from './AdminExamBuilder.module.css'

export default function AdminExamBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [exam, setExam] = useState(null)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) {
      loadExam()
    }
  }, [id])

  async function loadExam() {
    try {
      setLoading(true)
      const data = await adminService.getExamDetail(id)
      setExam(data.result)
    } catch (err) {
      setError('Lỗi khi tải dữ liệu đề thi.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Exam Creation
  const handleExamCreated = (newExam) => {
    setExam(newExam)
    navigate(`/admin/exams/${newExam.id}`, { replace: true })
  }

  return (
    <AdminLayout>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/admin/exams')}>
            ← Quay lại
          </button>
          <h1 className={styles.title}>
            {isEdit ? 'Chỉnh sửa đề thi' : 'Tạo đề thi mới'}
          </h1>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      
      {loading ? (
        <div className={styles.loading}>Đang tải dữ liệu...</div>
      ) : (
        <div className={styles.container}>
          {/* Cấp 1: Exam Metadata */}
          <ExamInfoForm 
            exam={exam} 
            onCreated={handleExamCreated}
            onUpdated={(updated) => setExam({ ...exam, ...updated })} 
          />

          {/* Cấp 2: Sections (Chỉ hiện khi đã tạo Exam) */}
          {exam && exam.id && (
            <div className={styles.sectionsWrapper}>
              <h2 className={styles.sectionTitle}>Các phần thi (Sections)</h2>
              <SectionBuilder examId={exam.id} initialSections={exam.sections || []} />
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  )
}
