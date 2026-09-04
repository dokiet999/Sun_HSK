import { useNavigate, useLocation } from 'react-router-dom'
import styles from './UnderDevelopment.module.css'

export default function UnderDevelopment({ featureName }) {
  const navigate = useNavigate()
  const location = useLocation()

  const name = featureName || location.state?.featureName

  return (
    <div className={styles.container}>
      <div className={styles.iconWrap}>🚧</div>
      <h1 className={styles.title}>
        {name ? `${name} đang phát triển` : 'Tính năng chưa phát triển'}
      </h1>
      <p className={styles.message}>
        Tính năng này đang trong quá trình xây dựng và hoàn thiện. Vui lòng quay lại sau!
      </p>
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
