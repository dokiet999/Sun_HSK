import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import PageContainer from '../layouts/PageContainer';
import { VocabularyHero, LessonCard } from '../features/vocabulary';
import { HSK_VOCAB_LEVELS, getLevelConfig } from '../data/vocabData';
import { vocabularyService } from '../services/vocabularyService';
import styles from './Vocabulary.module.css';

export default function Vocabulary({ version: propVersion }) {
  const { level: levelParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Xác định phiên bản: HSK 2.0 hay HSK 3.0 dựa vào prop hoặc URL
  const currentVersion = propVersion || (location.pathname.includes('/hsk3') ? 'hsk3' : 'hsk2');

  const isDetailView = Boolean(levelParam);

  // Đối với HSK 2.0 chỉ có tối đa 6 cấp độ (HSK 1 - 6)
  let safeLevel = levelParam || '1';
  if (safeLevel === '7' || safeLevel === '7-9') {
    safeLevel = '1';
  }

  const currentLevel = isDetailView ? getLevelConfig(safeLevel) : null;
  const [lessonData, setLessonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isDetailView || !currentLevel) return;

    let isMounted = true;
    async function fetchLessons() {
      try {
        setLoading(true);
        setError(null);
        const res = await vocabularyService.getLessonOverview(currentLevel.id, 12, 'HSK_2');
        if (isMounted) {
          if (res?.result) {
            setLessonData(res.result);
          } else {
            setLessonData(null);
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách bài học HSK 2.0:', err);
        if (isMounted) {
          setError('Không thể tải danh sách bài học. Vui lòng thử lại sau.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchLessons();
    return () => {
      isMounted = false;
    };
  }, [isDetailView, currentLevel?.id]);

  // Danh sách 6 cấp độ HSK 2.0
  const hsk2Levels = HSK_VOCAB_LEVELS.slice(0, 6);

  // 1. CHẾ ĐỘ XEM CHI TIẾT LEVEL (/vocabulary/hsk2/:level)
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
        {/* Hero Overview Banner */}
        <VocabularyHero
          levelConfig={currentLevel}
          stats={stats}
          loading={loading}
          version="hsk2"
        />

        {/* Main Content Area */}
        <div className={styles.contentSection}>
          <div className="container">
            {/* Back link */}
            <div style={{ marginBottom: 20 }}>
              <Link to="/vocabulary/hsk2" className={styles.backBtn}>
                ← Quay lại danh sách cấp độ HSK 2.0
              </Link>
            </div>

            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>
                  Danh sách bài học HSK 2.0 <span>{currentLevel.label}</span>
                </h2>
                <p className={styles.sectionSubtitle}>
                  Mỗi bài học được chia nhỏ theo từng chủ đề hoặc 10–12 từ vựng giúp bạn học tập nhẹ nhàng, ghi nhớ sâu.
                </p>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className={styles.loadingGrid}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className={styles.skeletonCard} />
                ))}
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className={styles.errorBox}>
                <p>{error}</p>
                <button
                  className={styles.retryBtn}
                  onClick={() => window.location.reload()}
                >
                  Tải lại trang
                </button>
              </div>
            )}

            {/* Lessons Grid */}
            {!loading && !error && lessons.length > 0 && (
              <div className={styles.lessonGrid}>
                {lessons.map((lesson) => (
                  <LessonCard
                    key={lesson.lessonNumber}
                    lesson={lesson}
                    levelSlug={currentLevel.slug}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && lessons.length === 0 && (
              <div className={styles.emptyBox}>
                <div className={styles.emptyIcon}>{currentLevel.icon}</div>
                <h3 className={styles.emptyTitle}>
                  Chưa có dữ liệu bài học cho {currentLevel.label}
                </h3>
                <p className={styles.emptyDesc}>
                  Dữ liệu từ vựng cho cấp độ này đang được ban biên tập cập nhật. Bạn có thể chuyển sang học cấp độ khác hoặc kiểm tra lại sau!
                </p>
                <button
                  className={styles.switchBtn}
                  onClick={() => navigate('/vocabulary/hsk2')}
                >
                  Chọn cấp độ khác
                </button>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    );
  }

  // 2. CHẾ ĐỘ XEM HUB CARD TỪNG LEVEL (/vocabulary/hsk2 hoặc /vocabulary)
  return (
    <PageContainer>
      <div className={styles.hubContainer}>
        {/* Hero Header */}
        <section className={styles.hero}>
          <div className={`container ${styles.heroInner}`}>
            <div className={styles.eyebrow}>
              <span>📚</span> HSK 2.0 • GIÁO TRÌNH TIÊU CHUẨN 6 CẤP
            </div>
            <h1 className={styles.heading}>
              Kho Từ vựng HSK 2.0
            </h1>
            <p className={styles.desc}>
              Hệ thống từ vựng 6 cấp độ kinh điển theo khung khảo thí HSK Hanban tiêu chuẩn (150 – 5.000 từ).
              Chọn từng cấp độ bên dưới để xem toàn bộ danh sách bài học, luyện Flashcard và làm bài tập củng cố.
            </p>
          </div>
        </section>

        {/* Grid of 6 Level Cards */}
        <div className={styles.bodySection}>
          <div className="container">
            <div className={styles.cardsGrid}>
              {hsk2Levels.map((lvl) => (
                <Link
                  key={lvl.id}
                  to={`/vocabulary/hsk2/${lvl.slug}`}
                  className={styles.levelCard}
                  aria-label={`Xem danh sách bài học ${lvl.label} - ${lvl.sublabel}`}
                >
                  {/* Top Row: Badge & Sublabel */}
                  <div>
                    <div className={styles.cardTop}>
                      <span className={styles.badgePill}>
                        <span className={styles.iconMark}>{lvl.icon}</span>
                        {lvl.label}
                      </span>
                      <span className={styles.tierPill}>{lvl.sublabel}</span>
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
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
