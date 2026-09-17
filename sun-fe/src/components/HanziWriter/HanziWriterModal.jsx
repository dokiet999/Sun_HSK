import React, { useEffect, useState } from 'react';
import HanziWordWriter from './HanziWordWriter';
import { playChineseAudio } from '../../utils/audioPlayer';
import { formatPos } from '../../data/vocabData';
import styles from './HanziWriter.module.css';

/**
 * HanziWriterModal component
 * Popup overlay providing a complete calligraphy & stroke practice environment
 */
export default function HanziWriterModal({
  word,
  words = [],
  currentIndex = 0,
  onClose,
  onNavigate,
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (!word) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (onClose) onClose();
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0 && onNavigate) {
          onNavigate(currentIndex - 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < words.length - 1 && onNavigate) {
          onNavigate(currentIndex + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [word, currentIndex, words.length, onClose, onNavigate]);

  if (!word) return null;

  const totalWords = words.length || 1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < totalWords - 1;

  // Audio pronunciation
  const handlePlayAudio = () => {
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);
    playChineseAudio(word.hanzi, word.audioPath, () => {
      setIsPlayingAudio(false);
    });
  };

  // Navigate to previous word
  const handlePrevWord = () => {
    if (hasPrev && onNavigate) {
      onNavigate(currentIndex - 1);
    }
  };

  // Navigate to next word
  const handleNextWord = () => {
    if (hasNext && onNavigate) {
      onNavigate(currentIndex + 1);
    }
  };

  return (
    <div
      className={styles.modalBackdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hanzi-modal-title"
    >
      <div className={styles.modalContent}>
        {/* Modal Top Header */}
        <div className={styles.modalHeader}>
          <div className={styles.wordHeaderLeft}>
            <div className={styles.wordTitleRow}>
              <h2 id="hanzi-modal-title" className={styles.wordTitle}>
                {word.hanzi}
              </h2>
              {word.pos && (
                <span className={styles.posBadge}>{formatPos(word.pos)}</span>
              )}
              <button
                type="button"
                className={`${styles.audioBtn} ${isPlayingAudio ? styles.audioBtnActive : ''}`}
                onClick={handlePlayAudio}
                title="Nghe phát âm từ này"
                aria-label="Phát âm"
              >
                {isPlayingAudio ? '🔊' : '🔈'}
              </button>
            </div>
            <div className={styles.wordSubtitleRow}>
              <span className={styles.wordPinyin}>{word.pinyin}</span>
              <span className={styles.wordMeaning}>• {word.meaningVi}</span>
            </div>
          </div>

          <div className={styles.wordHeaderRight}>
            <span className={styles.wordCounter}>
              Từ {currentIndex + 1} / {totalWords}
            </span>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              title="Đóng cửa sổ (Esc)"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body: Hanzi Practice Environment */}
        <div className={styles.modalBody}>
          <HanziWordWriter
            word={word}
            onWordComplete={() => {
              // Optional callback on complete
            }}
          />
        </div>

        {/* Modal Footer: Prev / Next Navigation */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={`${styles.navBtn} ${!hasPrev ? styles.navBtnDisabled : ''}`}
            onClick={handlePrevWord}
            disabled={!hasPrev}
            title="Từ trước đó (Phím ←)"
          >
            ← Từ trước
          </button>

          <span className={styles.navShortcutHint}>
            Mẹo: Dùng phím <strong>←</strong> <strong>→</strong> để chuyển từ, <strong>Esc</strong> để đóng
          </span>

          <button
            type="button"
            className={`${styles.navBtn} ${styles.navBtnPrimary} ${!hasNext ? styles.navBtnDisabled : ''}`}
            onClick={handleNextWord}
            disabled={!hasNext}
            title="Từ tiếp theo (Phím →)"
          >
            Từ tiếp theo →
          </button>
        </div>
      </div>
    </div>
  );
}
