import React, { useState, useMemo, useRef, useEffect } from 'react';
import HanziCanvas from './HanziCanvas';
import styles from './HanziWriter.module.css';

/**
 * HanziWordWriter component
 * Manages multi-character words, mode toggling, grid styles, and practice feedback
 */
export default function HanziWordWriter({
  word,
  onWordComplete,
}) {
  // Extract individual Chinese characters from word.hanzi
  const characters = useMemo(() => {
    if (!word?.hanzi) return [];
    const matches = word.hanzi.match(/[\u4e00-\u9fa5]/g);
    if (matches && matches.length > 0) return matches;
    return [word.hanzi];
  }, [word?.hanzi]);

  const [activeCharIndex, setActiveCharIndex] = useState(0);
  const [mode, setMode] = useState('animate'); // 'animate' | 'quiz'
  const [gridType, setGridType] = useState('mige'); // 'mige' | 'tiange' | 'none'
  const [showOutline, setShowOutline] = useState(true);
  const [speed, setSpeed] = useState(1.0);
  const [isLooping, setIsLooping] = useState(false);

  // Practice progress
  const [completedChars, setCompletedChars] = useState({});
  const [strokeCountMap, setStrokeCountMap] = useState({});
  const [currentProgress, setCurrentProgress] = useState({
    strokeNum: 0,
    mistakes: 0,
    statusText: '',
  });
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);

  const canvasRef = useRef(null);

  // Reset states when word changes
  useEffect(() => {
    setActiveCharIndex(0);
    setCompletedChars({});
    setCurrentProgress({ strokeNum: 0, mistakes: 0, statusText: '' });
    setIsQuizCompleted(false);
    setIsLooping(false);
  }, [word?.id, word?.hanzi]);

  const currentChar = characters[activeCharIndex] || '';

  // Handle switching character tabs
  const handleSelectChar = (index) => {
    setActiveCharIndex(index);
    setCurrentProgress({ strokeNum: 0, mistakes: 0, statusText: '' });
    setIsQuizCompleted(!!completedChars[index]);
    setIsLooping(false);
  };

  // Replay animation
  const handleReplay = () => {
    setIsLooping(false);
    if (canvasRef.current) {
      canvasRef.current.replay();
    }
  };

  // Toggle animation loop
  const handleToggleLoop = () => {
    if (isLooping) {
      setIsLooping(false);
      if (canvasRef.current) {
        canvasRef.current.replay();
      }
    } else {
      setIsLooping(true);
      if (canvasRef.current) {
        canvasRef.current.loop();
      }
    }
  };

  // Reset quiz for current character
  const handleResetQuiz = () => {
    setIsQuizCompleted(false);
    setCurrentProgress({ strokeNum: 0, mistakes: 0, statusText: 'Bắt đầu viết nét đầu tiên...' });
    if (canvasRef.current) {
      canvasRef.current.startQuiz();
    }
  };

  // Mode change handler
  const handleModeChange = (newMode) => {
    setMode(newMode);
    setIsLooping(false);
    if (newMode === 'quiz') {
      setIsQuizCompleted(false);
      setCurrentProgress({ strokeNum: 0, mistakes: 0, statusText: 'Dùng chuột hoặc ngón tay để vẽ theo nét...' });
    } else {
      setCurrentProgress({ strokeNum: 0, mistakes: 0, statusText: '' });
    }
  };

  // HanziWriter callbacks
  const handleStrokesLoaded = (totalStrokes) => {
    setStrokeCountMap((prev) => ({
      ...prev,
      [activeCharIndex]: totalStrokes,
    }));
  };

  const handleCorrectStroke = (data) => {
    const totalStrokes = strokeCountMap[activeCharIndex] || (data.strokeNum + data.strokesRemaining);
    setCurrentProgress((prev) => ({
      ...prev,
      strokeNum: data.strokeNum + 1,
      statusText: `Đúng rồi! Nét ${data.strokeNum + 1}/${totalStrokes} ✨`,
    }));
  };

  const handleMistake = (data) => {
    setCurrentProgress((prev) => ({
      ...prev,
      mistakes: data.totalMistakes,
      statusText: data.mistakesOnStroke >= 2
        ? 'Sai 3 lần sẽ có gợi ý nét màu vàng 💡'
        : 'Chưa đúng, hãy thử lại nét này!',
    }));
  };

  const handleCharacterComplete = (result) => {
    if (result.mode === 'quiz') {
      setIsQuizCompleted(true);
      setCompletedChars((prev) => {
        const next = { ...prev, [activeCharIndex]: true };
        // Check if all characters in this word are done
        const allDone = characters.every((_, idx) => idx === activeCharIndex || next[idx]);
        if (allDone && onWordComplete) {
          onWordComplete(word);
        }
        return next;
      });

      setCurrentProgress((prev) => ({
        ...prev,
        statusText: `Hoàn thành chữ "${currentChar}"!`,
      }));
    }
  };

  const totalStrokesForCurrent = strokeCountMap[activeCharIndex] || null;

  return (
    <div className={styles.wordWriterContainer}>
      {/* Multi-Character Navigation Tabs */}
      {characters.length > 1 && (
        <div className={styles.charTabsRow}>
          <span className={styles.charTabsLabel}>Chọn chữ Hán:</span>
          <div className={styles.charTabsList}>
            {characters.map((ch, idx) => {
              const isCompleted = !!completedChars[idx];
              const isActive = idx === activeCharIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  className={`${styles.charTabBtn} ${isActive ? styles.charTabBtnActive : ''} ${isCompleted ? styles.charTabBtnCompleted : ''
                    }`}
                  onClick={() => handleSelectChar(idx)}
                >
                  <span className={styles.charTabText}>{ch}</span>
                  {isCompleted && <span className={styles.charTabCheck}>✓</span>}
                  <span className={styles.charTabOrder}>#{idx + 1}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Mode Toggle: Animate vs Quiz */}
      <div className={styles.modeToggleGroup}>
        <button
          type="button"
          className={`${styles.modeBtn} ${mode === 'animate' ? styles.modeBtnActive : ''}`}
          onClick={() => handleModeChange('animate')}
        >
          <span>Xem thứ tự nét</span>
        </button>
        <button
          type="button"
          className={`${styles.modeBtn} ${mode === 'quiz' ? styles.modeBtnActive : ''}`}
          onClick={() => handleModeChange('quiz')}
        >
          <span>Tự luyện viết</span>
        </button>
      </div>

      {/* Canvas Area with Calligraphy Grid */}
      <div className={styles.canvasCenterArea}>
        <HanziCanvas
          ref={canvasRef}
          character={currentChar}
          mode={mode}
          gridType={gridType}
          showOutline={showOutline}
          speed={speed}
          size={270}
          onComplete={handleCharacterComplete}
          onCorrectStroke={handleCorrectStroke}
          onMistake={handleMistake}
          onStrokesLoaded={handleStrokesLoaded}
        />

        {/* Character Info Chips Under Canvas */}
        <div className={styles.canvasMetaChips}>
          <span className={styles.metaChip}>
            Chữ: <strong>{currentChar}</strong>
          </span>
          {totalStrokesForCurrent && (
            <span className={styles.metaChip}>
              Số nét: <strong>{totalStrokesForCurrent} nét</strong>
            </span>
          )}
          <span className={`${styles.metaChip} ${styles.radicalChip}`} title="Bộ thủ được tô màu xanh lá">
            🟢 Bộ thủ tô xanh
          </span>
        </div>
      </div>

      {/* Real-Time Quiz Feedback & Progress */}
      {mode === 'quiz' && (
        <div className={styles.quizStatusBar}>
          <div className={styles.quizStatusLeft}>
            <span className={styles.quizStatusMsg}>
              {currentProgress.statusText || 'Bắt đầu viết nét đầu tiên...'}
            </span>
            {currentProgress.mistakes > 0 && (
              <span className={styles.mistakesBadge}>
                ⚠️ Số lỗi: {currentProgress.mistakes}
              </span>
            )}
          </div>

          {isQuizCompleted && (
            <div className={styles.quizSuccessBox}>
              <span className={styles.quizSuccessEmoji}>🎉</span>
              <span>Xuất sắc! Viết đúng chữ {currentChar}</span>
              {activeCharIndex < characters.length - 1 && (
                <button
                  type="button"
                  className={styles.nextCharBtn}
                  onClick={() => handleSelectChar(activeCharIndex + 1)}
                >
                  Viết chữ tiếp theo ({characters[activeCharIndex + 1]}) →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Interactive Controls Toolbar */}
      <div className={styles.controlsToolbar}>
        {/* Action Controls Depending on Mode */}
        <div className={styles.actionBtnsGroup}>
          {mode === 'animate' ? (
            <>
              <button
                type="button"
                className={`${styles.toolBtn} ${styles.toolBtnPrimary}`}
                onClick={handleReplay}
                title="Phát lại mẫu nét chữ từ đầu"
              >
                <svg
                  className={styles.toolIcon}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <polygon points="6 3 20 12 6 21 6 3" />
                </svg>
                <span>Phát lại</span>
              </button>
              <button
                type="button"
                className={`${styles.toolBtn} ${isLooping ? styles.toolBtnActive : ''}`}
                onClick={handleToggleLoop}
                title="Lặp lại diễn hoạt liên tục"
              >
                <svg
                  className={`${styles.toolIcon} ${isLooping ? styles.toolIconSpin : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 21h5v-5" />
                </svg>
                <span>{isLooping ? 'Đang lặp' : 'Lặp lại'}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              className={`${styles.toolBtn} ${styles.toolBtnPrimary}`}
              onClick={handleResetQuiz}
              title="Xóa để viết lại chữ này"
            >
              <svg
                className={styles.toolIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>Viết lại</span>
            </button>
          )}
        </div>

        {/* Options: Grid Selector, Outline Toggle, Speed */}
        <div className={styles.optionsRow}>
          {/* Grid Selection */}
          <div className={styles.optionItem}>
            <span className={styles.optionLabel}>Khung ô:</span>
            <div className={styles.segmentedGroup}>
              <button
                type="button"
                className={`${styles.segmentBtn} ${gridType === 'mige' ? styles.segmentBtnActive : ''}`}
                onClick={() => setGridType('mige')}
                title="Khung Mễ tự cách (米字格) chia 8 phần"
              >
                米 Mễ
              </button>
              <button
                type="button"
                className={`${styles.segmentBtn} ${gridType === 'tiange' ? styles.segmentBtnActive : ''}`}
                onClick={() => setGridType('tiange')}
                title="Khung Điền tự cách (田字格) chia 4 phần"
              >
                田 Điền
              </button>
              <button
                type="button"
                className={`${styles.segmentBtn} ${gridType === 'none' ? styles.segmentBtnActive : ''}`}
                onClick={() => setGridType('none')}
                title="Ô trống không đường phụ"
              >
                Trơn
              </button>
            </div>
          </div>

          {/* Outline Ghost Toggle */}
          <div className={styles.optionItem}>
            <button
              type="button"
              className={`${styles.toggleOutlineBtn} ${showOutline ? styles.toggleOutlineActive : ''}`}
              onClick={() => setShowOutline(!showOutline)}
              title="Bật/Tắt bóng nét mờ hướng dẫn"
            >
              <span className={styles.outlineIcon}>{showOutline ? '' : ''}</span>
              <span>{showOutline ? 'Bóng nét: Bật' : 'Bóng nét: Tắt'}</span>
            </button>
          </div>

          {/* Speed Selector (Animate mode) */}
          {mode === 'animate' && (
            <div className={styles.optionItem}>
              <span className={styles.optionLabel}>Tốc độ:</span>
              <div className={styles.segmentedGroup}>
                {[0.75, 1.0, 1.5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`${styles.segmentBtn} ${speed === s ? styles.segmentBtnActive : ''}`}
                    onClick={() => setSpeed(s)}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
