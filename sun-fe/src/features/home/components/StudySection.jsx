import { studyCards } from '../../../data/homeData'
import StudyCard from './StudyCard'
import styles from './StudySection.module.css'

export default function StudySection() {
  return (
    <section className={styles.section} id="study">
      <div className="container">
        <div className={styles.head}>
          <div className={styles.kicker}>Phương pháp học</div>
          <h2>Học → Luyện → Kiểm tra → Cải thiện</h2>
          <p>
            Thiết kế theo vòng lặp học tập: CTA rõ ràng, nội dung ngắn và ưu
            tiên trải nghiệm mobile.
          </p>
        </div>
        <div className={styles.grid}>
          {studyCards.map((c) => (
            <StudyCard
              key={c.id}
              variant={c.variant}
              title={c.title}
              description={c.description}
              items={c.items}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
