import styles from './StudyCard.module.css'

export default function StudyCard({ variant = 'white', title, description, items }) {
  const isBlue = variant === 'blue'
  return (
    <article className={`${styles.card} ${isBlue ? styles.blue : ''}`}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.desc}>{description}</p>
      <ul className={styles.list}>
        {items.map((item, i) => (
          <li key={i} className={styles.item}>
            <b className={styles.check}>✓</b>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}
