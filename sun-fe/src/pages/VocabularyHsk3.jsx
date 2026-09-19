import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PageContainer from '../layouts/PageContainer';
import { VocabularyHero, LessonCard } from '../features/vocabulary';
import { HSK_VOCAB_LEVELS, getLevelConfig } from '../data/vocabData';
import { vocabularyService } from '../services/vocabularyService';
import styles from './VocabularyHsk3.module.css';

// Thông tin chi tiết 3 bậc HSK 3.0
const HSK3_TIERS = {
  1: { tier: 'TIER_1', name: 'Bậc 1 · Sơ cấp' },
  2: { tier: 'TIER_1', name: 'Bậc 1 · Sơ cấp' },
  3: { tier: 'TIER_1', name: 'Bậc 1 · Sơ cấp' },
  4: { tier: 'TIER_2', name: 'Bậc 2 · Trung cấp' },
  5: { tier: 'TIER_2', name: 'Bậc 2 · Trung cấp' },
  6: { tier: 'TIER_2', name: 'Bậc 2 · Trung cấp' },
  7: { tier: 'TIER_3', name: 'Bậc 3 · Cao cấp' },
};

export default function VocabularyHsk3() {
  const { level: levelParam } = useParams();
  const navigate = useNavigate();

  const [activeTier, setActiveTier] = useState('ALL'); // 'ALL' | 'TIER_1' | 'TIER_2' | 'TIER_3'

  // State cho chế độ xem chi tiết bài học của 1 level
  const isDetailView = Boolean(levelParam);
  const currentLevel = isDetailView ? getLevelConfig(levelParam) : null;
  const [lessonData, setLessonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Tải bài học nếu đang ở chế độ xem chi tiết level
  useEffect(() => {
    if (!isDetailView || !currentLevel) return;

    let isMounted = true;
    async function fetchLessons() {
      try {
        setLoading(true);
        setError(null);
        const res = await vocabularyService.getLessonOverview(currentLevel.id, 12, 'HSK_3');
        if (isMounted) {
          if (res?.result) {
            setLessonData(res.result);
          } else {
            setLessonData(null);
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải bài học HSK 3.0:', err);
        if (isMounted) setError('Không thể tải bài học của cấp độ này.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchLessons();
    return () => {
      isMounted = false;
    };
  }, [isDetailView, currentLevel?.id]);

  // Lọc các level theo Tier
  const filteredLevels = HSK_VOCAB_LEVELS.filter((lvl) => {
    if (activeTier === 'ALL') return true;
    const tierInfo = HSK3_TIERS[lvl.id];
    return tierInfo?.tier === activeTier;
  });

  // Nếu đang xem chi tiết bài học của 1 level (/vocabulary/hsk3/:level)
  if (isDetailView && currentLevel) {
    const lessons = lessonData?.lessons || [];
    const stats = {
      totalWords: lessonData?.totalWords ?? 0,
      totalLessons: lessonData?.totalLessons ?? lessons.length,
      learnedWords: lessons.reduce((acc, l) => acc + (l.learnedWords || 0), 0),
      masteredWords: lessons.reduce((acc, l) => acc + (l.masteredWords || 0), 0),
      progressPercent:
        lessonData?.totalWords > 0
          ? Math.round(
              (lessons.reduce((acc, l) => acc + (l.learnedWords || 0), 0) /
                lessonData.totalWords) *
                100
            )
          : 0,
    };

    return (
      <PageContainer>
        {/* Hero Banner */}
        <VocabularyHero
          levelConfig={currentLevel}
          stats={stats}
          loading={loading}
          version="hsk3"
        />

        {/* Danh sách bài học */}
        <div style={{ padding: '40px 0 80px', background: '#ffffff' }}>
          <div className="container">
            <div style={{ marginBottom: 20 }}>
              <Link to="/vocabulary/hsk3" className={styles.backBtn}>
                ← Quay lại danh sách cấp độ HSK 3.0
              </Link>
            </div>

            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--blue-950)', margin: '0 0 6px 0' }}>
                Danh sách bài học HSK 3.0 · <span>{currentLevel.label}</span>
              </h2>
              <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: 0 }}>
                Các bài học được chia nhỏ khoa học giúp bạn học tập nhẹ nhàng, kèm hệ thống Flashcard và bài tập tự sinh.
              </p>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
                Đang tải danh sách bài học...
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#dc2626' }}>
                <p>{error}</p>
                <button
                  style={{
                    padding: '8px 16px',
                    background: 'var(--blue-900)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                  onClick={() => window.location.reload()}
                >
                  Tải lại
                </button>
              </div>
            ) : lessons.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 20,
                }}
              >
                {lessons.map((lesson) => (
                  <LessonCard
                    key={lesson.lessonNumber}
                    lesson={lesson}
                    levelSlug={`hsk3/${currentLevel.slug}`}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: '#ffffff',
                  border: '1px solid var(--line)',
                  borderRadius: 16,
                  color: 'var(--muted)',
                }}
              >
                Chưa có dữ liệu bài học cho cấp độ này.
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    );
  }

  // Chế độ xem Hub thẻ Card từng Level (/vocabulary/hsk3)
  return (
    <PageContainer>
      <div className={styles.hubContainer}>
        {/* Hero Header */}
        <section className={styles.hero}>
          <div className={`container ${styles.heroInner}`}>
            <div className={styles.eyebrow}>
              <span>🚀</span> HSK 3.0 • TIÊU CHUẨN MỚI 3 BẬC 9 CẤP
            </div>
            <h1 className={styles.heading}>
              Kho Từ vựng HSK 3.0
            </h1>
            <p className={styles.desc}>
              Khung tiêu chuẩn đánh giá năng lực Hán ngữ mới nhất gồm 3 Bậc 9 Cấp (11.092 từ vựng và 3.000 chữ Hán).
              Chọn từng cấp độ bên dưới để xem toàn bộ danh sách bài học, luyện Flashcard và làm bài tập củng cố.
            </p>
          </div>
        </section>

        {/* Filter Section & Cards Grid */}
        <div className="container">
          <div className={styles.filterSection}>
            <div className={styles.filterBar}>
              <button
                type="button"
                className={`${styles.filterBtn} ${activeTier === 'ALL' ? styles.filterBtnActive : ''}`}
                onClick={() => setActiveTier('ALL')}
              >
                Tất cả cấp độ (7)
              </button>
              <button
                type="button"
                className={`${styles.filterBtn} ${activeTier === 'TIER_1' ? styles.filterBtnActive : ''}`}
                onClick={() => setActiveTier('TIER_1')}
              >
                🌱 Bậc 1: Sơ cấp (HSK 1–3)
              </button>
              <button
                type="button"
                className={`${styles.filterBtn} ${activeTier === 'TIER_2' ? styles.filterBtnActive : ''}`}
                onClick={() => setActiveTier('TIER_2')}
              >
                🌿 Bậc 2: Trung cấp (HSK 4–6)
              </button>
              <button
                type="button"
                className={`${styles.filterBtn} ${activeTier === 'TIER_3' ? styles.filterBtnActive : ''}`}
                onClick={() => setActiveTier('TIER_3')}
              >
                👑 Bậc 3: Cao cấp (HSK 7–9)
              </button>
            </div>

            {/* Grid of 7 Level Cards */}
            <div className={styles.cardsGrid}>
              {filteredLevels.map((lvl) => {
                const tierInfo = HSK3_TIERS[lvl.id];
                return (
                  <div
                    key={lvl.id}
                    className={styles.levelCard}
                    onClick={() => navigate(`/vocabulary/hsk3/${lvl.slug}`)}
                  >
                    {/* Top Row: Badge & Tier */}
                    <div>
                      <div className={styles.cardTop}>
                        <span className={styles.badgePill}>
                          <span className={styles.iconMark}>{lvl.icon}</span>
                          {lvl.label}
                        </span>
                        <span className={styles.tierPill}>{tierInfo?.name}</span>
                      </div>

                      <div className={styles.cardBody} style={{ marginTop: 14 }}>
                        <h3 className={styles.cardTitle}>
                          {lvl.label} <span className={styles.cardSublabel}>· {lvl.sublabel}</span>
                        </h3>
                        <p className={styles.cardDesc}>{lvl.description}</p>
                      </div>
                    </div>

                    {/* Middle: Metrics & Progress */}
                    <div>
                      <div className={styles.metricsBar}>
                        <div className={styles.metricItem}>
                          <span className={styles.metricLabel}>Số từ vựng</span>
                          <span className={styles.metricVal}>{lvl.wordsCount}</span>
                        </div>
                        <div className={styles.metricItem}>
                          <span className={styles.metricLabel}>Số bài học</span>
                          <span className={styles.metricVal}>~{lvl.estimatedLessons} bài</span>
                        </div>
                      </div>

                      <div className={styles.progressSection} style={{ marginTop: 14 }}>
                        <div className={styles.progressLabelRow}>
                          <span>Tiến độ học tập</span>
                          <span className={styles.progressStatus}>Sẵn sàng học</span>
                        </div>
                        <div className={styles.progressBar}>
                          <div className={styles.progressFill} style={{ width: '0%' }} />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className={styles.cardFooter}>
                      <span className={styles.actionText}>
                        Xem danh sách bài học <span className={styles.arrowIcon}>→</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
