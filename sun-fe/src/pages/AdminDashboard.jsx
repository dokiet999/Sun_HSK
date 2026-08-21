import AdminLayout from '../layouts/AdminLayout'
import StatCard from '../features/admin/components/StatCard'
import VisitorChart from '../features/admin/components/VisitorChart'
import { TrafficSources, TopPages, RecentActivity } from '../features/admin/components/DashboardWidgets'
import { dashStats } from '../data/adminData'
import styles from './AdminDashboard.module.css'

export default function AdminDashboard() {
  const now = new Date().toLocaleString('vi-VN', { dateStyle: 'full', timeStyle: 'short' })

  return (
    <AdminLayout>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageDesc}>{now}</p>
        </div>
        <button className={styles.refreshBtn}>↻ Làm mới</button>
      </div>

      {/* Stats grid */}
      <div className={styles.statsGrid}>
        {dashStats.map((s) => (
          <StatCard key={s.id} {...s} />
        ))}
      </div>

      {/* Visitor chart — full width */}
      <VisitorChart />

      {/* Bottom 3-column widgets */}
      <div className={styles.bottomGrid}>
        <TrafficSources />
        <TopPages />
        <RecentActivity />
      </div>
    </AdminLayout>
  )
}
