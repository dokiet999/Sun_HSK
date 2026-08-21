import { useParams, Navigate, Link } from 'react-router-dom'
import PageContainer from '../layouts/PageContainer'
import { ExamHero, ExamList } from '../features/exam'
import { hskLevels, examsByLevel } from '../data/examData'
import styles from './HskLevelExams.module.css'

export default function HskLevelExams() {
  const { level: levelParam } = useParams()
  const levelId = parseInt(levelParam, 10)

  const level = hskLevels.find((l) => l.id === levelId)
  if (!level) return <Navigate to="/hsk-tests" replace />

  const exams = examsByLevel[levelId] ?? []

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
                  {exams.length} đề thi · Lọc và sắp xếp theo nhu cầu của bạn.
                </p>
              </div>

              <ExamList exams={exams} levelColor={level.color} />

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
