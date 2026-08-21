import { heroScores } from '../../../data/homeData'
import styles from './HeroDashboard.module.css'

export default function HeroDashboard() {
  return (
    <div className={styles.card}>
      {/* Decorative blobs */}
      <span className={styles.blob1} aria-hidden="true" />
      <span className={styles.blob2} aria-hidden="true" />

      <div className={styles.dashboard}>
        <div className={styles.top}>
          <div>
            <div className={styles.miniLabel}>TRÌNH ĐỘ HIỆN TẠI</div>
            <div className={styles.level}>HSK 4</div>
          </div>
          <div className={styles.hanzi} aria-hidden="true">中</div>
        </div>

        <div className={styles.miniLabel}>Tiến độ cấp độ</div>
        <div className={styles.progressBar}>
          <span className={styles.progressFill} style={{ width: '72%' }} />
        </div>

        <div className={styles.scoreGrid}>
          {heroScores.map((s) => (
            <div key={s.label} className={styles.score}>
              <strong>{s.value}</strong>
              <small>{s.label}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
