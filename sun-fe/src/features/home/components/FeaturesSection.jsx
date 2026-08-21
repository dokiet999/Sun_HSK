import { features } from '../../../data/homeData'
import FeatureCard from './FeatureCard'
import styles from './FeaturesSection.module.css'

export default function FeaturesSection() {
  return (
    <section className={styles.section} id="vocab">
      <div className="container">
        <div className={styles.head}>
          <div className={styles.kicker}>Tự học HSK có gì?</div>
          <h2>Một nơi cho toàn bộ hành trình học tiếng Trung</h2>
          <p>
            Từ học từ mới đến mô phỏng phòng thi, mọi nội dung được chia nhỏ
            để bạn học nhanh và dễ theo dõi.
          </p>
        </div>
        <div className={styles.grid}>
          {features.map((f) => (
            <FeatureCard key={f.id} icon={f.icon} title={f.title} description={f.description} />
          ))}
        </div>
      </div>
    </section>
  )
}
