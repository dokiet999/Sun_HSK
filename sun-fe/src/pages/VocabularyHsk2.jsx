import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import PageContainer from '../layouts/PageContainer'
import { vocabularyService } from '../services/vocabularyService'
import styles from './VocabularyHsk2.module.css'

const HSK2_LEVELS = [
  { id: 1, label: 'HSK 1', count: '150 từ' },
  { id: 2, label: 'HSK 2', count: '300 từ' },
  { id: 3, label: 'HSK 3', count: '600 từ' },
  { id: 4, label: 'HSK 4', count: '1.200 từ' },
  { id: 5, label: 'HSK 5', count: '2.500 từ' },
  { id: 6, label: 'HSK 6', count: '5.000 từ' },
]

export default function VocabularyHsk2() {
  const { level: levelParam } = useParams()
  const navigate = useNavigate()

  const currentLevelId = parseInt(levelParam || '1', 10) || 1
  const [lessonData, setLessonData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    async function fetchLessons() {
      try {
        setLoading(true)
        setError(null)
        const res = await vocabularyService.getLessonOverview(currentLevelId, 12, 'HSK_2')
        if (isMounted) {
          if (res?.result) {
            setLessonData(res.result)
          } else {
            setLessonData(null)
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách bài học HSK 2.0:', err)
        if (isMounted) setError('Không thể tải danh sách bài học.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchLessons()
    return () => {
      isMounted = false
    }
  }, [currentLevelId])

  const lessons = lessonData?.lessons || []
  const totalWords = lessonData?.totalWords ?? 0
  const learnedWords = lessons.reduce((acc, l) => acc + (l.learnedWords || 0), 0)
  const progressPercent = totalWords > 0 ? Math.round((learnedWords / totalWords) * 100) : 0

  return (
    <PageContainer>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.headerSection}>
          <span className={styles.badge}>HSK 2.0 • Giáo trình tiêu chuẩn</span>
          <h1 className={styles.title}>Từ vựng HSK 2.0 (Tiêu chuẩn 6 cấp)</h1>
          <p className={styles.description}>
            Hệ thống từ vựng 6 cấp độ kinh điển theo khung khảo thí HSK Hanban tiêu chuẩn (150 – 5.000 từ). Chia nhỏ theo từng bài học 10–12 từ vựng, hỗ trợ lật Flashcard và luyện bài tập tức thì.
          </p>
        </div>

        {/* Level Selector Tabs */}
        <div className={styles.levelTabs}>
          {HSK2_LEVELS.map((lvl) => {
            const isActive = lvl.id === currentLevelId
            return (
              <button
                key={lvl.id}
                type="button"
                className={`${styles.levelTabBtn} ${isActive ? styles.levelTabBtnActive : ''}`}
                onClick={() => navigate(`/vocabulary/hsk2/${lvl.id}`)}
              >
                {lvl.label} ({lvl.count})
              </button>
            )
          })}
        </div>

        {/* Lessons List */}
        {loading ? (
          <div className={styles.stateBox}>Đang tải danh sách bài học HSK {currentLevelId}...</div>
        ) : error ? (
          <div className={styles.stateBox}>
            <p>{error}</p>
            <button
              style={{
                marginTop: 10,
                padding: '6px 14px',
                background: '#0f172a',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
              }}
              onClick={() => window.location.reload()}
            >
              Thử lại
            </button>
          </div>
        ) : lessons.length > 0 ? (
          <div className={styles.lessonGrid}>
            {lessons.map((lesson) => {
              const percent =
                lesson.progressPercent ||
                (lesson.totalWords > 0
                  ? Math.round((lesson.learnedWords / lesson.totalWords) * 100)
                  : 0)

              return (
                <div key={lesson.lessonNumber} className={styles.lessonCard}>
                  <div>
                    <div className={styles.cardHead}>
                      <span className={styles.lessonNum}>Bài {lesson.lessonNumber}</span>
                      <span className={styles.lessonStatus}>
                        {lesson.isCompleted
                          ? 'Đã hoàn thành'
                          : percent > 0
                          ? `Đang học ${percent}%`
                          : 'Chưa học'}
                      </span>
                    </div>

                    <h3 className={styles.lessonTitle}>
                      {lesson.title || `Bài học ${lesson.lessonNumber}`}
                    </h3>

                    <div className={styles.lessonMeta}>
                      <span>{lesson.totalWords} từ vựng</span>
                      <span>
                        Đã thuộc: {lesson.learnedWords}/{lesson.totalWords}
                      </span>
                    </div>

                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${percent}%` }} />
                    </div>
                  </div>

                  <div className={styles.actionsRow}>
                    <Link
                      to={`/vocabulary/${currentLevelId}/lesson/${lesson.lessonNumber}`}
                      className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                    >
                      Học từ vựng
                    </Link>
                    <Link
                      to={`/vocabulary/${currentLevelId}/lesson/${lesson.lessonNumber}/flashcard`}
                      className={styles.actionBtn}
                    >
                      Flashcard
                    </Link>
                    <Link
                      to={`/vocabulary/${currentLevelId}/lesson/${lesson.lessonNumber}/exercise`}
                      className={styles.actionBtn}
                    >
                      Bài tập
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className={styles.stateBox}>
            Chưa có bài học nào cho cấp độ này.
          </div>
        )}
      </div>
    </PageContainer>
  )
}
