import { Link } from 'react-router-dom'
import styles from './ExamHero.module.css'

export default function ExamHero({ level }) {
  return (
    <div
      className={styles.hero}
      style={{
        '--level-color': level.color,
        '--level-light': level.colorLight,
        '--level-border': level.colorBorder,
      }}
    >
      <div className={styles.inner}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/" className={styles.breadLink}>Trang chủ</Link>
          <span className={styles.sep}>›</span>
          <Link to="/hsk-tests" className={styles.breadLink}>Đề thi HSK</Link>
          <span className={styles.sep}>›</span>
          <span className={styles.breadCurrent}>{level.label}</span>
        </nav>

        {/* Main content */}
        <div className={styles.content}>
          <div className={styles.left}>
            <div className={styles.badge}>{level.label}</div>
            <h1 className={styles.heading}>
              Đề thi {level.label} — {level.sublabel}
            </h1>
            <p className={styles.desc}>{level.description}</p>

            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <span className={styles.metaIcon}>📚</span>
                <div>
                  <strong>{level.vocab.toLocaleString()}</strong>
                  <span>từ vựng</span>
                </div>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaIcon}>📝</span>
                <div>
                  <strong>{level.totalQuestions}</strong>
                  <span>câu hỏi/đề</span>
                </div>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaIcon}>⏱</span>
                <div>
                  <strong>{level.duration}</strong>
                  <span>phút</span>
                </div>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaIcon}>📋</span>
                <div>
                  <strong>{level.examCount}</strong>
                  <span>đề thi</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: section chips */}
          <div className={styles.right}>
            <div className={styles.sectionsCard}>
              <div className={styles.sectionsTitle}>Cấu trúc đề thi</div>
              {level.sections.map((s, i) => (
                <div key={s} className={styles.sectionRow}>
                  <span className={styles.sectionNum}>{i + 1}</span>
                  <span className={styles.sectionName}>{s}</span>
                </div>
              ))}
              <div className={styles.levelNote}>
                Đạt tối thiểu <strong>60/100</strong> điểm để vượt qua.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
