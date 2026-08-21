import styles from './FeatureCard.module.css'

export default function FeatureCard({ icon, title, description }) {
  return (
    <article className={styles.card}>
      <div className={styles.icon} aria-hidden="true">{icon}</div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.desc}>{description}</p>
    </article>
  )
}
