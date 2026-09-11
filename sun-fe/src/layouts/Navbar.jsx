import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import { navLinks } from '../data/homeData'
import { authService } from '../services/authService'
import styles from './Navbar.module.css'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const syncUser = () => {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (e) {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    }
    syncUser()
    window.addEventListener('storage', syncUser)
    return () => window.removeEventListener('storage', syncUser)
  }, [])

  const handleLogout = () => {
    authService.logout()
    setUser(null)
    navigate('/')
  }

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

          {user ? (
            <div className={styles.userMenu}>
              <div className={styles.avatarWrap}>
                <div className={styles.avatar}>
                  {(user.displayName || user.username || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <span className={styles.userName}>
                  {user.displayName || user.username || user.email?.split('@')[0]}
                </span>
              </div>
              <button className={styles.logoutBtn} onClick={handleLogout}>Đăng xuất</button>
            </div>
          ) : (
            <>
              <Button variant="outline" onClick={() => navigate('/login')}>
                Đăng nhập
              </Button>
              <Button variant="primary" onClick={() => navigate('/signup')}>
                Đăng ký
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
