import { navLinks } from '../data/homeData'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div>
          <div className={styles.brand}>☀ Sun HSK</div>
          <p className={styles.desc}>
            Nền tảng học tiếng Trung và luyện thi HSK trực tuyến.
          </p>
        </div>
        <div className={styles.links}>
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className={styles.link}>
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
