import styles from './StatCard.module.css'

export default function StatCard({ icon, label, value, change, up, color }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.iconWrap} style={{ background: color + '18', color }}>
          {icon}
        </div>
        <span className={`${styles.change} ${up ? styles.up : styles.down}`}>
          {up ? '▲' : '▼'} {change}
        </span>
      </div>
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>{label}</div>
      <div className={styles.bar}>
        <div className={styles.barFill} style={{ background: color, width: '65%' }} />
      </div>
    </div>
  )
}
