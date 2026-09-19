import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageContainer from '../layouts/PageContainer'
import { examService } from '../services/examService'
import styles from './Hsk3Tests.module.css'

export default function Hsk3Tests() {
  const navigate = useNavigate()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTier, setActiveTier] = useState('ALL') // 'ALL' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'

  useEffect(() => {
    async function fetchExams() {
      try {
        setLoading(true)
        const data = await examService.listExams({ size: 500 })
        if (data?.result?.content) {
          // Lọc các đề thi HSK 3.0
          const hsk3Exams = data.result.content.filter(
            (exam) => exam.hskVersion === 'HSK_3'
          )
          setExams(hsk3Exams)
        }
      } catch (err) {
        console.error('Lỗi khi tải đề thi HSK 3.0:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchExams()
  }, [])

  const getTierInfo = (level) => {
    if (level <= 3) return { tier: 'BEGINNER', label: 'Bậc 1: Sơ cấp' }
    if (level <= 6) return { tier: 'INTERMEDIATE', label: 'Bậc 2: Trung cấp' }
    return { tier: 'ADVANCED', label: 'Bậc 3: Cao cấp' }
  }

  const filteredExams = exams.filter((exam) => {
    if (activeTier === 'ALL') return true
    const { tier } = getTierInfo(exam.hskLevel || 1)
    return tier === activeTier
  })

  return (
    <PageContainer>
      <div className={styles.pageWrap}>
        {/* Header Hero */}
        <div className={styles.heroSection}>
          <div className={styles.container}>
            <div className={styles.heroContent}>
              <span className={styles.badge}>HSK 3.0 • Computer-Based Test</span>
              <h1 className={styles.title}>Kho đề thi HSK 3.0 (iBT)</h1>
              <p className={styles.description}>
                Hệ thống thi máy tính chuẩn quốc tế mô phỏng kỳ thi HSK mới 3 bậc 9 cấp. Đầy đủ các phần thi Nghe, Đọc, Viết và Dịch thuật với giao diện phòng thi chuẩn hóa.
              </p>
            </div>
          </div>
        </div>

        <div className={`${styles.container} ${styles.bodyContainer}`}>
          {/* Filter Tabs */}
          <div className={styles.filterBar}>
          <button
            className={`${styles.filterBtn} ${activeTier === 'ALL' ? styles.filterBtnActive : ''}`}
            onClick={() => setActiveTier('ALL')}
          >
            Tất cả ({exams.length})
          </button>
          <button
            className={`${styles.filterBtn} ${activeTier === 'BEGINNER' ? styles.filterBtnActive : ''}`}
            onClick={() => setActiveTier('BEGINNER')}
          >
            Sơ cấp (HSK 1–3)
          </button>
          <button
            className={`${styles.filterBtn} ${activeTier === 'INTERMEDIATE' ? styles.filterBtnActive : ''}`}
            onClick={() => setActiveTier('INTERMEDIATE')}
          >
            Trung cấp (HSK 4–6)
          </button>
          <button
            className={`${styles.filterBtn} ${activeTier === 'ADVANCED' ? styles.filterBtnActive : ''}`}
            onClick={() => setActiveTier('ADVANCED')}
          >
            Cao cấp (HSK 7–9)
          </button>
        </div>

        {/* Exam List */}
        {loading ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyDesc}>Đang tải danh sách đề thi HSK 3.0...</p>
          </div>
        ) : filteredExams.length > 0 ? (
          <div className={styles.examGrid}>
            {filteredExams.map((exam) => {
              const { label: tierLabel } = getTierInfo(exam.hskLevel || 1)
              return (
                <div key={exam.id} className={styles.examCard}>
                  <div>
                    <div className={styles.cardHead}>
                      <span className={styles.levelTag}>HSK {exam.hskLevel}</span>
                      <span className={styles.tierTag}>{tierLabel}</span>
                    </div>
                    <h3 className={styles.examTitle}>{exam.title}</h3>
                    <p className={styles.examDesc}>
                      {exam.description || 'Đề thi mô phỏng định dạng máy tính iBT chuẩn HSK 3.0'}
                    </p>
                  </div>

                  <div>
                    <div className={styles.metaRow}>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Thời gian</span>
                        <span className={styles.metaValue}>{exam.timeLimit || 90} phút</span>
                      </div>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Số câu</span>
                        <span className={styles.metaValue}>{exam.totalQuestions || 0} câu</span>
                      </div>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Điểm đạt</span>
                        <span className={styles.metaValue}>{exam.passingScore || 60}%</span>
                      </div>
                    </div>

                    <div className={styles.cardAction}>
                      <button
                        type="button"
                        onClick={() => navigate(`/hsk-tests/preview/${exam.id}`)}
                        className={styles.startBtn}
                      >
                        Làm bài iBT →
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h3 className={styles.emptyTitle}>Chưa có đề thi nào trong mục này</h3>
            <p className={styles.emptyDesc}>
              Hệ thống đang tiếp tục cập nhật các đề thi HSK 3.0 mới nhất. Bạn có thể luyện tập với các đề thi HSK 2.0 hiện có.
            </p>
            <Link to="/hsk-tests" className={styles.emptyBtn}>
              Xem đề thi HSK 2.0
            </Link>
          </div>
        )}
      </div>
      </div>
    </PageContainer>
  )
}
