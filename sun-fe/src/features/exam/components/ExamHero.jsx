import { Link } from 'react-router-dom'
import styles from './ExamHero.module.css'

export default function ExamHero({ level, examCount }) {
  return (
    <div className={styles.hero}>
      <div className={styles.inner}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/" className={styles.breadLink}>Trang chủ</Link>
          <span className={styles.sep}>›</span>
          <Link to="/hsk-tests" className={styles.breadLink}>Đề thi HSK</Link>
          <span className={styles.sep}>›</span>
          <span className={styles.breadCurrent}>{level.label}</span>
        </nav>

        {/* Main content centered */}
        <div className={styles.content}>
          <div className={styles.badge}>{level.label}</div>
          <h1 className={styles.heading}>
            Đề thi {level.label} — {level.sublabel}
          </h1>
          <p className={styles.desc}>{level.description}</p>

          {/* Centered structure & passing score bar */}
          <div className={styles.structureCard}>
            <span className={styles.structureLabel}>Cấu trúc đề thi:</span>
            <div className={styles.sectionsList}>
              {level.sections.map((s, i) => (
                <div key={s} className={styles.sectionRow}>
                  <span className={styles.sectionNum}>{i + 1}</span>
                  <span className={styles.sectionName}>{s}</span>
                </div>
              ))}
            </div>
            <span className={styles.divider}>•</span>
            <div className={styles.passNote}>
              Điểm đạt: <strong>60/100</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
