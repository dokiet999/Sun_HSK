import styles from './PromoBanner.module.css'

export default function PromoBanner() {
  return (
    <div className={styles.promo}>
      <div className={`container ${styles.inner}`}>
        <span className={styles.pill}>HSK 1 → 6</span>
        <span>
          Ôn HSK theo lộ trình cá nhân hóa — học từ vựng, ngữ pháp và luyện
          đề trên một nền tảng.
        </span>
      </div>
    </div>
  )
}
