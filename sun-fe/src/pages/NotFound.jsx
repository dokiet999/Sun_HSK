import { useNavigate } from 'react-router-dom'
import styles from './NotFound.module.css'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className={styles.container}>
      <h1 className={styles.code}>404</h1>
      <p className={styles.message}>Trang bạn tìm kiếm không tồn tại.</p>
      <button
        type="button"
        className={styles.homeBtn}
        onClick={() => navigate('/')}
      >
        Quay lại trang chính
      </button>
    </div>
  )
}
