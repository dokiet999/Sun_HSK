import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageContainer from '../layouts/PageContainer';
import { LevelTabs, VocabularyHero, LessonCard } from '../features/vocabulary';
import { getLevelConfig } from '../data/vocabData';
import { vocabularyService } from '../services/vocabularyService';
import styles from './Vocabulary.module.css';

export default function Vocabulary() {
  const { level: levelParam } = useParams();
  const navigate = useNavigate();

  // Xác định cấu hình cấp độ hiện tại (mặc định HSK 1 nếu không truyền)
  const currentLevel = getLevelConfig(levelParam || '1');

  const [lessonData, setLessonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchLessons() {
      try {
        setLoading(true);
        setError(null);
        const res = await vocabularyService.getLessonOverview(currentLevel.id, 12);
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
  }, [currentLevel.id]);

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

  return (
    <PageContainer>
      {/* 7 HSK Level Tabs (Sticky) */}
      <LevelTabs currentLevelId={currentLevel.id} />

      {/* Hero Overview Banner */}
      <VocabularyHero
        levelConfig={currentLevel}
        stats={stats}
        loading={loading}
      />

      {/* Main Content Area */}
      <div className={styles.contentSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>
                Danh sách bài học <span>{currentLevel.label}</span>
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
                  levelColor={currentLevel.color}
                  levelLight={currentLevel.colorLight}
                  levelBorder={currentLevel.colorBorder}
                />
              ))}
            </div>
          )}

          {/* Empty State (Ví dụ cấp độ chưa có dữ liệu) */}
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
                onClick={() => navigate('/vocabulary/1')}
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
