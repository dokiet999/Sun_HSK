import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import PageContainer from '../layouts/PageContainer';
import { LevelTabs, VocabularyHero, LessonCard } from '../features/vocabulary';
import { getLevelConfig } from '../data/vocabData';
import { vocabularyService } from '../services/vocabularyService';
import styles from './Vocabulary.module.css';

export default function Vocabulary({ version: propVersion }) {
  const { level: levelParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Xác định phiên bản: HSK 2.0 hay HSK 3.0 dựa vào prop hoặc đường dẫn URL
  const currentVersion = propVersion || (location.pathname.includes('/hsk3') ? 'hsk3' : 'hsk2');

  // Đối với HSK 2.0 chỉ có tối đa 6 cấp độ (HSK 1 - 6), nếu truyền 7 hoặc 7-9 thì tự động về 1
  let safeLevel = levelParam || '1';
  if (currentVersion === 'hsk2' && (safeLevel === '7' || safeLevel === '7-9')) {
    safeLevel = '1';
  }

  // Cấu hình cấp độ hiện tại
  const currentLevel = getLevelConfig(safeLevel);

  const hskVersionParam = currentVersion === 'hsk3' ? 'HSK_3' : 'HSK_2';

  const [lessonData, setLessonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchLessons() {
      try {
        setLoading(true);
        setError(null);
        const res = await vocabularyService.getLessonOverview(currentLevel.id, 12, hskVersionParam);
        if (isMounted) {
          if (res && res.result) {
            setLessonData(res.result);
          } else {
            setLessonData(null);
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách bài học:', err);
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
  }, [currentLevel.id, hskVersionParam]);

  const lessons = lessonData?.lessons || [];

  // Tính toán số liệu tổng hợp
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
        : 0
  };

  const basePath = `/vocabulary/${currentVersion}`;

  return (
    <PageContainer>
      {/* Cấp độ HSK: HSK 2.0 hiển thị 6 cấp, HSK 3.0 hiển thị 7 cấp (kèm HSK 7-9) */}
      <LevelTabs
        currentLevelId={currentLevel.id}
        version={currentVersion}
        basePath={basePath}
      />

      {/* Hero Overview Banner */}
      <VocabularyHero
        levelConfig={currentLevel}
        stats={stats}
        loading={loading}
        version={currentVersion}
      />

      {/* Main Content Area */}
      <div className={styles.contentSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>
                Danh sách bài học {currentVersion === 'hsk3' ? 'HSK 3.0' : 'HSK 2.0'} <span>{currentLevel.label}</span>
              </h2>
              <p className={styles.sectionSubtitle}>
                {currentVersion === 'hsk3'
                  ? 'Từ vựng theo chuẩn mới 3 bậc 9 cấp kết hợp 4 trụ cột ngôn ngữ, phân chia thành các bài học vừa sức.'
                  : 'Mỗi bài học được chia nhỏ theo từng chủ đề hoặc 10–12 từ vựng giúp bạn học tập nhẹ nhàng, ghi nhớ sâu.'}
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
                  levelColor={currentLevel.color}
                  levelLight={currentLevel.colorLight}
                  levelBorder={currentLevel.colorBorder}
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
                onClick={() => navigate(`${basePath}/1`)}
              >
                Học HSK 1 ngay
              </button>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
