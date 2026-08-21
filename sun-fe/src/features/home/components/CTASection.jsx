import { Link } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import styles from './CTASection.module.css'

export default function CTASection() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.box}>
          <div>
            <h2 className={styles.heading}>Sẵn sàng chinh phục HSK?</h2>
            <p className={styles.desc}>
              Tạo tài khoản và bắt đầu buổi học đầu tiên ngay hôm nay.
            </p>
          </div>
          <Link to="/signup">
            <Button variant="outline">Đăng ký miễn phí ngay →</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
