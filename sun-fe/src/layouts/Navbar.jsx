import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Button from '../components/ui/Button'
import { navLinks } from '../data/homeData'
import { authService } from '../services/authService'
import styles from './Navbar.module.css'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const navRef = useRef(null)

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

  // Close dropdowns on route change
  useEffect(() => {
    setMenuOpen(false)
    setOpenDropdown(null)
  }, [location.pathname])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const timeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleMouseEnter = (label) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpenDropdown(label)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null)
    }, 250)
  }

  const handleLogout = () => {
    authService.logout()
    setUser(null)
    navigate('/')
  }

  const toggleDropdown = (label) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpenDropdown((prev) => (prev === label ? null : label))
  }

  return (
    <header className={styles.header} ref={navRef}>
      <div className={`container ${styles.nav}`}>
        {/* Brand */}
        <Link to="/" className={styles.brand}>
          <span className={styles.brandMark}>汉</span>
          <span className={styles.brandText}>Sun HSK</span>
        </Link>

        {/* Desktop nav */}
        <nav className={`${styles.navLinks} ${menuOpen ? styles.navOpen : ''}`}>
          {navLinks.map((link) => {
            if (link.children && link.children.length > 0) {
              const isExpanded = openDropdown === link.label
              return (
                <div
                  key={link.label}
                  className={`${styles.dropdownWrap} ${isExpanded ? styles.dropdownActive : ''}`}
                  onMouseEnter={() => handleMouseEnter(link.label)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    type="button"
                    className={`${styles.navLink} ${styles.dropdownTrigger}`}
                    onClick={() => toggleDropdown(link.label)}
                    aria-expanded={isExpanded}
                  >
                    <span>{link.label}</span>
                    <svg
                      className={`${styles.chevron} ${isExpanded ? styles.chevronRotated : ''}`}
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  <div className={`${styles.dropdownMenu} ${isExpanded ? styles.dropdownMenuOpen : ''}`}>
                    {link.children.map((subItem) => (
                      <Link
                        key={subItem.href}
                        to={subItem.href}
                        className={styles.dropdownItem}
                        onClick={() => {
                          setOpenDropdown(null)
                          setMenuOpen(false)
                        }}
                      >
                        <div className={styles.dropdownItemContent}>
                          <span className={styles.itemTitle}>{subItem.label}</span>
                          {subItem.sublabel && (
                            <span className={styles.itemSubtitle}>{subItem.sublabel}</span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            }

            return link.href.startsWith('/') ? (
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
          })}
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
              <button className={styles.logoutBtn} onClick={handleLogout}>
                Đăng xuất
              </button>
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
