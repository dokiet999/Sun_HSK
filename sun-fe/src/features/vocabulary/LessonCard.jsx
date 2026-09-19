import React from 'react';
import { Link } from 'react-router-dom';
import styles from './LessonCard.module.css';

export default function LessonCard({ lesson, levelSlug }) {
  const { lessonNumber, title, totalWords, learnedWords, masteredWords, progressPercent, isCompleted } = lesson;

  const percent = progressPercent || (totalWords > 0 ? Math.round((learnedWords / totalWords) * 100) : 0);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.lessonBadge}>
          Bài {lessonNumber}
        </div>
        {isCompleted ? (
          <span className={`${styles.statusPill} ${styles.completedPill}`}>
            ✓ Hoàn thành
          </span>
        ) : percent > 0 ? (
          <span className={`${styles.statusPill} ${styles.inProgressPill}`}>
            Đang học {percent}%
          </span>
        ) : (
          <span className={`${styles.statusPill} ${styles.newPill}`}>
            Chưa học
          </span>
        )}
      </div>

      <h3 className={styles.title}>{title || `Bài học ${lessonNumber}`}</h3>

      <div className={styles.wordMeta}>
        <span className={styles.wordCount}>
          <b>{totalWords}</b> từ vựng
        </span>
        <span className={styles.learnedInfo}>
          Đã học: {learnedWords}/{totalWords}
        </span>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Footer Action */}
      <div className={styles.cardFooter}>
        <Link
          to={`/vocabulary/${levelSlug}/lesson/${lessonNumber}`}
          className={styles.viewBtn}
        >
          <span>Xem từ vựng</span>
          <span className={styles.arrowIcon}>→</span>
        </Link>
      </div>
    </div>
  );
}
