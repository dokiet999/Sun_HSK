import { useState, useEffect } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import PageContainer from '../layouts/PageContainer'
import { ExamHero, ExamList } from '../features/exam'
import { hskLevels } from '../data/examData'
import { examService } from '../services/examService'
import styles from './HskLevelExams.module.css'

export default function HskLevelExams() {
  const { level: levelParam } = useParams()
  const levelId = parseInt(levelParam, 10)

  const level = hskLevels.find((l) => l.id === levelId)
  
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchExams() {
      try {
        const data = await examService.listExams({ size: 100 })
        if (data && data.result && data.result.content) {
          // Filter exams by the current level
          const filtered = data.result.content.filter(exam => exam.hskLevel === levelId)
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

  // Next / Prev level for quick navigation
  const prevLevel = hskLevels.find((l) => l.id === levelId - 1)
  const nextLevel = hskLevels.find((l) => l.id === levelId + 1)

  return (
    <PageContainer>
      {/* Level-colored hero */}
      <ExamHero level={level} />

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
                        <small>{l.sublabel} · {l.examCount} đề</small>
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
                  {loading ? 'Đang tải...' : `${exams.length} đề thi`} · Lọc và sắp xếp theo nhu cầu của bạn.
                </p>
              </div>

              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Đang tải danh sách đề thi...</div>
              ) : exams.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Chưa có đề thi nào cho cấp độ này.</div>
              ) : (
                <ExamList exams={exams} levelColor={level.color} />
              )}

              {/* Level navigation */}
              <div className={styles.levelNav2}>
                {prevLevel ? (
                  <Link to={`/hsk-tests/${prevLevel.id}`} className={styles.navBtn}>
                    ← {prevLevel.label}
                  </Link>
                ) : <span />}
                {nextLevel && (
                  <Link to={`/hsk-tests/${nextLevel.id}`} className={styles.navBtn} style={{ marginLeft: 'auto' }}>
                    {nextLevel.label} →
                  </Link>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
