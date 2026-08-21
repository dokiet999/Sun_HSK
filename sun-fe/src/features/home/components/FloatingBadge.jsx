import styles from './FloatingBadge.module.css'

export default function FloatingBadge({ children, position = 'left' }) {
  return (
    <div className={`${styles.badge} ${styles[position]}`}>
      {children}
    </div>
  )
}
