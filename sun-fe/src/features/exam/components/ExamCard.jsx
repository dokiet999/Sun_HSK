import styles from './ExamCard.module.css'

const difficultyMeta = {
  'Dễ':        { color: '#22c55e', bg: '#f0fdf4', label: 'Dễ' },
  'Trung bình': { color: '#f59e0b', bg: '#fffbeb', label: 'TB' },
  'Khó':        { color: '#ef4444', bg: '#fef2f2', label: 'Khó' },
}

export default function ExamCard({ exam, levelColor, onStart }) {
  const diff = difficultyMeta[exam.difficulty] || difficultyMeta['Trung bình']

  return (
    <article className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{exam.title}</h3>
          <span
            className={styles.diffBadge}
            style={{ color: diff.color, background: diff.bg }}
          >
            {diff.label}
          </span>
        </div>
        <span className={styles.type}>{exam.type} · {exam.year}</span>
      </div>

      {/* Tags */}
      {exam.tags.length > 0 && (
        <div className={styles.tags}>
          {exam.tags.map((t) => (
            <span key={t} className={styles.tag}
              style={{ color: levelColor, borderColor: levelColor + '40', background: levelColor + '0d' }}>
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className={styles.stats}>
        <span className={styles.stat}>
          <span className={styles.statIcon}>📝</span>
          {exam.questions ?? '—'} câu
        </span>
        <span className={styles.stat}>
          <span className={styles.statIcon}>⏱</span>
          {exam.duration ?? '—'} phút
        </span>
        <span className={styles.stat}>
          <span className={styles.statIcon}>👤</span>
          {exam.attempts.toLocaleString()} lượt làm
        </span>
        <span className={styles.stat}>
          <span className={styles.statIcon}>⭐</span>
          {exam.rating}
        </span>
      </div>

      {/* Action */}
      <div className={styles.footer}>
        <button
          className={styles.startBtn}
          style={{ background: levelColor }}
          onClick={() => onStart?.(exam)}
        >
          Làm bài →
        </button>
        <button className={styles.previewBtn}>Xem trước</button>
      </div>
    </article>
  )
}
