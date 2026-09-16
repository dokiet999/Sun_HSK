import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { exerciseService } from '../services/exerciseService';
import { playChineseAudio } from '../utils/audioPlayer';
import styles from './ExercisePage.module.css';

const PUNCT_REGEX = /[\s\u3000-\u303F\uFF00-\uFFEF\u2000-\u206F.,;:!?"'()\[\]{}\-—_]+/g;

function normalizeChinese(str) {
  if (!str) return '';
  return str.replace(PUNCT_REGEX, '').trim().toLowerCase();
}

export default function ExercisePage() {
  const { level, lessonNumber } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isHsk3 = location.pathname.includes('/hsk3');
  const numericLevel = parseInt((level || '').replace(/\D/g, ''), 10) || 1;
  const currentLesson = parseInt(lessonNumber, 10) || 1;

  const basePath = isHsk3 ? `/vocabulary/hsk3/hsk-${numericLevel}` : `/vocabulary/hsk2/hsk-${numericLevel}`;
  const backUrl = `${basePath}/lesson/${currentLesson}`;

  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Timer state (đếm giây làm bài)
  const [seconds, setSeconds] = useState(0);

  // Current answer state
  const [textAnswer, setTextAnswer] = useState('');
  const [selectedTokens, setSelectedTokens] = useState([]);
  const [availableTokens, setAvailableTokens] = useState([]);

  // Result state for current question
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Timer effect
  useEffect(() => {
    if (completed || loading) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [completed, loading]);

  const formatTimer = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m} : ${s}s`;
  };

  // Fetch exercises
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    exerciseService
      .getExercises(numericLevel, currentLesson, null, 30)
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res?.result)
          ? res.result
          : Array.isArray(res?.data?.result)
          ? res.data.result
          : Array.isArray(res?.data)
          ? res.data
          : [];
        setExercises(list);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Lỗi tải bài tập:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [numericLevel, currentLesson]);

  const currentExercise = exercises[currentIndex] || null;

  // Khi chuyển câu hỏi: reset input và tokens
  useEffect(() => {
    if (!currentExercise) return;

    setTextAnswer('');
    setIsSubmitted(false);
    setIsCorrect(false);

    if (currentExercise.exerciseType === 'SENTENCE_ORDERING' && currentExercise.tokens) {
      setSelectedTokens([]);
      setAvailableTokens([...currentExercise.tokens]);
    }

    // Nếu là bài nghe, tự động phát audio sau 300ms
    if (currentExercise.exerciseType === 'LISTENING' && currentExercise.audioPath) {
      const timer = setTimeout(() => {
        const text = currentExercise.sentenceZh || currentExercise.hanzi;
        playChineseAudio(text, currentExercise.audioPath);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentExercise]);

  // Chọn token vào slot (Sentence Ordering)
  const handleSelectToken = (token, poolIdx) => {
    if (isSubmitted) return;
    setSelectedTokens((prev) => [...prev, token]);
    setAvailableTokens((prev) => prev.filter((_, idx) => idx !== poolIdx));
  };

  // Trả token từ slot về pool (Sentence Ordering)
  const handleRemoveToken = (token, slotIdx) => {
    if (isSubmitted) return;
    setAvailableTokens((prev) => [...prev, token]);
    setSelectedTokens((prev) => prev.filter((_, idx) => idx !== slotIdx));
  };

  // Reset tokens
  const handleResetTokens = () => {
    if (isSubmitted || !currentExercise?.tokens) return;
    setSelectedTokens([]);
    setAvailableTokens([...currentExercise.tokens]);
  };

  // Kiểm tra câu trả lời
  const handleCheckAnswer = () => {
    if (!currentExercise || isSubmitted) return;

    let submittedStr = '';
    let expectedStr = currentExercise.correctAnswer || '';
    let correct = false;

    if (currentExercise.exerciseType === 'FILL_BLANK') {
      submittedStr = textAnswer.trim();
      correct = submittedStr.toLowerCase() === expectedStr.trim().toLowerCase();
    } else if (currentExercise.exerciseType === 'SENTENCE_ORDERING') {
      submittedStr = selectedTokens.join('');
      correct = normalizeChinese(submittedStr) === normalizeChinese(expectedStr);
    } else if (currentExercise.exerciseType === 'LISTENING') {
      submittedStr = textAnswer.trim();
      correct = normalizeChinese(submittedStr) === normalizeChinese(expectedStr);
    }

    setIsCorrect(correct);
    setIsSubmitted(true);
    if (correct) {
      setScore((prev) => prev + 1);
    }

    // Phát âm đáp án đúng nếu đúng
    if (correct) {
      const audioTarget = currentExercise.sentenceZh || currentExercise.correctAnswer || currentExercise.hanzi;
      playChineseAudio(audioTarget, currentExercise.audioPath);
    }

    // Submit attempt bất đồng bộ lên server để ghi nhận lịch sử
    exerciseService.submitAttempt(currentExercise.id, submittedStr, 0).catch(() => {});
  };

  // Sang câu hỏi tiếp theo
  const handleNextQuestion = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  // Bỏ qua câu hỏi (khi người dùng bấm Chưa nhớ từ?)
  const handleSkip = () => {
    if (isSubmitted) {
      handleNextQuestion();
      return;
    }
    setIsCorrect(false);
    setIsSubmitted(true);
    exerciseService.submitAttempt(currentExercise.id, '', 0).catch(() => {});
  };

  // Keyboard shortcut Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!isSubmitted) {
        handleCheckAnswer();
      } else {
        handleNextQuestion();
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ display: 'grid', placeItems: 'center', height: '60vh', color: '#64748b' }}>
          Đang chuẩn bị bài tập HSK {numericLevel} - Bài {currentLesson}...
        </div>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.nav}>
            <Link to="/" className={styles.brand}>
              <span className={styles.brandMark}>汉</span>
              <span className={styles.brandText}>Sun HSK</span>
            </Link>
            <div />
            <div className={styles.actions}>
              <Link to={backUrl} className={styles.close} aria-label="Đóng">✕</Link>
            </div>
          </div>
        </header>
        <div style={{ display: 'grid', placeItems: 'center', height: '60vh', textAlign: 'center', padding: 20 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px 0' }}>Chưa có bài tập cho bài học này</h3>
          <p style={{ color: '#64748b', marginBottom: 24, fontSize: 14 }}>
            Bạn có thể học từ vựng bằng Flashcard hoặc quay lại danh sách bài học.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to={`${basePath}/lesson/${currentLesson}/flashcard`} className={styles.check} style={{ textDecoration: 'none' }}>
              Học Flashcard
            </Link>
            <Link to={backUrl} className={styles.stop} style={{ textDecoration: 'none' }}>
              Xem bài học
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Màn hình kết quả hoàn thành bài tập
  if (completed) {
    const percent = Math.round((score / exercises.length) * 100);
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.nav}>
            <Link to="/" className={styles.brand}>
              <span className={styles.brandMark}>汉</span>
              <span className={styles.brandText}>Sun HSK</span>
            </Link>
            <div className={styles.timer}>
              <span className={styles.timerRing}></span>
              <span>{formatTimer(seconds)}</span>
            </div>
            <div className={styles.actions}>
              <Link to={backUrl} className={styles.close} aria-label="Đóng">✕</Link>
            </div>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.completedBox}>
            <h2 className={styles.completedTitle}>Hoàn thành bài luyện tập</h2>
            <p className={styles.completedDesc}>
              Bạn đã hoàn thành tất cả {exercises.length} câu hỏi của HSK {numericLevel} - Bài {currentLesson} trong {formatTimer(seconds)}.
            </p>

            <div className={styles.scorePill}>
              <span className={styles.scoreNumber}>{score}</span>
              <span className={styles.scoreTotal}>/ {exercises.length} câu đúng ({percent}%)</span>
            </div>

            <div className={styles.completedActions}>
              <button
                className={styles.primaryAction}
                onClick={() => {
                  setCompleted(false);
                  setCurrentIndex(0);
                  setScore(0);
                  setSeconds(0);
                  setIsSubmitted(false);
                }}
              >
                Luyện tập lại
              </button>
              <Link
                to={`${basePath}/lesson/${currentLesson}/flashcard`}
                className={styles.secondaryAction}
              >
                Ôn luyện Flashcard
              </Link>
              <Link
                to={backUrl}
                className={styles.secondaryAction}
              >
                Xem bài học
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const progressPercent = ((currentIndex + 1) / exercises.length) * 100;
  const isTypeFillBlank = currentExercise.exerciseType === 'FILL_BLANK';
  const isTypeOrdering = currentExercise.exerciseType === 'SENTENCE_ORDERING';
  const isTypeListening = currentExercise.exerciseType === 'LISTENING';

  const typeLabel = isTypeFillBlank
    ? '✍️ Điền từ vào chỗ trống'
    : isTypeOrdering
    ? '🧩 Sắp xếp câu'
    : '🎧 Nghe và nhập câu';

  const isCheckDisabled =
    (isTypeFillBlank && !textAnswer.trim()) ||
    (isTypeListening && !textAnswer.trim()) ||
    (isTypeOrdering && selectedTokens.length === 0);

  return (
    <div className={styles.page}>
      {/* Header Bar */}
      <header className={styles.header}>
        <div className={styles.nav}>
          {/* Logo Sun HSK */}
          <Link to="/" className={styles.brand} title="Về trang chủ">
            <span className={styles.brandMark}>汉</span>
            <span className={styles.brandText}>Sun HSK</span>
          </Link>

          {/* Bộ đếm thời gian */}
          <div className={styles.timer}>
            <span className={styles.timerRing}></span>
            <span id="timer">{formatTimer(seconds)}</span>
          </div>

          {/* Nút Dừng học / Đóng */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.stop}
              onClick={() => {
                if (window.confirm('Bạn có muốn tạm dừng bài luyện tập này để quay lại bài học?')) {
                  navigate(backUrl);
                }
              }}
            >
              Dừng học <b>×</b>
            </button>
            <Link to={backUrl} className={styles.close} aria-label="Đóng" title="Quay lại bài học">
              ✕
            </Link>
          </div>
        </div>
      </header>

      {/* Progress Track */}
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Main Content - Card Bố cục cũ */}
      <main className={styles.main}>
        <div className={styles.exerciseCard}>
          {/* Question Head: Badge loại bài tập + Cấp độ + Số câu */}
          <div className={styles.questionHead}>
            <div
              className={`${styles.typeBadge} ${
                isTypeFillBlank
                  ? styles.typeFillBlank
                  : isTypeOrdering
                  ? styles.typeOrdering
                  : styles.typeListening
              }`}
            >
              {typeLabel}
            </div>
            <div className={styles.levelBadge}>
              HSK {numericLevel} • Bài {currentLesson}
            </div>
            <div className={styles.questionCounter}>
              Câu {currentIndex + 1} / {exercises.length}
            </div>
          </div>

          {/* DẠNG 1: FILL BLANK */}
          {isTypeFillBlank && (
            <div className={styles.questionSection}>
              <div className={styles.promptText}>Chọn hoặc gõ từ đúng để điền vào chỗ trống:</div>
              <div className={styles.questionZh}>{currentExercise.blankText}</div>
              {currentExercise.sentenceVi && (
                <div className={styles.questionVi}>Nghĩa: {currentExercise.sentenceVi}</div>
              )}
              <div className={styles.inputRow}>
                <input
                  type="text"
                  className={styles.answerInput}
                  placeholder="Nhập chữ Hán cần điền..."
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSubmitted}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* DẠNG 2: SENTENCE ORDERING */}
          {isTypeOrdering && (
            <div className={styles.orderingContainer}>
              <div className={styles.promptText}>Ghép các từ để tạo thành câu hoàn chỉnh:</div>
              {currentExercise.sentenceVi && (
                <div className={styles.questionVi}>Nghĩa: {currentExercise.sentenceVi}</div>
              )}

              {/* Slot ghép câu */}
              <div className={`${styles.slotBox} ${selectedTokens.length > 0 ? styles.slotBoxActive : ''}`}>
                {selectedTokens.length === 0 ? (
                  <span className={styles.slotPlaceholder}>Bấm vào các từ bên dưới để ghép vào đây...</span>
                ) : (
                  selectedTokens.map((token, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`${styles.tokenChip} ${styles.tokenChipInSlot}`}
                      onClick={() => handleRemoveToken(token, idx)}
                      disabled={isSubmitted}
                      title="Bấm để bỏ từ này ra"
                    >
                      {token}
                    </button>
                  ))
                )}
              </div>

              {selectedTokens.length > 0 && !isSubmitted && (
                <button type="button" className={styles.resetBtn} onClick={handleResetTokens}>
                  ✕ Làm lại từ đầu
                </button>
              )}

              {/* Pool các từ có sẵn */}
              <div className={styles.poolBox}>
                {availableTokens.map((token, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={styles.tokenChip}
                    onClick={() => handleSelectToken(token, idx)}
                    disabled={isSubmitted}
                  >
                    {token}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* DẠNG 3: LISTENING */}
          {isTypeListening && (
            <div className={styles.questionSection}>
              <div className={styles.promptText}>Nghe âm thanh và gõ chữ Hán bạn nghe được:</div>

              <div className={styles.listeningCenter}>
                <button
                  type="button"
                  className={styles.bigAudioBtn}
                  onClick={() => {
                    const text = currentExercise.sentenceZh || currentExercise.hanzi;
                    playChineseAudio(text, currentExercise.audioPath);
                  }}
                  title="Bấm để nghe phát âm"
                >
                  🔊
                </button>
                <button
                  type="button"
                  className={styles.speedToggle}
                  onClick={() => {
                    const text = currentExercise.sentenceZh || currentExercise.hanzi;
                    playChineseAudio(text, currentExercise.audioPath);
                  }}
                >
                  🔈 Nghe lại
                </button>
              </div>

              <div className={styles.inputRow}>
                <input
                  type="text"
                  className={styles.answerInput}
                  placeholder="Gõ chữ Hán bạn nghe được..."
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSubmitted}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Nút Bỏ qua câu hỏi */}
          {!isSubmitted && (
            <button type="button" className={styles.skipBtn} onClick={handleSkip}>
              Chưa nhớ từ? Bỏ qua câu này
            </button>
          )}

          {/* Feedback tức thì sau khi bấm Kiểm tra */}
          {isSubmitted && (
            <div className={`${styles.feedbackBox} ${isCorrect ? styles.feedbackCorrect : styles.feedbackWrong}`}>
              <div className={styles.feedbackTitle}>
                {isCorrect ? '✅ Chính xác!' : '❌ Chưa chính xác!'}
              </div>
              <div className={styles.feedbackAnswer}>
                Đáp án đúng: <span>{currentExercise.correctAnswer}</span>
              </div>
              {currentExercise.explanation && (
                <div className={styles.feedbackExplanation}>
                  💡 {currentExercise.explanation}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Sticky Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.hint}>
            {isSubmitted ? 'Nhấn Enter để tiếp tục' : 'Nhấn Enter để kiểm tra'}
          </div>
          <button
            type="button"
            className={styles.check}
            onClick={isSubmitted ? handleNextQuestion : handleCheckAnswer}
            disabled={!isSubmitted && isCheckDisabled}
          >
            {isSubmitted
              ? currentIndex === exercises.length - 1
                ? 'Xem kết quả'
                : 'Câu tiếp theo'
              : 'Kiểm tra'}
          </button>
        </div>
      </footer>
    </div>
  );
}
