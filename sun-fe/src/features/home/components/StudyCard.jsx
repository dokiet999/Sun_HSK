import { Link } from 'react-router-dom'
import styles from './StudyCard.module.css'

export default function StudyCard({ variant = 'white', title, description, items }) {
  const isBlue = variant === 'blue'
  const isExam = title.includes('Luyện thi HSK')
  const isDaily = title.includes('Tự học mỗi ngày')
  
  const content = (
    <article className={`${styles.card} ${isBlue ? styles.blue : ''}`} style={isExam || isDaily ? { cursor: 'pointer' } : {}}>
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

  if (isExam) {
    return (
      <Link to="/hsk-tests" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        {content}
      </Link>
    )
  }

  if (isDaily) {
    return (
      <Link to="/vocabulary" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        {content}
      </Link>
    )
  }

  return content
}
