import { trafficSources, topPages, recentActivity } from '../../../data/adminData'
import styles from './DashboardWidgets.module.css'

/* Traffic sources donut-style */
export function TrafficSources() {
  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>Nguồn truy cập</div>
      <div className={styles.sourceList}>
        {trafficSources.map((s) => (
          <div key={s.name} className={styles.sourceRow}>
            <div className={styles.sourceInfo}>
              <span className={styles.sourceDot} style={{ background: s.color }} />
              <span className={styles.sourceName}>{s.name}</span>
            </div>
            <div className={styles.sourceBarWrap}>
              <div className={styles.sourceBar}
                style={{ width: `${s.value}%`, background: s.color + 'bb' }} />
            </div>
            <span className={styles.sourcePct}>{s.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* Top pages table */
export function TopPages() {
  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>Trang xem nhiều nhất</div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Trang</th>
              <th>Lượt xem</th>
              <th>Thay đổi</th>
            </tr>
          </thead>
          <tbody>
            {topPages.map((p, i) => {
              const isUp = p.change.startsWith('+')
              return (
                <tr key={p.path}>
                  <td>
                    <span className={styles.pageRank}>{i + 1}</span>
                    {p.label}
                  </td>
                  <td className={styles.views}>{p.views.toLocaleString()}</td>
                  <td className={isUp ? styles.up : styles.down}>{p.change}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* Recent activity feed */
export function RecentActivity() {
  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>Hoạt động gần đây</div>
      <div className={styles.feed}>
        {recentActivity.map((a) => (
          <div key={a.id} className={styles.feedItem}>
            <div className={styles.feedIcon}>{a.icon}</div>
            <div className={styles.feedContent}>
              <div className={styles.feedMsg}>{a.msg}</div>
              <div className={styles.feedTime}>{a.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
