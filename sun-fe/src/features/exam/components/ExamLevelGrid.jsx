import { useNavigate } from 'react-router-dom'
import { hskLevels } from '../../../data/examData'
import styles from './ExamLevelGrid.module.css'

export default function ExamLevelGrid() {
  const navigate = useNavigate()

  return (
    <div className={styles.grid}>
      {hskLevels.map((level) => (
        <button
          key={level.id}
          className={styles.card}
          style={{
            '--level-color': level.color,
            '--level-light': level.colorLight,
            '--level-border': level.colorBorder,
          }}
          onClick={() => navigate(`/hsk-tests/${level.id}`)}
          aria-label={`Xem đề thi ${level.label}`}
        >
          {/* Badge */}
          <div className={styles.badge}>{level.label}</div>

          {/* Info */}
          <div className={styles.sublabel}>{level.sublabel}</div>
          <p className={styles.desc}>{level.description}</p>

          {/* Stats row */}
          <div className={styles.stats}>
            <span className={styles.stat}>
              <b>{level.vocab.toLocaleString()}</b> từ vựng
            </span>
            <span className={styles.stat}>
              <b>{level.examCount}</b> đề thi
            </span>
          </div>

          {/* Footer */}
          <div className={styles.cardFooter}>
            <div className={styles.sections}>
              {level.sections.map((s) => (
                <span key={s} className={styles.sectionTag}>{s}</span>
              ))}
            </div>
            <span className={styles.cta}>Xem đề →</span>
          </div>
        </button>
      ))}
    </div>
  )
}
