import { Link } from 'react-router-dom'
import styles from './FeatureCard.module.css'

export default function FeatureCard({ icon, title, description }) {
  const isTest = title.includes('HSK Online Test') || title.includes('Test')
  const content = (
    <article className={styles.card}>
      <div className={styles.icon} aria-hidden="true">{icon}</div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.desc}>{description}</p>
    </article>
  )

  if (isTest) {
    return (
      <Link to="/hsk-tests" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        {content}
      </Link>
    )
  }

  return content
}
