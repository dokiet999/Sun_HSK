import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import { navLinks } from '../data/homeData'
import styles from './Navbar.module.css'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <header className={styles.header}>
      <div className={`container ${styles.nav}`}>
        {/* Brand */}
        <Link to="/" className={styles.brand}>
          <span className={styles.brandMark}>汉</span>
          <span>Sun HSK</span>
        </Link>

        {/* Desktop nav */}
        <nav className={`${styles.navLinks} ${menuOpen ? styles.navOpen : ''}`}>
          {navLinks.map((link) =>
            link.href.startsWith('/') ? (
              <Link
                key={link.href}
                to={link.href}
                className={styles.navLink}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className={styles.navLink}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            )
          )}
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.iconBtn}
            aria-label="Mở menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
          <button className={styles.iconBtn} aria-label="Tìm kiếm">⌕</button>
          <Button variant="outline" onClick={() => navigate('/login')}>
            Đăng nhập
          </Button>
          <Button variant="primary" onClick={() => navigate('/signup')}>
            Đăng ký
          </Button>
        </div>
      </div>
    </header>
  )
}
