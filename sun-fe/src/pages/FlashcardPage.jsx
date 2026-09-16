import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { vocabularyService } from '../services/vocabularyService';
import { playChineseAudio } from '../utils/audioPlayer';
import styles from './FlashcardPage.module.css';

export default function FlashcardPage() {
  const { level, lessonNumber } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isHsk3 = location.pathname.includes('/hsk3');
  const hskVersionParam = isHsk3 ? 'HSK_3' : 'HSK_2';
  const numericLevel = parseInt((level || '').replace(/\D/g, ''), 10) || 1;
  const currentLesson = parseInt(lessonNumber, 10) || 1;

  const basePath = isHsk3 ? `/vocabulary/hsk3/hsk-${numericLevel}` : `/vocabulary/hsk2/hsk-${numericLevel}`;

  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [showPinyinFront, setShowPinyinFront] = useState(true);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [stats, setStats] = useState({ forgot: 0, familiar: 0, mastered: 0 });

  // Load words
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    vocabularyService
      .getWordsByLesson(numericLevel, currentLesson, 100, hskVersionParam)
      .then((res) => {
        if (!isMounted) return;
        const list =
          res?.result?.words ||
          res?.data?.result?.words ||
          res?.data?.words ||
          (Array.isArray(res?.result) ? res.result : []) ||
          (Array.isArray(res?.data) ? res.data : []);
        setWords(Array.isArray(list) ? list : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Lỗi tải từ vựng:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [numericLevel, currentLesson, hskVersionParam]);

  const currentWord = words[currentIndex] || null;

  // Auto-play audio khi chuyển thẻ
  useEffect(() => {
    if (currentWord && autoPlayAudio && !isFlipped && !completed) {
      const timer = setTimeout(() => {
        playChineseAudio(currentWord.hanzi, currentWord.audioPath);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, autoPlayAudio, isFlipped, completed, currentWord]);

  // Flip card
  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // Xáo trộn ngẫu nhiên
  const handleShuffle = () => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setWords(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Next / Prev card
  const handleNext = useCallback(() => {
    if (currentIndex < words.length - 1) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCompleted(true);
    }
  }, [currentIndex, words.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Đánh giá SRS
  const handleRate = useCallback(
    (rating) => {
      if (!currentWord) return;

      let status = 'LEARNING';
      let numericRating = 1;
      if (rating === 'FORGOT') {
        status = 'LEARNING';
        numericRating = 1;
        setStats((prev) => ({ ...prev, forgot: prev.forgot + 1 }));
      } else if (rating === 'FAMILIAR') {
        status = 'REVIEWING';
        numericRating = 3;
        setStats((prev) => ({ ...prev, familiar: prev.familiar + 1 }));
      } else if (rating === 'MASTERED') {
        status = 'MASTERED';
        numericRating = 4;
        setStats((prev) => ({ ...prev, mastered: prev.mastered + 1 }));
      }

      // Ghi nhận SRS đánh giá & cập nhật trạng thái học
      vocabularyService.recordReview(currentWord.id, numericRating).catch(() => { });
      vocabularyService.updateStatus(currentWord.id, status).catch(() => { });

      // Sang từ tiếp theo
      handleNext();
    },
    [currentWord, handleNext]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrev]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ display: 'grid', placeItems: 'center', height: '60vh', color: '#64748b' }}>
          Đang tải dữ liệu Flashcard bài {currentLesson}...
        </div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className={styles.page}>
        <div style={{ display: 'grid', placeItems: 'center', height: '60vh', textAlign: 'center' }}>
          <h3>Không tìm thấy từ vựng cho bài học này</h3>
          <button className={styles.navBtn} onClick={() => navigate(`/vocabulary/hsk${numericLevel}`)}>
            Quay lại danh sách bài học
          </button>
        </div>
      </div>
    );
  }

  // Màn hình hoàn thành
  if (completed) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.headerLeft}>
              <Link to={`${basePath}/lesson/${currentLesson}`} className={styles.iconBtn}>
                ✕
              </Link>
              <div className={styles.breadcrumbs}>
                <Link to={isHsk3 ? "/vocabulary/hsk3" : "/vocabulary/hsk2"} className={styles.crumbLink}>
                  Từ vựng {isHsk3 ? 'HSK 3.0' : 'HSK 2.0'}
                </Link>
                <span>/</span>
                <Link to={basePath} className={styles.crumbLink}>HSK {numericLevel}</Link>
                <span>/</span>
                <span>Bài {currentLesson}</span>
              </div>
            </div>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.completedBox}>
            <div className={styles.congratsIcon}>🎉</div>
            <h2 className={styles.completedTitle}>Hoàn thành bài học!</h2>
            <p className={styles.completedDesc}>
              Bạn đã ôn tập xong tất cả {words.length} thẻ từ vựng của HSK {numericLevel} - Bài {currentLesson}.
            </p>

            <div className={styles.completedActions}>
              <Link
                to={`${basePath}/lesson/${currentLesson}/exercise`}
                className={styles.primaryAction}
              >
                Luyện bài tập củng cố
              </Link>
              <button
                className={styles.secondaryAction}
                onClick={() => {
                  setCompleted(false);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                  setStats({ forgot: 0, familiar: 0, mastered: 0 });
                }}
              >
                Học lại bài này
              </button>
              <Link
                to={`${basePath}/lesson/${currentLesson}`}
                className={styles.secondaryAction}
              >
                Xem danh sách từ
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const progressPercent = ((currentIndex + 1) / words.length) * 100;

  return (
    <div className={styles.page}>
      {/* Header Bar */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <Link
              to={`${basePath}/lesson/${currentLesson}`}
              className={styles.iconBtn}
              title="Quay lại chi tiết bài học"
            >
              ✕
            </Link>
            <div className={styles.breadcrumbs}>
              <Link to={isHsk3 ? "/vocabulary/hsk3" : "/vocabulary/hsk2"} className={styles.crumbLink}>
                Từ vựng {isHsk3 ? 'HSK 3.0' : 'HSK 2.0'}
              </Link>
              <span>/</span>
              <Link to={basePath} className={styles.crumbLink}>HSK {numericLevel}</Link>
              <span>/</span>
              <Link to={`${basePath}/lesson/${currentLesson}`} className={styles.crumbLink}>
                Bài {currentLesson}
              </Link>
              <span>/</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>Flashcard</span>
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.counterBadge}>
              {currentIndex + 1} / {words.length}
            </div>
          </div>
        </div>
      </header>

      {/* Main Study Screen */}
      <main className={styles.main}>
        {/* Progress Bar */}
        <div className={styles.progressTrack}>
          <div className={styles.progressBar} style={{ width: `${progressPercent}%` }} />
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolGroup}>
            <button
              className={`${styles.toolBtn} ${autoPlayAudio ? styles.toolBtnActive : ''}`}
              onClick={() => setAutoPlayAudio((prev) => !prev)}
              title="Tự động phát âm khi lật thẻ"
            >
              {autoPlayAudio ? '🔊 Tự phát âm: Bật' : '🔈 Tự phát âm: Tắt'}
            </button>
            <button
              className={`${styles.toolBtn} ${showPinyinFront ? styles.toolBtnActive : ''}`}
              onClick={() => setShowPinyinFront((prev) => !prev)}
              title="Ẩn / hiện pinyin ở mặt trước"
            >
              {showPinyinFront ? 'Pinyin: Hiện' : 'Pinyin: Ẩn'}
            </button>
          </div>

          <div className={styles.toolGroup}>
            <button className={styles.toolBtn} onClick={handleShuffle} title="Xáo trộn ngẫu nhiên thứ tự thẻ">
              🔀 Xáo trộn
            </button>
          </div>
        </div>

        {/* 3D Flip Card Container */}
        <div className={styles.cardScene} onClick={handleFlip}>
          <div className={`${styles.cardInner} ${isFlipped ? styles.flipped : ''}`}>
            {/* Mặt trước */}
            <div className={`${styles.cardFace} ${styles.frontFace}`}>
              <div className={styles.cardHeaderTop}>
                <span className={`${styles.statusBadge} ${currentWord.userStatus === 'MASTERED'
                    ? styles.mastered
                    : currentWord.userStatus === 'LEARNING'
                      ? styles.learning
                      : styles.newWord
                  }`}>
                  {currentWord.userStatus === 'MASTERED'
                    ? 'Đã thuộc'
                    : currentWord.userStatus === 'LEARNING'
                      ? 'Đang học'
                      : 'Từ mới'}
                </span>

                <button
                  className={styles.audioPlayBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    playChineseAudio(currentWord.hanzi, currentWord.audioPath);
                  }}
                  title="Nghe phát âm"
                >
                  🔊
                </button>
              </div>

              <div className={styles.hanziBig}>{currentWord.hanzi}</div>

              {showPinyinFront ? (
                <div className={styles.pinyinFront}>{currentWord.pinyin}</div>
              ) : (
                <div className={styles.pinyinPlaceholder}>[Bấm để xem Pinyin & Nghĩa]</div>
              )}

              <div className={styles.flipHint}>
                <span>Bấm vào thẻ hoặc phím [Space] để lật</span>
                <span>↷</span>
              </div>
            </div>

            {/* Mặt sau */}
            <div className={`${styles.cardFace} ${styles.backFace}`}>
              <div className={styles.backHeader}>
                <div className={styles.backMainWord}>
                  <span className={styles.hanziMedium}>{currentWord.hanzi}</span>
                  <span className={styles.pinyinBack}>{currentWord.pinyin}</span>
                  {currentWord.hanViet && (
                    <span className={styles.hanVietBack}>Hán Việt: {currentWord.hanViet}</span>
                  )}
                </div>

                <button
                  className={styles.audioPlayBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    playChineseAudio(currentWord.hanzi, currentWord.audioPath);
                  }}
                  title="Nghe phát âm"
                >
                  🔊
                </button>
              </div>

              <div className={styles.meaningBlock}>
                {currentWord.pos && <span className={styles.posTag}>{currentWord.pos}</span>}
                <span className={styles.meaningVi}>{currentWord.meaningVi}</span>
              </div>

              {/* Collocations */}
              {currentWord.collocations && currentWord.collocations.length > 0 && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionTitle}>Cụm từ ghép thường gặp</div>
                  <div className={styles.collocList}>
                    {currentWord.collocations.map((c, i) => (
                      <div key={i} className={styles.collocChip}>
                        <span className={styles.collocZh}>{c.text}</span>
                        {c.meaningVi && <span className={styles.collocVi}>— {c.meaningVi}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Examples */}
              {currentWord.examples && currentWord.examples.length > 0 && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionTitle}>Câu ví dụ</div>
                  {currentWord.examples.map((ex, i) => (
                    <div key={i} className={styles.exampleItem}>
                      <div className={styles.exampleTexts}>
                        <div className={styles.exampleZh}>{ex.zh}</div>
                        <div className={styles.exampleVi}>{ex.vi}</div>
                      </div>
                      <button
                        className={styles.miniAudioBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          playChineseAudio(ex.zh, ex.audioPath);
                        }}
                        title="Nghe câu ví dụ"
                      >
                        🔊
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Area: Navigation */}
        <div className={styles.bottomArea}>
          <div className={styles.navRow}>
            <button className={styles.navBtn} onClick={handlePrev} disabled={currentIndex === 0}>
              ← Thẻ trước
            </button>

            <button className={styles.navBtn} onClick={handleNext}>
              {currentIndex === words.length - 1 ? 'Hoàn thành' : 'Thẻ tiếp →'}
            </button>
          </div>

          <div className={styles.shortcutHint}>
            Phím tắt: [Space / Click vào thẻ] Lật thẻ • [← / →] Thẻ trước / Thẻ tiếp
          </div>
        </div>
      </main>
    </div>
  );
}
