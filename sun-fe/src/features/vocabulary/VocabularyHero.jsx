import React from 'react';
import { Link } from 'react-router-dom';
import styles from './VocabularyHero.module.css';

export default function VocabularyHero({ levelConfig, stats, loading, version = 'hsk2' }) {
  const { label, sublabel, wordsCount, description, tags, icon } = levelConfig;

  const totalWords = stats?.totalWords ?? 0;
  const totalLessons = stats?.totalLessons ?? 0;
  const learnedWords = stats?.learnedWords ?? 0;
  const masteredWords = stats?.masteredWords ?? 0;
  const progressPercent = stats?.progressPercent ?? 0;

  const versionLabel = version === 'hsk3' ? 'HSK 3.0' : 'HSK 2.0';
  const basePath = version === 'hsk3' ? '/vocabulary/hsk3' : '/vocabulary/hsk2';

  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/" className={styles.breadLink}>Trang chủ</Link>
          <span className={styles.sep}>›</span>
          <Link to={basePath} className={styles.breadLink}>Từ vựng {versionLabel}</Link>
          <span className={styles.sep}>›</span>
          <span className={styles.breadCurrent}>{label}</span>
        </nav>

        {/* Centered Content */}
        <div className={styles.content}>
          <div className={styles.badge}>
            <span className={styles.icon}>{icon}</span>
            <span>{versionLabel} • {label} — {sublabel}</span>
          </div>

          <h1 className={styles.heading}>
            Kho Từ vựng {versionLabel} — {label}
          </h1>

          <p className={styles.desc}>{description}</p>
        </div>
      </div>
    </section>
  );
}
