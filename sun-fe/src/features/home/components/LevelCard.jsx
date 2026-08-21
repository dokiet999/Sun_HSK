import styles from './LevelCard.module.css'

export default function LevelCard({ level, label, description }) {
  return (
    <article className={styles.card}>
      <div className={styles.hsk}>{level}</div>
      <strong className={styles.label}>{label}</strong>
      <span className={styles.desc}>{description}</span>
    </article>
  )
}
