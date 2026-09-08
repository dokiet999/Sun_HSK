import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { examService } from '../services/examService'
import styles from './TakeExam.module.css'

const HSK_DEFAULT_DURATION = {
  1: 40,
  2: 55,
  3: 90,
  4: 105,
  5: 125,
  6: 140,
}

// Chuyển chuỗi datetime từ server (UTC) sang millisecond an toàn
function parseServerDate(dateStr) {
  if (!dateStr) return null
  const hasTimezone = /Z|[+-]\d{2}(:\d{2})?$/.test(dateStr)
  const safeStr = hasTimezone ? dateStr : `${dateStr}Z`
  const time = new Date(safeStr).getTime()
  return isNaN(time) ? null : time
}

export default function TakeExam() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [exam, setExam] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [result, setResult] = useState(null)
  
  const [activeSectionIdx, setActiveSectionIdx] = useState(0)
  const [answers, setAnswers] = useState({}) // { questionId: optionId }
  const [showPalette, setShowPalette] = useState(false) // Toggle palette
  
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showExitDialog, setShowExitDialog] = useState(false)

  // Guard chống submit lặp (dùng ref để không trigger re-render)
  const isSubmitting = useRef(false)
  const startTimeRef = useRef(null)

  // Refs giữ state mới nhất tránh stale closure khi timer auto submit
  const answersRef = useRef(answers)
  answersRef.current = answers
  const examRef = useRef(exam)
  examRef.current = exam
  const attemptRef = useRef(attempt)
  attemptRef.current = attempt

  useEffect(() => {
    initExam()
  }, [id])

  async function initExam() {
    try {
      setLoading(true)
      // 1. Lấy cấu trúc đề
      const detailRes = await examService.getExamDetail(id)
      const examData = detailRes.result
      setExam(examData)
      
      // 2. Bắt đầu làm bài (Start attempt)
      const attemptRes = await examService.startAttempt(id)
      const attemptData = attemptRes.result
      setAttempt(attemptData)
      
      // Ghi nhận thời điểm client bắt đầu làm bài
      startTimeRef.current = Date.now()

      // 3. Khởi tạo timer: tính thời lượng (phút -> giây)
      const defaultDuration = HSK_DEFAULT_DURATION[examData?.hskLevel] || 40
      const rawLimit = attemptData?.timeLimitMinutes || examData?.timeLimit
      const durationMinutes = (rawLimit && rawLimit > 0) ? rawLimit : defaultDuration
      const totalSeconds = durationMinutes * 60

      let remaining = totalSeconds
      if (attemptData?.expiresAt) {
        const expiresAtMs = parseServerDate(attemptData.expiresAt)
        if (expiresAtMs) {
          const diff = Math.floor((expiresAtMs - Date.now()) / 1000)
          // Nếu chênh lệch hợp lệ (> 0 và không lệch quá mức do desync giờ client/server)
          if (diff > 0 && diff <= totalSeconds + 120) {
            remaining = diff
          }
        }
      }

      setTimeLeft(remaining)

    } catch (error) {
      alert('Không thể tải đề thi hoặc tạo phiên làm bài.')
      navigate('/hsk-tests')
    } finally {
      setLoading(false)
    }
  }

  // Timer Countdown
  // Mỗi lần timeLeft thay đổi: cleanup xóa interval cũ → effect tạo interval mới.
  // Đảm bảo luôn chỉ có 1 interval active tại 1 thời điểm.
  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          // Gọi submit tự động sau 1 tick để state đã được cập nhật
          setTimeout(() => handleTimeUp(), 0)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  const handleTimeUp = () => {
    // Không hỏi confirm — tự động nộp bài
    handleSubmitCore(false)
  }

  const formatTime = (seconds) => {
    const safeSecs = Math.max(0, seconds || 0)
    const m = Math.floor(safeSecs / 60)
    const s = safeSecs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const handleSelectOption = async (questionId, optionId) => {
    // Cập nhật giao diện lập tức (Optimistic Update)
    setAnswers(prev => ({ ...prev, [questionId]: optionId }))
    
    // Lưu lên server
    if (attempt) {
      try {
        console.log('[DEBUG saveAnswer]', { attemptId: attempt.attemptId, questionId, selectedOptionId: optionId })
        const res = await examService.saveAnswer(attempt.attemptId, questionId, optionId, null, null)
        console.log('[DEBUG saveAnswer response]', res)
      } catch (err) {
        console.error('Lỗi khi lưu đáp án:', err)
        console.error('[DEBUG saveAnswer error response]', err.response?.data)
      }
    }
  }

  const handleTextAnswer = async (questionId, text) => {
    setAnswers(prev => ({ ...prev, [questionId]: text }))
    // Send to backend
    if (attempt) {
      try {
        await examService.saveAnswer(attempt.attemptId, questionId, null, text, null)
      } catch (err) {
        console.error('Lỗi khi lưu đáp án:', err)
      }
    }
  }

  const handleAddOrderingWord = async (questionId, optionId) => {
    setAnswers(prev => {
      const currentOrder = prev[questionId] || []
      const newOrder = [...currentOrder, optionId]
      
      if (attempt) {
        examService.saveAnswer(attempt.attemptId, questionId, null, null, newOrder).catch(err => {
          console.error('Lỗi khi lưu đáp án:', err)
        })
      }
      
      return { ...prev, [questionId]: newOrder }
    })
  }

  const handleRemoveOrderingWord = async (questionId, optionId) => {
    setAnswers(prev => {
      const currentOrder = prev[questionId] || []
      const newOrder = currentOrder.filter(id => id !== optionId)
      
      if (attempt) {
        examService.saveAnswer(attempt.attemptId, questionId, null, null, newOrder).catch(err => {
          console.error('Lỗi khi lưu đáp án:', err)
        })
      }
      
      return { ...prev, [questionId]: newOrder }
    })
  }

  // handleSubmitCore: logic nộp bài thực sự
  // withConfirm=true  → hỏi xác nhận (bấm nút Nộp bài)
  // withConfirm=false → tự động nộp khi hết giờ (không hỏi)
  const handleSubmitCore = async (withConfirm = true) => {
    // Guard chống double-submit
    if (isSubmitting.current) return
    if (withConfirm && !window.confirm('Bạn có chắc chắn muốn nộp bài?')) return

    isSubmitting.current = true
    try {
      const currentAttempt = attemptRef.current || attempt
      const currentExam = examRef.current || exam
      const currentAnswers = answersRef.current || answers

      // Tính thời gian thực tế học viên đã làm bài (tính bằng giây)
      const timeSpentSecs = startTimeRef.current
        ? Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000))
        : 60

      const allQuestions = (currentExam.sections || []).flatMap(s => s.questions || [])
      const mappedAnswers = Object.entries(currentAnswers).map(([qId, val]) => {
        const q = allQuestions.find(x => x.id === qId)
        if (!q) return null
        const req = { questionId: qId }
        if (q.questionType === 'WRITING' || q.questionType === 'FILL_IN_BLANK') {
          req.textAnswer = val
        } else if (q.questionType === 'SENTENCE_ORDERING') {
          req.orderAnswer = val
        } else if (q.questionType === 'MATCHING') {
          req.matchPairs = val
        } else {
          req.selectedOptionId = val
        }
        return req
      }).filter(Boolean)

      const res = await examService.submitAttempt(currentAttempt.attemptId, {
        answers: mappedAnswers,
        timeSpentSecs: timeSpentSecs
      })
      setResult(res.result)
    } catch (err) {
      console.error('[DEBUG] submitAttempt error:', err)
      const msg = err.response?.data?.message || 'Lỗi khi nộp bài!'
      alert(msg)
      isSubmitting.current = false  // Cho phép thử lại nếu lỗi
    }
  }

  // Nút bấm Nộp bài thủ công
  const handleSubmit = () => handleSubmitCore(true)

  if (loading || !exam || !attempt) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải đề thi...</div>
  }

  if (result) {
    return (
      <div className={styles.app}>
        <header className={styles.header}>
          <div className={styles.left}>
            <div className={styles.logo}>Sun<span>HSK</span></div>
          </div>
        </header>
        <main className={styles.main}>
          <div className={styles.resultCard}>
            <h2 className={styles.resultTitle}>Kết quả thi: {exam.title}</h2>
            <div className={styles.scoreCircle}>
              <span className={styles.scoreText}>{result.totalScore} / {result.totalPoints}</span>
              <span className={styles.scorePercent}>({result.scorePercent}%)</span>
            </div>
            
            <div className={styles.resultStatus}>
              {result.passed ? (
                <span className={styles.passed}>🎉 ĐẠT</span>
              ) : (
                <span className={styles.failed}>❌ CHƯA ĐẠT</span>
              )}
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
            </div>

            <div className={styles.resultActions}>
              <button 
                className={`${styles.btnPrimaryLg} ${styles.btnOutline}`}
                onClick={() => navigate(`/hsk-tests/${exam.hskLevel}`)}
              >
                ← Quay lại danh sách đề
              </button>
            </div>
          </div>

          {/* ── REVIEW CHI TIẾT TỪNG CÂU ── */}
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
                      isWriting
                        ? styles.reviewNeutral
                        : isCorrect
                        ? styles.reviewCorrect
                        : styles.reviewWrong
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

                    {/* Phần đáp án — Multiple Choice có options */}
                    {ans.options && ans.options.length > 0 ? (
                      <div className={styles.reviewOptions}>
                        {ans.options.map((opt, optIdx) => {
                          const label = ['A', 'B', 'C', 'D', 'E'][optIdx] || '*'
                          const userChose = opt.id === ans.selectedOptionId
                          const isOptCorrect = Boolean(
                            opt.isCorrect ||
                            opt.correct ||
                            (ans.correctOptionId && opt.id === ans.correctOptionId)
                          )

                          let cls = styles.reviewOpt
                          if (isOptCorrect && userChose) cls += ' ' + styles.reviewOptCorrectChosen
                          else if (isOptCorrect) cls += ' ' + styles.reviewOptCorrect
                          else if (userChose) cls += ' ' + styles.reviewOptUserChosen

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
                                <span className={`${styles.reviewTag} ${styles.reviewTagUserChosen}`}>Bạn chọn</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      /* Fill-blank / Short answer / Writing */
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

              {/* Bottom CTA */}
              <div className={styles.reviewBottom}>
                <button
                  className={styles.btnPrimaryLg}
                  onClick={() => navigate(`/hsk-tests/${exam.hskLevel}`)}
                >
                  Quay lại danh sách đề ›
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    )
  }

  const sections = exam.sections || []
  const currentSection = sections[activeSectionIdx]
  const totalQuestions = exam.totalQuestions || 0
  const answeredCount = Object.keys(answers).length

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.left}>
          <button className={styles.close} onClick={() => setShowExitDialog(true)} aria-label="Thoát">×</button>
          <div className={styles.logo}>Sun<span>HSK</span></div>
          <div className={styles.divider}></div>
          <div className={styles.title}>
            <strong>{exam.title}</strong>
            <span>{currentSection?.title || 'Phần thi'}</span>
          </div>
        </div>
        <div className={styles.right}>
          <div className={`${styles.timer} ${timeLeft < 300 ? styles.warn : ''}`}>
            ⏱ {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* TABS */}
        <div className={styles.tabs}>
          {sections.map((sec, idx) => (
            <button 
              key={sec.id} 
              className={`${styles.tab} ${activeSectionIdx === idx ? styles.active : ''}`}
              onClick={() => setActiveSectionIdx(idx)}
            >
              {sec.title || sec.sectionType}
            </button>
          ))}
        </div>

        {/* SECTION INSTRUCTIONS */}
        <section className={styles.sectionHead}>
          <h2>{currentSection?.title}</h2>
          <p>{currentSection?.instructions || 'Đọc kỹ câu hỏi và chọn đáp án chính xác nhất.'}</p>
        </section>

        {/* CONTENT */}
        <section className={styles.content}>
          {currentSection?.questions?.map((q, idx) => (
            <div key={q.id} className={styles.q} id={`q-${q.id}`}>
              <div className={styles.qTitle}>
                <span className={styles.qno}>{idx + 1}</span>
                <span className={styles.qText}>
                  {q.content}
                  {q.audioUrl && (
                    <div style={{ marginTop: '12px', marginBottom: '8px' }}>
                      <audio controls src={q.audioUrl} style={{ width: '100%', height: '40px' }}>
                        Trình duyệt của bạn không hỗ trợ thẻ audio.
                      </audio>
                    </div>
                  )}
                  {q.imageUrl && <div style={{ marginTop: '10px' }}><img src={q.imageUrl} alt="minh họa" style={{ maxWidth: '100%', borderRadius: 8 }} /></div>}
                </span>
              </div>
              <div className={styles.options}>
                {q.questionType === 'WRITING' ? (
                  <textarea
                    className={styles.writingArea}
                    value={answers[q.id] || ''}
                    onChange={(e) => handleTextAnswer(q.id, e.target.value)}
                    placeholder="Viết câu trả lời của bạn ở đây..."
                    rows={6}
                  />
                ) : q.questionType === 'SENTENCE_ORDERING' ? (
                  <div className={styles.orderingContainer}>
                    <div className={styles.orderedWords}>
                      {(answers[q.id] || []).map((optId, idx) => {
                        const opt = q.options?.find(o => o.id === optId);
                        return (
                          <button 
                            key={`ordered-${optId}-${idx}`}
                            className={styles.orderedWordBtn}
                            onClick={() => handleRemoveOrderingWord(q.id, optId)}
                          >
                            {opt?.content}
                          </button>
                        );
                      })}
                    </div>
                    <div className={styles.availableWords}>
                      {q.options?.filter(opt => !(answers[q.id] || []).includes(opt.id)).map(opt => (
                        <button
                          key={`avail-${opt.id}`}
                          className={styles.availableWordBtn}
                          onClick={() => handleAddOrderingWord(q.id, opt.id)}
                        >
                          {opt.content}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  q.options?.map((opt, optIdx) => {
                    const isSelected = answers[q.id] === opt.id
                    const label = ['A', 'B', 'C', 'D', 'E', 'F'][optIdx] || '*'
                    return (
                      <button 
                        key={opt.id} 
                        className={`${styles.option} ${isSelected ? styles.selected : ''}`}
                        onClick={() => handleSelectOption(q.id, opt.id)}
                        aria-label={`Chọn đáp án ${label}: ${opt.content}`}
                        style={{ flexDirection: opt.imageUrl ? 'column' : 'row', alignItems: opt.imageUrl ? 'flex-start' : 'center', gap: '8px' }}
                      >
                        <b>{label}</b> 
                        {opt.imageUrl && (
                          <div style={{ width: '100%', textAlign: 'center', margin: '4px 0' }}>
                            <img 
                              src={opt.imageUrl} 
                              alt={`Tranh ${label}`} 
                              style={{ maxWidth: '100%', maxHeight: '140px', objectFit: 'contain', borderRadius: '6px', background: '#f8fafc' }} 
                            />
                          </div>
                        )}
                        {opt.content && <span>{opt.content}</span>}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          ))}
        </section>
      </main>

      <button 
        className={`${styles.float} ${showPalette ? styles.up : ''}`} 
        aria-label="Toggle bảng câu hỏi"
        onClick={() => setShowPalette(!showPalette)}
      >
        {showPalette ? '⬇ Đóng bảng câu hỏi' : '☷ Bảng câu hỏi'}
      </button>

      <footer className={styles.footer}>
        {showPalette && (
          <div className={styles.palette}>
            {/* Render palette numbers for all questions across all sections. */}
            {sections.flatMap(s => s.questions || []).map((q, idx) => (
            <button 
              key={q.id} 
              className={`${styles.num} ${answers[q.id] ? styles.done : ''}`}
              aria-label={`Đi đến câu hỏi số ${idx + 1}`}
              onClick={() => {
                // Find section index for this question
                const secIdx = sections.findIndex(s => s.questions?.some(sq => sq.id === q.id))
                if (secIdx !== -1 && secIdx !== activeSectionIdx) {
                  setActiveSectionIdx(secIdx)
                }
                // Scroll to question slightly delayed to allow section to render
                setTimeout(() => {
                  document.getElementById(`q-${q.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }, 100)
              }}
            >
              {idx + 1}
            </button>
          ))}
          </div>
        )}
        
        <div className={styles.bottom}>
          <div className={styles.progress}>
            {currentSection?.title} · Đã làm <strong id="done">{answeredCount} / {totalQuestions}</strong>
          </div>
          <div className={styles.actions}>
            <button 
              className={`${styles.btn} ${styles.secondary}`} 
              onClick={() => setActiveSectionIdx(Math.max(0, activeSectionIdx - 1))}
              disabled={activeSectionIdx === 0}
            >
              ‹ Phần trước
            </button>
            <button 
              className={`${styles.btn} ${styles.primary}`}
              onClick={() => setActiveSectionIdx(Math.min(sections.length - 1, activeSectionIdx + 1))}
              disabled={activeSectionIdx >= sections.length - 1}
            >
              Phần tiếp theo ›
            </button>
            <button className={`${styles.btn} ${styles.finish}`} onClick={handleSubmit}>
              Nộp bài
            </button>
          </div>
        </div>
      </footer>

      {/* ── DIALOG XÁC NHẬN NỘP BÀI SỚM KHI THOÁT ── */}
      {showExitDialog && (
        <div className={styles.modalOverlay} onClick={() => setShowExitDialog(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIconWrap}>
              <span className={styles.modalIcon}>⚠️</span>
            </div>

            <h3 className={styles.modalTitle}>Xác nhận nộp bài sớm?</h3>
            
            <p className={styles.modalDesc}>
              Bạn đang làm bài thi <strong>{exam.title}</strong>. Khi thoát bây giờ, hệ thống sẽ tự động nộp bài với các câu đã trả lời để chấm điểm.
            </p>

            <div className={styles.modalStats}>
              <div className={styles.modalStatItem}>
                <span className={styles.modalStatLabel}>Câu đã làm</span>
                <span className={styles.modalStatVal}>{answeredCount} / {totalQuestions}</span>
              </div>
              <div className={styles.modalStatDivider} />
              <div className={styles.modalStatItem}>
                <span className={styles.modalStatLabel}>Thời gian còn lại</span>
                <span className={styles.modalStatVal} style={{ color: '#ea580c' }}>{formatTime(timeLeft)}</span>
              </div>
            </div>

            <p className={styles.modalWarning}>
              ⚠️ Các câu chưa làm sẽ tính là sai. Sau khi nộp, bạn không thể chỉnh sửa bài làm.
            </p>

            <div className={styles.modalActions}>
              <button 
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setShowExitDialog(false)}
              >
                Tiếp tục làm bài
              </button>
              <button 
                type="button"
                className={styles.modalConfirmBtn}
                onClick={async () => {
                  setShowExitDialog(false)
                  await handleSubmitCore(false)
                }}
              >
                ✓ Nộp bài sớm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
