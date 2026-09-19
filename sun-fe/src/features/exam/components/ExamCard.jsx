import { useNavigate } from 'react-router-dom'
import styles from './ExamCard.module.css'

const difficultyMeta = {
  'Dễ':        { color: '#22c55e', bg: '#f0fdf4', label: 'Dễ' },
  'Trung bình': { color: '#f59e0b', bg: '#fffbeb', label: 'TB' },
  'Khó':        { color: '#ef4444', bg: '#fef2f2', label: 'Khó' },
}

export default function ExamCard({ exam, onStart }) {
  const navigate = useNavigate()
  const diff = difficultyMeta[exam.difficulty] || difficultyMeta['Trung bình']
  const hasAttempt = exam.bestScorePercent !== null && exam.bestScorePercent !== undefined

  const handleStartClick = () => {
    if (onStart) {
      onStart(exam)
    } else {
      navigate(`/hsk-tests/preview/${exam.id}`)
    }
  }

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
        <span className={styles.type}>{exam.examType || exam.type || 'MOCK'} · {exam.createdAt ? new Date(exam.createdAt).getFullYear() : '2026'}</span>
      </div>

      {/* Tags */}
      {(exam.tags && exam.tags.length > 0) && (
        <div className={styles.tags}>
          {exam.tags.map((t) => (
            <span key={t} className={styles.tag}>
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className={styles.stats}>
        <span className={styles.stat}>
          <span className={styles.statIcon}>📝</span>
          {exam.totalQuestions ?? exam.questions ?? '—'} câu
        </span>
        <span className={styles.stat}>
          <span className={styles.statIcon}>⏱</span>
          {exam.timeLimit ?? exam.duration ?? '—'} phút
        </span>
        <span className={styles.stat}>
          <span className={styles.statIcon}>👤</span>
          {(exam.attempts || 0).toLocaleString()} lượt
        </span>
      </div>

      {/* Action */}
      <div className={styles.footer}>
        <button
          className={styles.startBtn}
          onClick={handleStartClick}
        >
          Làm bài →
        </button>
        <button
          className={`${styles.historyBtn} ${!hasAttempt ? styles.historyBtnDisabled : ''}`}
          disabled={!hasAttempt}
          title={hasAttempt ? `Điểm cao nhất: ${exam.bestScorePercent}%` : 'Bạn chưa làm bài thi này'}
          onClick={() => hasAttempt && navigate(`/history?examId=${exam.id}`)}
        >
          📚 Lịch sử
          {hasAttempt && (
            <span className={styles.historyScore}>{Number(exam.bestScorePercent).toFixed(0)}%</span>
          )}
        </button>
      </div>
    </article>
  )
}
