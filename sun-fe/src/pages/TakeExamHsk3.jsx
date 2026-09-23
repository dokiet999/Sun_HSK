import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { examService } from '../services/examService'
import styles from './TakeExamHsk3.module.css'

export default function TakeExamHsk3() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [exam, setExam] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [loading, setLoading] = useState(true)

  // Questions and navigation
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({}) // { [questionId]: { selectedOptionId, textAnswer } }
  const [flaggedIds, setFlaggedIds] = useState(new Set())
  const [activeSectionIdx, setActiveSectionIdx] = useState(0)

  // Timer
  const [timeLeft, setTimeLeft] = useState(0)
  const isSubmitting = useRef(false)
  const answersRef = useRef(answers)
  answersRef.current = answers
  const attemptRef = useRef(attempt)
  attemptRef.current = attempt

  // Audio state
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)

  // Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  // Load Exam and start attempt
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login', { state: { from: location.pathname + location.search } })
      return
    }

    async function init() {
      try {
        setLoading(true)
        const detailRes = await examService.getExamDetail(id)
        const examData = detailRes.result
        setExam(examData)

        const attemptRes = await examService.startAttempt(id)
        const attemptData = attemptRes.result
        setAttempt(attemptData)

        const limitMinutes = attemptData?.timeLimitMinutes || examData?.timeLimit || 90
        setTimeLeft(limitMinutes * 60)
      } catch (err) {
        console.error('Không thể tải đề thi hoặc tạo phiên làm bài iBT:', err)
        if (err.response?.status === 401 || !localStorage.getItem('token')) {
          navigate('/login', { state: { from: location.pathname + location.search } })
          return
        }
        alert('Không thể kết nối phòng thi HSK 3.0 iBT.')
        navigate('/hsk-tests/hsk3')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [id])

  // Flatten questions from sections
  const allQuestions = useMemo(() => {
    if (!exam?.sections) return []
    const list = []
    exam.sections.forEach((sec, sIdx) => {
      if (sec.questions) {
        sec.questions.forEach((q) => {
          list.push({ ...q, sectionIndex: sIdx, sectionTitle: sec.title || `Phần ${sIdx + 1}` })
        })
      }
    })
    return list
  }, [exam])

  // Sync active section tab when current question changes
  useEffect(() => {
    const currentQ = allQuestions[currentIdx]
    if (currentQ) {
      setActiveSectionIdx(currentQ.sectionIndex)
    }
  }, [currentIdx, allQuestions])

  // Countdown timer
  useEffect(() => {
    if (loading || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, timeLeft])

  const handleAutoSubmit = async () => {
    if (isSubmitting.current) return
    isSubmitting.current = true
    alert('Hết giờ làm bài! Hệ thống tự động nộp bài thi.')
    await finalizeSubmission()
  }

  const finalizeSubmission = async () => {
    try {
      if (!attemptRef.current?.id) return
      const submitData = {
        answers: Object.entries(answersRef.current).map(([qId, val]) => ({
          questionId: qId,
          selectedOptionId: val.selectedOptionId || null,
          textAnswer: val.textAnswer || null,
        })),
      }
      await examService.submitAttempt(attemptRef.current.id, submitData)
      navigate(`/history/${attemptRef.current.id}/result`)
    } catch (err) {
      console.error('Lỗi khi nộp bài:', err)
      alert('Có lỗi khi nộp bài. Đang chuyển về trang lịch sử thi.')
      navigate('/history')
    }
  }

  // Answer handlers
  const handleSelectOption = async (questionId, optionId) => {
    const newAnswers = {
      ...answers,
      [questionId]: {
        ...answers[questionId],
        selectedOptionId: optionId,
      },
    }
    setAnswers(newAnswers)

    // Save realtime
    if (attempt?.id) {
      try {
        await examService.saveAnswer(attempt.id, questionId, optionId, null, null)
      } catch (e) {
        console.warn('Lỗi lưu đáp án realtime:', e)
      }
    }
  }

  const handleTextChange = (questionId, text) => {
    setAnswers({
      ...answers,
      [questionId]: {
        ...answers[questionId],
        textAnswer: text,
      },
    })
  }

  const handleTextBlur = async (questionId) => {
    const currentVal = answers[questionId]?.textAnswer
    if (attempt?.id && currentVal !== undefined) {
      try {
        await examService.saveAnswer(attempt.id, questionId, null, currentVal, null)
      } catch (e) {
        console.warn('Lỗi lưu text realtime:', e)
      }
    }
  }

  // Flag toggle
  const toggleFlag = (questionId) => {
    setFlaggedIds((prev) => {
      const next = new Set(prev)
      if (next.has(questionId)) {
        next.delete(questionId)
      } else {
        next.add(questionId)
      }
      return next
    })
  }

  // Audio handling
  const togglePlayAudio = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className={styles.examRoom} style={{ display: 'grid', placeItems: 'center' }}>
        <p style={{ color: '#64748b', fontSize: 14 }}>Đang kết nối phòng thi HSK 3.0 iBT...</p>
      </div>
    )
  }

  const currentQuestion = allQuestions[currentIdx]
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null
  const isCurrentFlagged = currentQuestion ? flaggedIds.has(currentQuestion.id) : false

  // Stats calculation
  const totalQuestions = allQuestions.length
  const answeredCount = Object.values(answers).filter(
    (a) => a?.selectedOptionId || (a?.textAnswer && a.textAnswer.trim().length > 0)
  ).length
  const flaggedCount = flaggedIds.size
  const unansweredCount = Math.max(0, totalQuestions - answeredCount)

  return (
    <div className={styles.examRoom}>
      {/* Top Cockpit Header */}
      <header className={styles.topBar}>
        <div className={styles.examBrand}>
          <span className={styles.brandBadge}>iBT CBT</span>
          <span className={styles.examTitle}>{exam?.title || 'HSK 3.0 Exam'}</span>
        </div>

        <div className={styles.topControls}>
          {/* Digital Timer */}
          <div className={`${styles.timerBox} ${timeLeft < 300 ? styles.timerWarning : ''}`}>
            <span className={styles.timerLabel}>Thời gian</span>
            <span className={styles.timerDigits}>{formatTimer(timeLeft)}</span>
          </div>

          {/* Flag button */}
          {currentQuestion && (
            <button
              type="button"
              className={`${styles.flagBtn} ${isCurrentFlagged ? styles.flagBtnActive : ''}`}
              onClick={() => toggleFlag(currentQuestion.id)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={isCurrentFlagged ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
              <span>{isCurrentFlagged ? 'Đã đánh dấu' : 'Đánh dấu'}</span>
            </button>
          )}

          {/* Submit button */}
          <button
            type="button"
            className={styles.submitBtn}
            onClick={() => setShowSubmitModal(true)}
          >
            Nộp bài
          </button>
        </div>
      </header>

      {/* Section Tabs */}
      {exam?.sections && exam.sections.length > 0 && (
        <div className={styles.sectionTabs}>
          {exam.sections.map((sec, idx) => (
            <button
              key={sec.id || idx}
              type="button"
              className={`${styles.sectionTab} ${activeSectionIdx === idx ? styles.sectionTabActive : ''}`}
              onClick={() => {
                const targetIdx = allQuestions.findIndex((q) => q.sectionIndex === idx)
                if (targetIdx !== -1) setCurrentIdx(targetIdx)
              }}
            >
              {sec.title || `Phần ${idx + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Main Workspace */}
      <main className={styles.workspace}>
        {/* Left Question Area */}
        <div className={styles.questionCard}>
          {currentQuestion ? (
            <>
              <div className={styles.qHeader}>
                <span className={styles.qIndex}>
                  Câu hỏi {currentIdx + 1} / {totalQuestions}
                </span>
                <span className={styles.qType}>
                  {currentQuestion.questionType || 'TRẮC NGHIỆM'}
                </span>
              </div>

              {/* Minimalist Audio Player if available */}
              {currentQuestion.audioUrl && (
                <div className={styles.audioPlayer}>
                  <audio
                    ref={audioRef}
                    src={currentQuestion.audioUrl}
                    onTimeUpdate={() => {
                      if (audioRef.current) {
                        setAudioProgress(audioRef.current.currentTime)
                        setAudioDuration(audioRef.current.duration || 0)
                      }
                    }}
                    onEnded={() => setIsPlaying(false)}
                  />
                  <button type="button" className={styles.audioPlayBtn} onClick={togglePlayAudio}>
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                  <div className={styles.audioTrack}>
                    <input
                      type="range"
                      className={styles.audioSlider}
                      min="0"
                      max={audioDuration || 100}
                      value={audioProgress}
                      onChange={(e) => {
                        if (audioRef.current) {
                          audioRef.current.currentTime = Number(e.target.value)
                        }
                      }}
                    />
                    <span className={styles.audioTime}>
                      {formatTimer(Math.floor(audioProgress))} / {formatTimer(Math.floor(audioDuration))}
                    </span>
                  </div>
                </div>
              )}

              {/* Passage / Content */}
              <div className={styles.qContent}>
                {currentQuestion.passage && (
                  <div className={styles.passageBox}>{currentQuestion.passage}</div>
                )}
                <p>{currentQuestion.content}</p>
              </div>

              {/* Answer options (Multiple choice or Text) */}
              {currentQuestion.options && currentQuestion.options.length > 0 ? (
                <div className={styles.optionsList}>
                  {currentQuestion.options.map((opt, optIdx) => {
                    const keyLabel = String.fromCharCode(65 + optIdx)
                    const isSelected = currentAnswer?.selectedOptionId === opt.id
                    return (
                      <div
                        key={opt.id || optIdx}
                        className={`${styles.optionItem} ${isSelected ? styles.optionSelected : ''}`}
                        onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                      >
                        <div className={styles.optionKey}>{keyLabel}</div>
                        <div className={styles.optionText}>{opt.content}</div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* Text editor for essay / translation / writing */
                <div className={styles.textEditorArea}>
                  <textarea
                    className={styles.textareaInput}
                    placeholder="Nhập câu trả lời bằng chữ Hán tại đây..."
                    value={currentAnswer?.textAnswer || ''}
                    onChange={(e) => handleTextChange(currentQuestion.id, e.target.value)}
                    onBlur={() => handleTextBlur(currentQuestion.id)}
                  />
                  <div className={styles.wordCountBar}>
                    Số ký tự: {(currentAnswer?.textAnswer || '').trim().length}
                  </div>
                </div>
              )}

              {/* Question Navigation Foot */}
              <div className={styles.qNavFoot}>
                <button
                  type="button"
                  className={styles.navBtn}
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                >
                  Câu trước
                </button>
                <button
                  type="button"
                  className={`${styles.navBtn} ${styles.navBtnPrimary}`}
                  disabled={currentIdx === totalQuestions - 1}
                  onClick={() => setCurrentIdx((prev) => Math.min(totalQuestions - 1, prev + 1))}
                >
                  Câu tiếp theo
                </button>
              </div>
            </>
          ) : (
            <p>Không có câu hỏi nào.</p>
          )}
        </div>

        {/* Right Question Matrix Panel */}
        <aside className={styles.matrixPanel}>
          <div className={styles.matrixHead}>
            <h3 className={styles.matrixTitle}>Bảng câu hỏi</h3>
            <span className={styles.matrixProgress}>
              Đã làm: {answeredCount} / {totalQuestions} câu
            </span>
          </div>

          <div className={styles.legendRow}>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotUnanswered}`} />
              <span>Chưa làm</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotAnswered}`} />
              <span>Đã làm</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotFlagged}`} />
              <span>Đánh dấu</span>
            </div>
          </div>

          <div className={styles.matrixGrid}>
            {allQuestions.map((q, idx) => {
              const isAnswered =
                answers[q.id]?.selectedOptionId ||
                (answers[q.id]?.textAnswer && answers[q.id].textAnswer.trim().length > 0)
              const isFlagged = flaggedIds.has(q.id)
              const isCurrent = idx === currentIdx

              let btnClasses = styles.matrixBtn
              if (isAnswered) btnClasses += ` ${styles.matrixBtnAnswered}`
              if (isFlagged) btnClasses += ` ${styles.matrixBtnFlagged}`
              if (isCurrent) btnClasses += ` ${styles.matrixBtnCurrent}`

              return (
                <button
                  key={q.id}
                  type="button"
                  className={btnClasses}
                  onClick={() => setCurrentIdx(idx)}
                >
                  {idx + 1}
                  {isFlagged && <span className={styles.matrixFlagIndicator} />}
                </button>
              )
            })}
          </div>
        </aside>
      </main>

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Xác nhận nộp bài thi iBT</h3>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn kết thúc và nộp bài thi? Vui lòng kiểm tra lại trạng thái bài làm bên dưới:
            </p>

            <div className={styles.modalStats}>
              <div>
                <div className={styles.mStatNum}>{answeredCount}</div>
                <div className={styles.mStatLabel}>Đã làm</div>
              </div>
              <div>
                <div className={styles.mStatNum} style={{ color: unansweredCount > 0 ? '#dc2626' : '#0f172a' }}>
                  {unansweredCount}
                </div>
                <div className={styles.mStatLabel}>Chưa làm</div>
              </div>
              <div>
                <div className={styles.mStatNum} style={{ color: '#d97706' }}>
                  {flaggedCount}
                </div>
                <div className={styles.mStatLabel}>Đánh dấu</div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => setShowSubmitModal(false)}
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                className={`${styles.navBtn} ${styles.navBtnPrimary}`}
                onClick={finalizeSubmission}
              >
                Nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
