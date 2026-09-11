import React, { useState } from 'react';
import { playChineseAudio } from '../../utils/audioPlayer';
import { vocabularyService } from '../../services/vocabularyService';
import { VOCAB_STATUS_MAP, formatPos } from '../../data/vocabData';
import styles from './VocabularyCard.module.css';

export default function VocabularyCard({ word, levelColor, onStatusChange }) {
  const [isPlayingWord, setIsPlayingWord] = useState(false);
  const [playingExampleIndex, setPlayingExampleIndex] = useState(null);
  const [inReview, setInReview] = useState(Boolean(word.inReviewList));
  const [userStatus, setUserStatus] = useState(word.userStatus || 'NEW');
  const [isUpdating, setIsUpdating] = useState(false);

  // Phát âm từ vựng chính
  const handlePlayWord = (e) => {
    e.stopPropagation();
    setIsPlayingWord(true);
    playChineseAudio(word.hanzi, word.audioPath, () => {
      setIsPlayingWord(false);
    });
  };

  // Phát âm câu ví dụ
  const handlePlayExample = (e, example, index) => {
    e.stopPropagation();
    setPlayingExampleIndex(index);
    playChineseAudio(example.zh, example.audioPath, () => {
      setPlayingExampleIndex(null);
    });
  };

  // Ghim / Bỏ ghim danh sách ôn tập
  const handleToggleReview = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vui lòng đăng nhập để sử dụng tính năng ghim từ ôn tập!');
      return;
    }
    const nextState = !inReview;
    setInReview(nextState);
    try {
      await vocabularyService.toggleReviewList(word.id, nextState);
    } catch (err) {
      console.error('Lỗi khi ghim từ vựng:', err);
      // Revert nếu lỗi
      setInReview(!nextState);
    }
  };

  // Đổi trạng thái học tập (Mới, Đang học, Đã thuộc)
  const handleStatusSelect = async (newStatus) => {
    if (newStatus === userStatus || isUpdating) return;
    setUserStatus(newStatus);
    setIsUpdating(true);
    try {
      await vocabularyService.updateStatus(word.id, newStatus);
      if (onStatusChange) {
        onStatusChange(word.id, newStatus);
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className={`${styles.card} ${inReview ? styles.cardBookmarked : ''}`}
      style={{ '--accent-color': levelColor || '#22c55e' }}
    >
      {/* Top Bar: Word Header & Actions */}
      <div className={styles.topBar}>
        <div className={styles.tagGroup}>
          {word.pos && (
            <span className={styles.posBadge}>{formatPos(word.pos)}</span>
          )}
        </div>

        <div className={styles.actionButtons}>
          {/* Nút nghe phát âm */}
          <button
            type="button"
            className={`${styles.iconActionBtn} ${isPlayingWord ? styles.audioPlaying : ''}`}
            onClick={handlePlayWord}
            title="Phát âm từ này"
            aria-label="Phát âm từ này"
          >
            {isPlayingWord ? '🔊' : '🔈'}
          </button>

          {/* Nút ghim ôn tập */}
          <button
            type="button"
            className={`${styles.iconActionBtn} ${inReview ? styles.bookmarked : ''}`}
            onClick={handleToggleReview}
            title={inReview ? 'Đã ghim vào danh sách ôn tập' : 'Ghim vào danh sách ôn tập'}
            aria-label="Ghim ôn tập"
          >
            {inReview ? '⭐' : '☆'}
          </button>
        </div>
      </div>

      {/* Main Word Display: Hanzi + Pinyin */}
      <div className={styles.wordHero} onClick={handlePlayWord} title="Bấm để nghe phát âm">
        <h2 className={styles.hanziText}>{word.hanzi}</h2>
        <div className={styles.pinyinText}>{word.pinyin}</div>
      </div>

      {/* Meanings */}
      <div className={styles.meaningSection}>
        <div className={styles.meaningVi}>{word.meaningVi}</div>
      </div>

      {/* Collocation (Cụm từ / Mẫu câu) nếu có */}
      {word.collocations && word.collocations.length > 0 && (
        <div className={styles.collocationBox}>
          <span className={styles.sectionLabel}>Cụm từ mẫu:</span>
          <div className={styles.collocationList}>
            {word.collocations.map((c, i) => (
              <div key={c.id || i} className={styles.collocationItem}>
                <span className={styles.collocationText}>{c.text}</span>
                {c.meaningVi && (
                  <span className={styles.collocationVi}>({c.meaningVi})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Examples nếu có */}
      {word.examples && word.examples.length > 0 && (
        <div className={styles.examplesBox}>
          <span className={styles.sectionLabel}>Ví dụ thực tế:</span>
          <div className={styles.exampleList}>
            {word.examples.map((ex, idx) => (
              <div key={ex.id || idx} className={styles.exampleItem}>
                <div className={styles.exampleContent}>
                  <div className={styles.exampleZh}>{ex.zh}</div>
                  {ex.vi && <div className={styles.exampleVi}>{ex.vi}</div>}
                </div>
                <button
                  type="button"
                  className={`${styles.exampleAudioBtn} ${playingExampleIndex === idx ? styles.audioPlaying : ''}`}
                  onClick={(e) => handlePlayExample(e, ex, idx)}
                  title="Nghe câu ví dụ"
                  aria-label="Nghe câu ví dụ"
                >
                  {playingExampleIndex === idx ? '🔊' : '🔈'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className={styles.statusBar}>
        <span className={styles.statusLabel}>Trạng thái:</span>
        <div className={styles.statusButtonGroup}>
          {['NEW', 'LEARNING', 'MASTERED'].map((stKey) => {
            const cfg = VOCAB_STATUS_MAP[stKey];
            const isSelected = userStatus === stKey;
            return (
              <button
                key={stKey}
                type="button"
                className={`${styles.statusOptionBtn} ${isSelected ? styles.statusSelected : ''}`}
                style={isSelected ? { background: cfg.bg, color: cfg.color, borderColor: cfg.color } : {}}
                onClick={() => handleStatusSelect(stKey)}
                disabled={isUpdating}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
