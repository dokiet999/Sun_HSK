import { Link } from 'react-router-dom'
import styles from './LevelCard.module.css'

export default function LevelCard({ level, label, description }) {
  const levelNum = level.replace(/[^0-9]/g, '') || '1'
  return (
    <Link to={`/hsk-tests/${levelNum}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <article className={styles.card}>
        <div className={styles.hsk}>{level}</div>
        <strong className={styles.label}>{label}</strong>
        <span className={styles.desc}>{description}</span>
      </article>
    </Link>
  )
}
