import { levels } from '../../../data/homeData'
import LevelCard from './LevelCard'
import styles from './LevelsSection.module.css'

export default function LevelsSection() {
  return (
    <section className={styles.section} id="levels">
      <div className="container">
        <div className={styles.head}>
          <div className={styles.kicker}>Lộ trình</div>
          <h2>Chọn cấp độ HSK của bạn</h2>
          <p>
            Bắt đầu từ trình độ hiện tại và học từng bước thay vì cố gắng học
            tất cả cùng lúc.
          </p>
        </div>
        <div className={styles.grid}>
          {levels.map((l) => (
            <LevelCard key={l.level} level={l.level} label={l.label} description={l.description} />
          ))}
        </div>
      </div>
    </section>
  )
}
