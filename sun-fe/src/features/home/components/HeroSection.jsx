import { Link } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import FloatingBadge from './FloatingBadge'
import HeroDashboard from './HeroDashboard'
import styles from './HeroSection.module.css'

export default function HeroSection() {
  return (
    <section className={styles.hero} id="test">
      <div className={`container ${styles.grid}`}>
        {/* Left: text */}
        <div>
          <div className={styles.eyebrow}>
            🇨🇳 HỌC TIẾNG TRUNG • LUYỆN THI HSK
          </div>
          <h1 className={styles.heading}>
            Nền tảng tự học{' '}
            <span className={styles.highlight}>HSK Online</span>
            <br />
            thông minh &amp; dễ học
          </h1>
          <p className={styles.desc}>
            Luyện HSK từ cơ bản đến nâng cao với bài test mô phỏng, từ vựng
            theo cấp độ, luyện nghe — đọc — viết và hệ thống theo dõi tiến độ
            học tập.
          </p>
          <div className={styles.actions}>
            <Link to="/signup">
              <Button variant="primary">Bắt đầu học miễn phí →</Button>
            </Link>
            <a href="#levels">
              <Button variant="outline">Xem lộ trình HSK</Button>
            </a>
          </div>
          <div className={styles.note}>
            <span><b className={styles.check}>✓</b> HSK 1–6</span>
            <span><b className={styles.check}>✓</b> Kho câu hỏi luyện tập</span>
            <span><b className={styles.check}>✓</b> Theo dõi tiến độ</span>
          </div>
        </div>

        {/* Right: visual */}
        <div className={styles.visual} aria-label="Bảng tiến độ HSK">
          <FloatingBadge position="left">
            <span className={styles.hanzi}>你</span> Từ vựng hôm nay +20
          </FloatingBadge>
          <FloatingBadge position="right">
            🔥 Chuỗi học 12 ngày
          </FloatingBadge>
          <HeroDashboard />
        </div>
      </div>
    </section>
  )
}
