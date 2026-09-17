import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { getLevelConfig, formatPos } from '../data/vocabData';
import { vocabularyService } from '../services/vocabularyService';
import { playChineseAudio } from '../utils/audioPlayer';
import HanziWriterModal from '../components/HanziWriter/HanziWriterModal';
import styles from './LessonDetail.module.css';

/**
 * Làm nổi bật từ vựng mục tiêu trong câu ví dụ bằng màu đỏ nhạt
 */
function renderHighlightedZh(text, targetWord, highlightClass) {
  if (!text || !targetWord) return text;
  const escaped = targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'g');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part === targetWord) {
      return (
        <span key={index} className={highlightClass}>
          {part}
        </span>
      );
    }
    return part;
  });
}

export default function LessonDetail() {
  const { level: levelParam, lessonNumber: lessonNumberParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isHsk3 = location.pathname.includes('/hsk3');
  const hskVersionParam = isHsk3 ? 'HSK_3' : 'HSK_2';
  const versionSlug = isHsk3 ? 'hsk3' : 'hsk2';

  const currentLevel = getLevelConfig(levelParam || '1');
  const lessonNumber = parseInt(lessonNumberParam, 10) || 1;

  const basePath = `/vocabulary/${versionSlug}/${currentLevel.slug}`;

  const [lessonData, setLessonData] = useState(null);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interactivity state
  const [sortOption, setSortOption] = useState('DEFAULT'); // 'DEFAULT' | 'AZ_HANZI' | 'AZ_PINYIN' | 'UNLEARNED_FIRST' | 'STARRED_FIRST'
  const [maskAll, setMaskAll] = useState(false);
  const [maskedMap, setMaskedMap] = useState({});
  const [playingWordId, setPlayingWordId] = useState(null);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [showStudyMenu, setShowStudyMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [writingWordIndex, setWritingWordIndex] = useState(null);

  const menuRef = useRef(null);

  // Fetch words
  useEffect(() => {
    let isMounted = true;
    async function fetchWords() {
      try {
        setLoading(true);
        setError(null);
        const res = await vocabularyService.getWordsByLesson(currentLevel.id, lessonNumber, 50, hskVersionParam);
        if (isMounted) {
          if (res && res.result) {
            setLessonData(res.result);
            const token = localStorage.getItem('token');
            let localPins = {};
            if (token) {
              try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const key = `sun_hsk_pinned_${user.id || 'auth'}`;
                localPins = JSON.parse(localStorage.getItem(key) || '{}');
              } catch (e) { }
            }

            const mergedWords = (res.result.words || []).map((w) => ({
              ...w,
              inReviewList: token ? (localPins[w.id] !== undefined ? localPins[w.id] : Boolean(w.inReviewList)) : false
            }));
            setWords(mergedWords);
          } else {
            setLessonData(null);
            setWords([]);
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải từ vựng bài học:', err);
        if (isMounted) {
          setError('Không thể tải từ vựng của bài học này. Vui lòng thử lại sau.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchWords();
    return () => {
      isMounted = false;
    };
  }, [currentLevel.id, lessonNumber, hskVersionParam]);

  // Click outside listener for dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowStudyMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard Spacebar listener to toggle mask
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setMaskAll((prev) => !prev);
        setToast(maskAll ? 'Đã hiện tất cả nghĩa' : 'Đã ẩn tất cả nghĩa (Click vào thẻ để xem)');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [maskAll]);

  const setToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Phát âm từ vựng
  const handlePlayWord = (word) => {
    setPlayingWordId(word.id);
    playChineseAudio(word.hanzi, word.audioPath, () => {
      setPlayingWordId(null);
    });
  };

  // Ghim ôn tập
  const handleToggleReview = async (word) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setToast('⚠️ Vui lòng đăng nhập để sử dụng tính năng ghim từ ôn tập!');
      return;
    }

    const nextState = !word.inReviewList;
    setWords((prev) =>
      prev.map((w) => (w.id === word.id ? { ...w, inReviewList: nextState } : w))
    );
    setToast(nextState ? `Đã ghim "${word.hanzi}" vào danh sách ôn tập` : `Đã bỏ ghim "${word.hanzi}"`);

    // Lưu local
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const key = `sun_hsk_pinned_${user.id || 'auth'}`;
      const localPins = JSON.parse(localStorage.getItem(key) || '{}');
      localPins[word.id] = nextState;
      localStorage.setItem(key, JSON.stringify(localPins));
    } catch (e) { }

    // Đồng bộ backend
    try {
      await vocabularyService.toggleReviewList(word.id, nextState);
    } catch (err) {
      console.error('Lỗi khi ghim từ:', err);
    }
  };

  // Cập nhật trạng thái học tập
  const handleStatusChange = async (wordId, status) => {
    const token = localStorage.getItem('token');
    const word = words.find((w) => w.id === wordId);

    setWords((prev) =>
      prev.map((w) => (w.id === wordId ? { ...w, userStatus: status } : w))
    );

    const labelMap = {
      NEW: 'Chưa học',
      LEARNING: 'Đang học',
      REVIEWING: 'Đang ôn',
      MASTERED: 'Đã thuộc'
    };

    if (!token) {
      setToast(`Đã chuyển "${word?.hanzi || ''}" sang: ${labelMap[status] || status} (Đăng nhập để lưu tiến độ)`);
      return;
    }

    setToast(`Đã chuyển "${word?.hanzi || ''}" sang: ${labelMap[status] || status}`);

    try {
      await vocabularyService.updateStatus(wordId, status);
    } catch (err) {
      console.error('Lỗi update status:', err);
    }
  };

  // Chuyển đổi nhanh trạng thái: Chưa học -> Đang học -> Đã thuộc -> Chưa học
  const handleCycleStatus = (word) => {
    const current = word.userStatus || 'NEW';
    let nextStatus = 'LEARNING';
    if (current === 'NEW') nextStatus = 'LEARNING';
    else if (current === 'LEARNING' || current === 'REVIEWING') nextStatus = 'MASTERED';
    else if (current === 'MASTERED') nextStatus = 'NEW';
    handleStatusChange(word.id, nextStatus);
  };

  // Ẩn / hiện nghĩa của 1 từ
  const toggleCardMask = (wordId) => {
    setMaskedMap((prev) => ({
      ...prev,
      [wordId]: prev[wordId] === undefined ? !maskAll : !prev[wordId]
    }));
  };

  // Phát âm toàn bộ bài học tuần tự
  const handlePlayAll = () => {
    if (isPlayingAll || words.length === 0) return;
    setIsPlayingAll(true);
    let idx = 0;

    const playNext = () => {
      if (idx >= words.length) {
        setIsPlayingAll(false);
        setPlayingWordId(null);
        return;
      }
      const item = words[idx];
      setPlayingWordId(item.id);
      idx++;
      playChineseAudio(item.hanzi, item.audioPath, () => {
        setTimeout(playNext, 500);
      });
    };

    playNext();
  };

  // Số liệu thống kê
  const learnedCount = words.filter((w) => w.userStatus && w.userStatus !== 'NEW').length;
  const newCount = words.filter((w) => !w.userStatus || w.userStatus === 'NEW').length;
  const bookmarkedCount = words.filter((w) => w.inReviewList).length;

  // Sắp xếp danh sách từ vựng
  const processedWords = useMemo(() => {
    let list = [...words];

    // Sắp xếp
    if (sortOption === 'AZ_HANZI') {
      list.sort((a, b) => (a.hanzi || '').localeCompare(b.hanzi || '', 'zh'));
    } else if (sortOption === 'AZ_PINYIN') {
      list.sort((a, b) => (a.pinyin || '').localeCompare(b.pinyin || ''));
    } else if (sortOption === 'UNLEARNED_FIRST') {
      list.sort((a, b) => {
        const aVal = a.userStatus === 'MASTERED' ? 2 : a.userStatus === 'LEARNING' ? 1 : 0;
        const bVal = b.userStatus === 'MASTERED' ? 2 : b.userStatus === 'LEARNING' ? 1 : 0;
        return aVal - bVal;
      });
    } else if (sortOption === 'STARRED_FIRST') {
      list.sort((a, b) => (b.inReviewList ? 1 : 0) - (a.inReviewList ? 1 : 0));
    }

    return list;
  }, [words, sortOption]);

  const totalLessons = lessonData?.totalLessons || 1;
  const lessonTitle = lessonData?.lessonTitle || `Bài ${lessonNumber}`;

  return (
    <div className={styles.page}>
      {/* Header Bar */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <button
              className={styles.iconBtn}
              onClick={() => navigate(basePath)}
              aria-label="Quay lại danh sách bài học"
              title="Quay lại danh sách bài học"
            >
              ×
            </button>
            <Link to="/" className={styles.brand}>
              <span className={styles.brandMark}>汉</span>
              <span className={styles.brandText}>Sun HSK</span>
            </Link>
            <div className={styles.headerBreadcrumbs}>
              <Link to={isHsk3 ? "/vocabulary/hsk3" : "/vocabulary/hsk2"} className={styles.crumbLink}>
                Từ vựng {isHsk3 ? 'HSK 3.0' : 'HSK 2.0'}
              </Link>
              <span>/</span>
              <Link to={basePath} className={styles.crumbLink}>{currentLevel.label}</Link>
              <span>/</span>
              <span>Bài {lessonNumber}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Title */}
        <h1 className={styles.title}>
          {currentLevel.label} - Bài {lessonNumber} - {lessonTitle}
        </h1>

        {/* Actions Button Row */}
        <div className={styles.actions}>
          <div className={styles.study} ref={menuRef}>
            <button
              className={styles.studyMain}
              onClick={() => navigate(`${basePath}/lesson/${lessonNumber}/flashcard`)}
              title="Bắt đầu học từ vựng bằng thẻ Flashcard"
            >
              ⚡ Học Flashcard
            </button>
            <button
              className={styles.studyMore}
              onClick={() => setShowStudyMenu((prev) => !prev)}
              aria-label="Thêm lựa chọn"
            >
              ⌄
            </button>

            {/* Dropdown menu */}
            {showStudyMenu && (
              <div className={styles.studyDropdown}>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    setShowStudyMenu(false);
                    navigate(`${basePath}/lesson/${lessonNumber}/flashcard`);
                  }}
                >
                  🎴 Học theo Flashcard (SRS)
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    setShowStudyMenu(false);
                    navigate(`${basePath}/lesson/${lessonNumber}/exercise`);
                  }}
                >
                  ✏️ Luyện bài tập từ vựng
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    setShowStudyMenu(false);
                    handlePlayAll();
                  }}
                >
                  🎧 Nghe phát âm toàn bộ bài
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    setShowStudyMenu(false);
                    setSortOption('STARRED_FIRST');
                  }}
                >
                  ⭐ Ưu tiên từ đã ghim
                </button>
              </div>
            )}
          </div>

          {/* Luyện bài tập */}
          <button
            type="button"
            className={styles.playAllBtn}
            onClick={() => navigate(`${basePath}/lesson/${lessonNumber}/exercise`)}
            title="Luyện bài tập điền từ, sắp xếp câu và nghe"
            style={{ fontWeight: 600, color: '#1d4ed8', borderColor: '#93c5fd', background: '#eff6ff' }}
          >
            ✏️ Luyện bài tập
          </button>

          {/* Nghe tất cả */}
          <button
            type="button"
            className={`${styles.playAllBtn} ${isPlayingAll ? styles.playingActive : ''}`}
            onClick={handlePlayAll}
            disabled={isPlayingAll || words.length === 0}
            title="Phát âm toàn bộ danh sách"
          >
            {isPlayingAll ? '🔊 Đang đọc...' : '🔈 Nghe tất cả'}
          </button>
        </div>

        {/* Status Tags */}
        <div className={styles.status}>
          <span className={`${styles.tag} ${styles.tagSuccess}`}>
            ✓ {learnedCount} từ đã học
          </span>
          <span className={`${styles.tag} ${styles.tagNeutral}`}>
            {newCount > 0 ? `${newCount} từ mới` : 'Không còn từ mới'}
          </span>
          {bookmarkedCount > 0 && (
            <span className={`${styles.tag} ${styles.tagBookmark}`}>
              ⭐ {bookmarkedCount} từ ghim ôn tập
            </span>
          )}
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <h2 className={styles.listTitle}>
            Danh sách từ <span className={styles.totalWordsBadge}>({words.length})</span>
          </h2>

          <div className={styles.toolbarRight}>
            {/* Toggle Ẩn / Hiện nghĩa */}
            <button
              type="button"
              className={`${styles.maskToggleBtn} ${maskAll ? styles.maskActive : ''}`}
              onClick={() => {
                const next = !maskAll;
                setMaskAll(next);
                setMaskedMap({});
                setToast(next ? 'Đã ẩn nghĩa tiếng Việt' : 'Đã hiện nghĩa tiếng Việt');
              }}
              title="Ẩn nghĩa để tự kiểm tra trí nhớ"
            >
              {maskAll ? '👁️ Đang ẩn nghĩa' : '👁️ Ẩn nghĩa'}
            </button>

            {/* Sort Select */}
            <select
              className={styles.sortSelect}
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              aria-label="Sắp xếp danh sách từ"
            >
              <option value="DEFAULT">Thứ tự mặc định</option>
              <option value="AZ_HANZI">Chữ Hán (A → Z)</option>
              <option value="AZ_PINYIN">Pinyin (A → Z)</option>
              <option value="UNLEARNED_FIRST">Từ chưa thuộc trước</option>
              <option value="STARRED_FIRST">Từ đã ghim trước</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#667085' }}>
            Đang tải danh sách từ vựng...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#e14c4c' }}>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Cards List */}
        {!loading && !error && processedWords.length > 0 && (
          <div className={styles.cardsList}>
            {processedWords.map((word, wordIndex) => {
              const isMasked = maskedMap[word.id] !== undefined ? maskedMap[word.id] : maskAll;

              // Gộp câu ví dụ và cụm từ (làm ví dụ 2) thành danh sách câu ví dụ nối tiếp
              const combinedExamples = [];
              if (word.examples && word.examples.length > 0) {
                word.examples.forEach((ex) => {
                  if (ex && ex.zh && ex.zh.trim()) {
                    combinedExamples.push({
                      zh: ex.zh.trim(),
                      vi: ex.vi ? ex.vi.trim() : '',
                      audioPath: ex.audioPath
                    });
                  }
                });
              }

              if (word.collocations && word.collocations.length > 0) {
                word.collocations.forEach((c) => {
                  if (c && c.text) {
                    let cleanText = c.text.trim();
                    let cleanMeaning = c.meaningVi ? c.meaningVi.trim() : '';

                    // Bỏ phần mở ngoặc lỗi nếu có
                    const parenMatch = cleanText.match(/^(.+?)[(（](.*)$/);
                    if (parenMatch) {
                      cleanText = parenMatch[1].trim();
                      if (!cleanMeaning && parenMatch[2]) {
                        cleanMeaning = parenMatch[2].replace(/[)）]/g, '').trim();
                      }
                    }

                    // Phải có chữ Hán
                    const hasHanzi = /[\u4e00-\u9fa5]/.test(cleanText);
                    if (!hasHanzi) return;

                    // Chuẩn hóa để so sánh trùng lặp (loại bỏ dấu câu và khoảng trắng)
                    const normalizeZh = (s) => (s || '').replace(/[\s\p{P}]/gu, '');
                    const normClean = normalizeZh(cleanText);

                    const isDup = combinedExamples.some((e) => {
                      const normEx = normalizeZh(e.zh);
                      return normEx === normClean || normEx.includes(normClean) || normClean.includes(normEx);
                    });

                    if (!isDup && cleanText) {
                      combinedExamples.push({
                        zh: cleanText,
                        vi: cleanMeaning,
                        audioPath: null
                      });
                    }
                  }
                });
              }

              return (
                <section key={word.id} className={styles.card}>
                  {/* Card Top */}
                  <div className={styles.cardTop}>
                    <div className={styles.termInfo}>
                      <div className={styles.termRow}>
                        <h2 className={styles.term}>{word.hanzi}</h2>
                        {word.pos && <span className={styles.posTag}>{formatPos(word.pos)}</span>}
                      </div>
                      <p className={styles.pronounce}>{word.pinyin}</p>
                    </div>

                    <div className={styles.topActions}>
                      {/* Trạng thái học tập */}
                      <button
                        type="button"
                        className={`${styles.statusBadgeBtn} ${
                          word.userStatus === 'MASTERED'
                            ? styles.statusBadgeMastered
                            : word.userStatus === 'REVIEWING'
                            ? styles.statusBadgeReviewing
                            : word.userStatus === 'LEARNING'
                            ? styles.statusBadgeLearning
                            : styles.statusBadgeNew
                        }`}
                        onClick={() => handleCycleStatus(word)}
                        title="Click để đổi trạng thái học tập (Chưa học → Đang học → Đã thuộc)"
                      >
                        {word.userStatus === 'MASTERED' && '✓ Đã thuộc'}
                        {word.userStatus === 'REVIEWING' && '🔄 Đang ôn'}
                        {word.userStatus === 'LEARNING' && '📖 Đang học'}
                        {(!word.userStatus || word.userStatus === 'NEW') && '○ Chưa học'}
                      </button>

                      <button
                        className={`${styles.audio} ${playingWordId === word.id ? styles.audioActive : ''}`}
                        onClick={() => handlePlayWord(word)}
                        aria-label="Phát âm"
                        title="Phát âm"
                      >
                        {playingWordId === word.id ? '🔊' : '🔈'}
                      </button>
                      <button
                        className={`${styles.starBtn} ${word.inReviewList ? styles.starBookmarked : ''}`}
                        onClick={() => handleToggleReview(word)}
                        aria-label="Ghim ôn tập"
                        title={word.inReviewList ? 'Đã ghim ôn tập' : 'Ghim ôn tập'}
                      >
                        {word.inReviewList ? '⭐' : '☆'}
                      </button>

                      <button
                        type="button"
                        className={styles.writePracticeBtn}
                        onClick={() => setWritingWordIndex(wordIndex)}
                        aria-label="Luyện viết chữ Hán"
                        title="Luyện viết chữ Hán"
                      >
                        ✍️
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className={styles.cardBody}>
                    <div className={styles.definition}>
                      <p className={styles.eyebrow}>Định nghĩa &amp; Ý nghĩa</p>
                      <p
                        className={`${styles.meaning} ${isMasked ? styles.meaningMasked : ''}`}
                        onClick={() => toggleCardMask(word.id)}
                        title={isMasked ? 'Click để xem nghĩa' : ''}
                      >
                        {word.meaningVi}
                      </p>

                      {/* Danh sách các câu ví dụ nối tiếp nhau */}
                      {combinedExamples.length > 0 && (
                        <div className={styles.examplesContainer}>
                          {combinedExamples.map((ex, idx) => (
                            <div key={idx} className={styles.exampleItem}>
                              <div className={styles.exampleZhRow}>
                                <span className={styles.exampleNumber}>
                                  {combinedExamples.length > 1 ? `Ví dụ ${idx + 1}:` : 'Ví dụ:'}
                                </span>
                                <span className={styles.exampleZh}>
                                  {renderHighlightedZh(ex.zh, word.hanzi, styles.highlightWord)}
                                </span>
                                <button
                                  type="button"
                                  className={styles.exampleAudioBtn}
                                  onClick={() => playChineseAudio(ex.zh, ex.audioPath)}
                                  title="Nghe câu ví dụ"
                                  aria-label="Nghe câu ví dụ"
                                >
                                  🔊
                                </button>
                              </div>
                              {ex.vi && (
                                <div className={styles.exampleViRow}>
                                  <span className={styles.exampleViText}>{ex.vi}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right column: Khung minh họa (bỏ xám xung quanh, để lại mỗi khung) */}
                    <div className={styles.imageCol} aria-label="Khung minh họa">
                      <div className={styles.imageBox}>
                        {word.imageUrl || word.image ? (
                          <img
                            src={word.imageUrl || word.image}
                            alt={word.hanzi}
                            className={styles.cardImg}
                          />
                        ) : (
                          <>
                            <div className={styles.hanziArt}>{word.hanzi}</div>
                            <div className={styles.pinyinArt}>{word.pinyin}</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}


        {/* Bottom Nav */}
        <div className={styles.bottomNav}>
          {lessonNumber > 1 ? (
            <button
              className={styles.navBtn}
              onClick={() => navigate(`${basePath}/lesson/${lessonNumber - 1}`)}
            >
              ← Bài trước ({lessonNumber - 1})
            </button>
          ) : <div />}

          <Link
            to={basePath}
            className={styles.backLink}
          >
            Quay lại danh sách bài học {currentLevel.label}
          </Link>

          {lessonNumber < totalLessons ? (
            <button
              className={styles.navBtn}
              onClick={() => navigate(`${basePath}/lesson/${lessonNumber + 1}`)}
            >
              Bài tiếp theo ({lessonNumber + 1}) →
            </button>
          ) : <div />}
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className={styles.toast}>
          {toastMessage}
        </div>
      )}

      {/* Hanzi Writer Calligraphy Modal */}
      {writingWordIndex !== null && processedWords[writingWordIndex] && (
        <HanziWriterModal
          word={processedWords[writingWordIndex]}
          words={processedWords}
          currentIndex={writingWordIndex}
          onClose={() => setWritingWordIndex(null)}
          onNavigate={(newIndex) => setWritingWordIndex(newIndex)}
        />
      )}
    </div>
  );
}
