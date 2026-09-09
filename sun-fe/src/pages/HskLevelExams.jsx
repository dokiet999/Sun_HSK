import { useState, useEffect } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import PageContainer from '../layouts/PageContainer'
import { ExamHero, ExamList } from '../features/exam'
import { hskLevels } from '../data/examData'
import { examService } from '../services/examService'
import styles from './HskLevelExams.module.css'

const PAGE_SIZE = 5

export default function HskLevelExams() {
  const { level: levelParam } = useParams()
  const levelId = parseInt(levelParam, 10)

  const level = hskLevels.find((l) => l.id === levelId)
  
  const [exams, setExams] = useState([])
  const [countsByLevel, setCountsByLevel] = useState({})
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  // Reset về trang 1 khi chuyển sang cấp độ HSK khác
  useEffect(() => {
    setCurrentPage(1)
  }, [levelId])

  useEffect(() => {
    async function fetchExams() {
      try {
        setLoading(true)
        const data = await examService.listExams({ size: 500 })
        if (data && data.result && data.result.content) {
          const allExams = data.result.content

          // Tính số lượng đề thi thực tế theo từng cấp độ từ database
          const counts = {}
          allExams.forEach((exam) => {
            const lvl = exam.hskLevel
            counts[lvl] = (counts[lvl] || 0) + 1
          })
          setCountsByLevel(counts)

          // Lọc danh sách đề cho cấp độ hiện tại
          const filtered = allExams.filter((exam) => exam.hskLevel === levelId)
          setExams(filtered)
        }
      } catch (err) {
        console.error('Failed to fetch exams', err)
      } finally {
        setLoading(false)
      }
    }
    fetchExams()
  }, [levelId])

  if (!level) return <Navigate to="/hsk-tests" replace />

  // Tính toán phân trang
  const totalPages = Math.ceil(exams.length / PAGE_SIZE) || 1
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const paginatedExams = exams.slice(startIndex, startIndex + PAGE_SIZE)

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page)
      window.scrollTo({ top: 300, behavior: 'smooth' })
    }
  }

  return (
    <PageContainer>
      {/* Level-colored hero */}
      <ExamHero level={level} examCount={loading ? undefined : exams.length} />

      <div className={styles.body}>
        <div className="container">
          <div className={styles.layout}>
            {/* Sidebar: level switcher */}
            <aside className={styles.sidebar}>
              <div className={styles.sidebarCard}>
                <div className={styles.sidebarTitle}>Chọn cấp độ khác</div>
                <nav className={styles.levelNav}>
                  {hskLevels.map((l) => (
                    <Link
                      key={l.id}
                      to={`/hsk-tests/${l.id}`}
                      className={`${styles.levelLink} ${l.id === levelId ? styles.levelLinkActive : ''}`}
                      style={l.id === levelId ? { '--active-color': l.color, '--active-light': l.colorLight } : {}}
                    >
                      <span
                        className={styles.levelDot}
                        style={{ background: l.color }}
                      />
                      <span className={styles.levelLinkText}>
                        <b>{l.label}</b>
                        <small>{l.sublabel} · {countsByLevel[l.id] !== undefined ? countsByLevel[l.id] : 0} đề</small>
                      </span>
                      {l.id === levelId && <span className={styles.activeArrow}>←</span>}
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Quick info card */}
              <div className={styles.infoCard}
                style={{ '--level-color': level.color, '--level-light': level.colorLight, '--level-border': level.colorBorder }}>
                <div className={styles.infoTitle}>Thông tin nhanh</div>
                <div className={styles.infoRow}>
                  <span>Từ vựng</span>
                  <strong style={{ color: level.color }}>{level.vocab.toLocaleString()}</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>Số câu hỏi</span>
                  <strong style={{ color: level.color }}>{level.totalQuestions}</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>Thời gian</span>
                  <strong style={{ color: level.color }}>{level.duration} phút</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>Điểm đạt</span>
                  <strong style={{ color: level.color }}>60/100</strong>
                </div>
              </div>
            </aside>

            {/* Main: exam list */}
            <main className={styles.main}>
              <div className={styles.mainHeader}>
                <h2 className={styles.mainTitle}>
                  Danh sách đề thi{' '}
                  <span style={{ color: level.color }}>{level.label}</span>
                </h2>
                <p className={styles.mainDesc}>
                  {loading
                    ? 'Đang tải...'
                    : `${exams.length} đề thi${
                        totalPages > 1 ? ` · Trang ${currentPage}/${totalPages}` : ''
                      } · Lọc và sắp xếp theo nhu cầu của bạn.`}
                </p>
              </div>

              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Đang tải danh sách đề thi...</div>
              ) : exams.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Chưa có đề thi nào cho cấp độ này.</div>
              ) : (
                <ExamList exams={paginatedExams} levelColor={level.color} />
              )}

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className={styles.pagination} style={{ '--active-color': level.color }}>
                  <button
                    className={styles.pageBtn}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Trang trước"
                  >
                    ← Trước
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      className={`${styles.pageBtn} ${currentPage === p ? styles.pageBtnActive : ''}`}
                      onClick={() => handlePageChange(p)}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    className={styles.pageBtn}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Trang sau"
                  >
                    Sau →
                  </button>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
