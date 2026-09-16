import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HSK_VOCAB_LEVELS } from '../../data/vocabData';
import styles from './LevelTabs.module.css';

export default function LevelTabs({ currentLevelId, version = 'hsk2', basePath = '/vocabulary' }) {
  const navigate = useNavigate();

  // HSK 2.0 chỉ có 6 cấp độ (HSK 1 - 6), HSK 3.0 có 7 cấp độ (bao gồm cả HSK 7-9)
  const displayLevels = version === 'hsk2'
    ? HSK_VOCAB_LEVELS.slice(0, 6)
    : HSK_VOCAB_LEVELS;

  return (
    <div className={styles.container}>
      <div className={styles.scrollWrapper}>
        <div className={styles.tabsList} role="tablist">
          {displayLevels.map((level) => {
            const isActive = level.id === currentLevelId;
            return (
              <button
                key={level.id}
                role="tab"
                aria-selected={isActive}
                className={`${styles.tabBtn} ${isActive ? styles.activeTab : ''}`}
                style={{
                  '--level-color': level.color,
                  '--level-light': level.colorLight,
                  '--level-border': level.colorBorder,
                  '--level-badge': level.colorBadge
                }}
                onClick={() => navigate(`${basePath}/${level.slug}`)}
              >
                <span className={styles.tabIcon}>{level.icon}</span>
                <div className={styles.tabInfo}>
                  <span className={styles.tabTitle}>{level.label}</span>
                  <span className={styles.tabSub}>{level.sublabel}</span>
                </div>
                {isActive && <div className={styles.activePill} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
