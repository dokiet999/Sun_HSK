import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HSK_VOCAB_LEVELS } from '../../data/vocabData';
import styles from './LevelTabs.module.css';

export default function LevelTabs({ currentLevelId }) {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.scrollWrapper}>
        <div className={styles.tabsList} role="tablist">
          {HSK_VOCAB_LEVELS.map((level) => {
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
                onClick={() => navigate(`/vocabulary/${level.slug}`)}
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
