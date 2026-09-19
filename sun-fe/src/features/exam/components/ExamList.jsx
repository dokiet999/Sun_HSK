import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { difficultyOptions, typeOptions } from '../../../data/examData'
import ExamCard from './ExamCard'
import styles from './ExamList.module.css'

export default function ExamList({ exams }) {
  const navigate = useNavigate()
  const [difficulty, setDifficulty] = useState('Tất cả')
  const [type, setType]             = useState('Tất cả')
  const [sort, setSort]             = useState('popular') // popular | newest

  const filtered = useMemo(() => {
    let list = [...exams]
    if (difficulty !== 'Tất cả') list = list.filter((e) => e.difficulty === difficulty)
    if (type !== 'Tất cả')       list = list.filter((e) => e.type === type)
    if (sort === 'popular') list.sort((a, b) => (b.attempts || 0) - (a.attempts || 0))
    if (sort === 'newest')  list.sort((a, b) => (b.year || 0) - (a.year || 0))
    return list
  }, [exams, difficulty, type, sort])

  function handleStart(exam) {
    navigate(`/hsk-tests/preview/${exam.id}`)
  }

  return (
    <div className={styles.wrapper}>
      {/* Filter bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Độ khó:</span>
          <div className={styles.pills}>
            {difficultyOptions.map((d) => (
              <button
                key={d}
                className={`${styles.pill} ${difficulty === d ? styles.pillActive : ''}`}
                onClick={() => setDifficulty(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Loại:</span>
          <select
            className={styles.select}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {typeOptions.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div className={styles.sortGroup}>
          <span className={styles.filterLabel}>Sắp xếp:</span>
          <select
            className={styles.select}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="popular">Phổ biến nhất</option>
            <option value="newest">Mới nhất</option>
          </select>
        </div>

        <span className={styles.count}>{filtered.length} đề thi</span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📭</div>
          <p>Không tìm thấy đề thi phù hợp. Thử thay đổi bộ lọc.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onStart={handleStart}
            />
          ))}
        </div>
      )}
    </div>
  )
}
