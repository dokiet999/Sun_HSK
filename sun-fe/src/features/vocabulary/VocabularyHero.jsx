import React from 'react';
import styles from './VocabularyHero.module.css';

export default function VocabularyHero({ levelConfig, stats, loading }) {
  const { label, sublabel, wordsCount, description, color, colorLight, colorBorder, colorBadge, tags, icon } = levelConfig;

  const totalWords = stats?.totalWords ?? 0;
  const totalLessons = stats?.totalLessons ?? 0;
  const learnedWords = stats?.learnedWords ?? 0;
  const masteredWords = stats?.masteredWords ?? 0;
  const progressPercent = stats?.progressPercent ?? 0;

  return (
    <section
      className={styles.hero}
      style={{
        '--level-color': color,
        '--level-light': colorLight,
        '--level-border': colorBorder,
        '--level-badge': colorBadge
      }}
    >
      <div className="container">
        <div className={styles.heroGrid}>
          {/* Main Info */}
          <div className={styles.infoCol}>
            <div className={styles.badgeRow}>
              <span className={styles.levelPill}>
                <span className={styles.icon}>{icon}</span>
                {label} · {sublabel}
              </span>
              <span className={styles.vocabCountBadge}>{wordsCount}</span>
            </div>

            <h1 className={styles.title}>
              Kho Từ vựng <span>{label}</span>
            </h1>

            <p className={styles.description}>{description}</p>

            <div className={styles.tagsList}>
              {tags && tags.map((tag) => (
                <span key={tag} className={styles.tagItem}>#{tag}</span>
              ))}
            </div>
          </div>

          {/* Quick Stats Box */}
          <div className={styles.statsCard}>
            <div className={styles.statsHeader}>
              <span className={styles.statsTitle}>Tiến độ cấp độ {label}</span>
              <span className={styles.progressValue}>{progressPercent}%</span>
            </div>

            {/* Progress Bar */}
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
            </div>

            <div className={styles.statsMetrics}>
              <div className={styles.metricItem}>
                <span className={styles.metricNumber}>
                  {loading ? '...' : totalLessons}
                </span>
                <span className={styles.metricLabel}>Bài học</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricNumber}>
                  {loading ? '...' : totalWords}
                </span>
                <span className={styles.metricLabel}>Từ vựng</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricNumber}>
                  {loading ? '...' : learnedWords}
                </span>
                <span className={styles.metricLabel}>Đã học</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricNumber}>
                  {loading ? '...' : masteredWords}
                </span>
                <span className={styles.metricLabel}>Thành thạo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
