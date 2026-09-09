import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import styles from './AdminLayout.module.css'

const navItems = [
  { to: '/admin',           label: 'Dashboard',       icon: '📊', end: true },
  { to: '/admin/analytics', label: 'Phân tích',       icon: '📈' },
  { to: '/admin/exams',     label: 'Quản lý đề thi',  icon: '📝' },
  { to: '/admin/users',     label: 'Người dùng',      icon: '👥' },
  { to: '/admin/settings',  label: 'Cài đặt',         icon: '⚙️' },
]

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()

  return (
    <div className={`${styles.shell} ${collapsed ? styles.collapsed : ''}`}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        {/* Logo */}
        <div className={styles.logo}>
          <Link to="/admin" className={styles.logoLink}>
            <span className={styles.logoMark}>☀</span>
            {!collapsed && <span className={styles.logoText}>Sun HSK</span>}
          </Link>
          <button
            className={styles.collapseBtn}
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Thu gọn menu"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Section label */}
        {!collapsed && <div className={styles.sectionLabel}>Điều hướng</div>}

        {/* Nav */}
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              aria-label={item.label}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
            >
              <span className={styles.navIcon} aria-hidden="true">{item.icon}</span>
              {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Back to site */}
        <div className={styles.sidebarFooter}>
          <button
            className={styles.backBtn}
            onClick={() => navigate('/')}
            aria-label="Về trang chủ"
          >
            <span aria-hidden="true">🏠</span>
            {!collapsed && <span>Về trang chủ</span>}
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className={styles.main}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <div className={styles.topbarTitle}>Quản trị</div>
          </div>
          <div className={styles.topbarRight}>
            <div className={styles.liveTag}>
              <span className={styles.liveDot} />
              Live
            </div>
            <div className={styles.adminAvatar}>
              <span>A</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
