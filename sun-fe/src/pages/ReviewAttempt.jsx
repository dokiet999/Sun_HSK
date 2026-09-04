/**
 * ReviewAttempt.jsx
 * Trang xem lại chi tiết một lần làm bài từ lịch sử.
 * Route: /history/:attemptId/result
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { examService } from '../services/examService'
import styles from './TakeExam.module.css'   // tái dụng CSS review đã làm

function formatTime(secs) {
  if (!secs) return '—'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function ReviewAttempt() {
  const { attemptId } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadResult()
  }, [attemptId])

  async function loadResult() {
    try {
      setLoading(true)
      const data = await examService.getResult(attemptId)
      setResult(data.result)
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải kết quả bài thi.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
        Đang tải kết quả...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#dc2626' }}>
        ⚠️ {error}
        <br />
        <button
          style={{ marginTop: 16, padding: '10px 20px', background: '#2563eb', color: '#fff', border: 0, borderRadius: 10, cursor: 'pointer' }}
          onClick={() => navigate('/history')}
        >
          ← Quay lại lịch sử
        </button>
      </div>
    )
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.left}>
          <button className={styles.close} onClick={() => navigate('/history')} aria-label="Quay lại">←</button>
          <div className={styles.logo}>Sun<span>HSK</span></div>
          <div className={styles.divider} />
          <div className={styles.title}>
            <strong>Xem lại bài thi</strong>
            <span>{result.examTitle}</span>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Score card */}
        <div className={styles.resultCard}>
          <h2 className={styles.resultTitle}>{result.examTitle}</h2>
          <div className={styles.scoreCircle}>
            <span className={styles.scoreText}>{result.totalScore} / {result.totalPoints}</span>
            <span className={styles.scorePercent}>({result.scorePercent}%)</span>
          </div>

          <div className={styles.resultStatus}>
            {result.passed
              ? <span className={styles.passed}>🎉 ĐẠT</span>
              : <span className={styles.failed}>❌ CHƯA ĐẠT</span>
            }
          </div>

          <div className={styles.resultDetails}>
            <div className={styles.resultRow}>
              <span>Điểm Nghe:</span>
              <strong>{result.listeningScore}</strong>
            </div>
            <div className={styles.resultRow}>
              <span>Điểm Đọc:</span>
              <strong>{result.readingScore}</strong>
            </div>
            <div className={styles.resultRow}>
              <span>Điểm Viết:</span>
              <strong>{result.writingScore}</strong>
            </div>
            <div className={styles.resultRow}>
              <span>Thời gian làm bài:</span>
              <strong>{formatTime(result.timeSpentSecs)}</strong>
            </div>
            <div className={styles.resultRow}>
              <span>Ngày nộp:</span>
              <strong>{result.submittedAt ? new Date(result.submittedAt).toLocaleString('vi-VN') : '—'}</strong>
            </div>
          </div>

          <div className={styles.resultActions}>
            <button className={`${styles.btnPrimaryLg} ${styles.btnOutline}`} onClick={() => navigate('/history')}>
              ← Lịch sử làm bài
            </button>
          </div>
        </div>

        {/* Review chi tiết từng câu */}
        {result.answers && result.answers.length > 0 && (
          <div className={styles.reviewWrapper}>
            <h2 className={styles.reviewHeading}>
              📋 Xem lại bài làm chi tiết
              <span className={styles.reviewSummary}>
                {result.answers.filter(a => a.isCorrect === true).length} đúng &nbsp;·&nbsp;
                {result.answers.filter(a => a.isCorrect === false).length} sai &nbsp;·&nbsp;
                {result.answers.filter(a => a.isCorrect === null || a.isCorrect === undefined).length} chờ chấm
              </span>
            </h2>

            {result.answers.map((ans, idx) => {
              const isCorrect = ans.isCorrect
              const isWriting = isCorrect === null || isCorrect === undefined

              return (
                <div
                  key={ans.questionId}
                  id={`review-q-${idx + 1}`}
                  className={`${styles.reviewCard} ${
                    isWriting ? styles.reviewNeutral : isCorrect ? styles.reviewCorrect : styles.reviewWrong
                  }`}
                >
                  {/* Header */}
                  <div className={styles.reviewHeader}>
                    <div className={styles.reviewQno}>
                      <span className={styles.reviewIcon}>
                        {isWriting ? '✏️' : isCorrect ? '✅' : '❌'}
                      </span>
                      <strong>Câu {idx + 1}</strong>
                      <span className={styles.reviewQtype}>{ans.questionType}</span>
                    </div>
                    <div className={`${styles.reviewPoints} ${isWriting ? '' : isCorrect ? styles.reviewPointsGreen : styles.reviewPointsRed}`}>
                      {ans.pointsEarned} / {ans.totalPoints} điểm
                    </div>
                  </div>

                  {/* Nội dung câu hỏi */}
                  <div className={styles.reviewContent}>{ans.questionContent}</div>

                  {/* MCQ Options */}
                  {ans.options && ans.options.length > 0 ? (
                    <div className={styles.reviewOptions}>
                      {ans.options.map((opt, optIdx) => {
                        const label = ['A', 'B', 'C', 'D', 'E'][optIdx] || '*'
                        const userChose = opt.id === ans.selectedOptionId
                        const isOptCorrect = opt.isCorrect

                        let cls = styles.reviewOpt
                        if (isOptCorrect && userChose) cls += ' ' + styles.reviewOptCorrectChosen
                        else if (isOptCorrect)          cls += ' ' + styles.reviewOptCorrect
                        else if (userChose)             cls += ' ' + styles.reviewOptWrong

                        return (
                          <div key={opt.id} className={cls}>
                            <span className={styles.reviewOptLabel}>{label}</span>
                            <span className={styles.reviewOptContent}>{opt.content}</span>
                            {isOptCorrect && !userChose && (
                              <span className={`${styles.reviewTag} ${styles.reviewTagCorrect}`}>Đáp án đúng</span>
                            )}
                            {userChose && isOptCorrect && (
                              <span className={`${styles.reviewTag} ${styles.reviewTagCorrect}`}>Bạn chọn đúng ✓</span>
                            )}
                            {userChose && !isOptCorrect && (
                              <span className={`${styles.reviewTag} ${styles.reviewTagWrong}`}>Bạn chọn ✗</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    /* Fill blank / Writing */
                    <div className={styles.reviewFillBlank}>
                      <div className={styles.reviewFillRow}>
                        <span className={styles.reviewFillLabel}>Bạn trả lời:</span>
                        <span className={`${styles.reviewFillValue} ${isWriting ? '' : isCorrect ? styles.reviewFillGreen : styles.reviewFillRed}`}>
                          {ans.textAnswer || ans.selectedOptionContent || '(để trống)'}
                        </span>
                      </div>
                      {!isWriting && (
                        <div className={styles.reviewFillRow}>
                          <span className={styles.reviewFillLabel}>Đáp án đúng:</span>
                          <span className={`${styles.reviewFillValue} ${styles.reviewFillGreen}`}>
                            {ans.correctAnswer || ans.correctOptionContent || '—'}
                          </span>
                        </div>
                      )}
                      {isWriting && (
                        <div className={styles.reviewWritingNote}>
                          ⏳ Câu viết sẽ được chấm riêng bởi giáo viên
                        </div>
                      )}
                    </div>
                  )}

                  {/* Giải thích */}
                  {ans.explanation && (
                    <div className={styles.reviewExplanation}>
                      <span className={styles.reviewExplIcon}>💡</span>
                      <div>
                        <strong>Giải thích:</strong>
                        <p>{ans.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            <div className={styles.reviewBottom}>
              <button className={styles.btnPrimaryLg} onClick={() => navigate('/history')}>
                ← Quay lại lịch sử làm bài
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
