import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../../../services/adminService';
import { playChineseAudio } from '../../../../utils/audioPlayer';
import VocabularyFormModal from './VocabularyFormModal';
import VocabularyImportModal from './VocabularyImportModal';
import ExerciseGenerateModal from './ExerciseGenerateModal';
import styles from './VocabularyTable.module.css';

const HSK_COLORS = {
  1: { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
  2: { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
  3: { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
  4: { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa' },
  5: { bg: '#fae8ff', text: '#a21caf', border: '#f5d0fe' },
  6: { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' },
  7: { bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe' }
};

export default function VocabularyTable() {
  const [vocabularies, setVocabularies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [lessonFilter, setLessonFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedVocab, setSelectedVocab] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);

  // Playing audio state
  const [playingId, setPlayingId] = useState(null);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await adminService.getVocabularyStats();
      if (res && res.result) {
        setStats(res.result);
      }
    } catch (err) {
      console.error('Lỗi khi tải thống kê từ vựng:', err);
    }
  }, []);

  // Fetch list
  const fetchVocabularies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getVocabularies({
        page,
        size: pageSize,
        level: levelFilter,
        lesson: lessonFilter,
        keyword: search
      });

      if (res && res.result) {
        setVocabularies(res.result.content || []);
        setTotalPages(res.result.totalPages || 0);
        setTotalElements(res.result.totalElements || 0);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách từ vựng:', err);
      setError('Không thể tải danh sách từ vựng. Vui lòng kiểm tra kết nối.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, levelFilter, lessonFilter, search]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchVocabularies();
  }, [fetchVocabularies]);

  // Audio preview
  const handlePlayAudio = (v) => {
    setPlayingId(v.id);
    playChineseAudio(v.hanzi, v.audioPath, () => {
      setPlayingId(null);
    });
  };

  // Delete handler
  const handleDelete = async (vocab) => {
    if (!window.confirm(`Xác nhận xóa từ vựng "${vocab.hanzi}" (${vocab.meaningVi})? Hành động này sẽ xóa cả câu ví dụ và bài tập liên quan.`)) {
      return;
    }

    try {
      await adminService.deleteVocabulary(vocab.id);
      fetchVocabularies();
      fetchStats();
    } catch (err) {
      alert(err?.response?.data?.message || 'Có lỗi xảy ra khi xóa từ vựng.');
    }
  };

  // Save (Create / Update) handler
  const handleSaveVocabulary = async (payload, id) => {
    if (id) {
      await adminService.updateVocabulary(id, payload);
    } else {
      await adminService.createVocabulary(payload);
    }
    fetchVocabularies();
    fetchStats();
  };

  // Batch import handler
  const handleImportSuccess = async (list, defaultLesson) => {
    await adminService.importVocabularies(list, defaultLesson);
    fetchVocabularies();
    fetchStats();
  };

  // Generate exercises handler
  const handleGenerateExercises = async (level) => {
    const res = await adminService.generateExercises(level);
    return res;
  };

  return (
    <div className={styles.container}>
      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div
          className={`${styles.statCard} ${levelFilter === 'all' ? styles.statCardActive : ''}`}
          onClick={() => { setLevelFilter('all'); setPage(0); }}
        >
          <span className={styles.statLabel}>Tổng số từ</span>
          <span className={styles.statValue}>{stats?.totalWords ?? totalElements}</span>
        </div>
        {[1, 2, 3, 4, 5, 6, 7].map(lvl => {
          const count = stats?.countsByLevel?.[lvl] ?? 0;
          const colors = HSK_COLORS[lvl];
          const isActive = levelFilter === String(lvl);
          return (
            <div
              key={lvl}
              className={`${styles.statCard} ${isActive ? styles.statCardActive : ''}`}
              style={{
                '--hsk-bg': colors.bg,
                '--hsk-text': colors.text,
                '--hsk-border': colors.border
              }}
              onClick={() => { setLevelFilter(String(lvl)); setPage(0); }}
            >
              <span className={styles.statLevelBadge}>HSK {lvl === 7 ? '7–9' : lvl}</span>
              <span className={styles.statValue}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          {/* Ô tìm kiếm */}
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Tìm theo chữ Hán, Pinyin, nghĩa..."
              className={styles.searchInput}
            />
            {search && (
              <button className={styles.clearBtn} onClick={() => setSearch('')}>×</button>
            )}
          </div>

          {/* Bộ lọc Level */}
          <select
            value={levelFilter}
            onChange={e => { setLevelFilter(e.target.value); setPage(0); }}
            className={styles.select}
          >
            <option value="all">Tất cả cấp độ</option>
            {[1, 2, 3, 4, 5, 6, 7].map(lvl => (
              <option key={lvl} value={lvl}>HSK {lvl === 7 ? '7–9' : lvl}</option>
            ))}
          </select>

          {/* Bộ lọc Bài học (Lesson) */}
          <select
            value={lessonFilter}
            onChange={e => { setLessonFilter(e.target.value); setPage(0); }}
            className={styles.select}
          >
            <option value="all">Tất cả bài học</option>
            {Array.from({ length: 30 }, (_, i) => i + 1).map(num => (
              <option key={num} value={num}>Bài {num}</option>
            ))}
          </select>
        </div>

        <div className={styles.toolbarRight}>
          <button
            className={styles.actionBtnSecondary}
            onClick={() => setGenerateModalOpen(true)}
            title="Tự động sinh bài tập từ vựng"
          >
            ⚡ Sinh bài tập
          </button>
          <button
            className={styles.actionBtnSecondary}
            onClick={() => setImportModalOpen(true)}
            title="Import hàng loạt từ JSON"
          >
            📥 Import JSON
          </button>
          <button
            className={styles.actionBtnPrimary}
            onClick={() => { setSelectedVocab(null); setFormModalOpen(true); }}
          >
            ➕ Thêm từ vựng
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Đang tải danh sách từ vựng...</span>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p>{error}</p>
            <button onClick={fetchVocabularies} className={styles.retryBtn}>Thử lại</button>
          </div>
        ) : vocabularies.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📖</span>
            <h4>Không tìm thấy từ vựng nào</h4>
            <p>Hãy thử thay đổi điều kiện tìm kiếm hoặc thêm từ vựng mới.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th style={{ width: '130px' }}>Chữ Hán</th>
                <th style={{ width: '130px' }}>Pinyin</th>
                <th style={{ width: '100px' }}>Từ loại</th>
                <th>Nghĩa tiếng Việt</th>
                <th style={{ width: '120px' }}>Hán Việt</th>
                <th style={{ width: '90px' }}>Cấp độ</th>
                <th style={{ width: '80px' }}>Bài số</th>
                <th style={{ width: '80px' }}>Ví dụ</th>
                <th style={{ width: '110px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {vocabularies.map(v => {
                const colors = HSK_COLORS[v.hskLevel] || HSK_COLORS[1];
                const isPlaying = playingId === v.id;
                return (
                  <tr key={v.id} className={styles.row}>
                    <td className={styles.idCell}>#{v.id}</td>
                    <td>
                      <div className={styles.hanziCell}>
                        <span className={styles.hanziText}>{v.hanzi}</span>
                        <button
                          className={`${styles.audioBtn} ${isPlaying ? styles.audioBtnPlaying : ''}`}
                          onClick={() => handlePlayAudio(v)}
                          title="Nghe phát âm"
                        >
                          {isPlaying ? '🔊' : '🔈'}
                        </button>
                      </div>
                    </td>
                    <td className={styles.pinyinCell}>{v.pinyin}</td>
                    <td>
                      <span className={styles.posBadge}>{v.pos || '-'}</span>
                    </td>
                    <td className={styles.meaningCell}>
                      <span title={v.meaningVi}>{v.meaningVi}</span>
                    </td>
                    <td className={styles.hvCell}>{v.hanViet || '-'}</td>
                    <td>
                      <span
                        className={styles.levelPill}
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                          borderColor: colors.border
                        }}
                      >
                        HSK {v.hskLevel === 7 ? '7–9' : v.hskLevel}
                      </span>
                    </td>
                    <td className={styles.lessonCell}>
                      {v.lessonNumber ? `Bài ${v.lessonNumber}` : '-'}
                    </td>
                    <td>
                      <span className={styles.exampleCountBadge}>
                        {(v.examples || []).length}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionBtns}>
                        <button
                          className={styles.editBtn}
                          onClick={() => { setSelectedVocab(v); setFormModalOpen(true); }}
                          title="Chỉnh sửa từ vựng"
                        >
                          ✏️
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(v)}
                          title="Xóa từ vựng"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Bar */}
      <div className={styles.paginationBar}>
        <div className={styles.paginationInfo}>
          Hiển thị <strong>{vocabularies.length}</strong> / <strong>{totalElements}</strong> từ vựng
          {totalPages > 0 && ` (Trang ${page + 1} / ${totalPages})`}
        </div>

        <div className={styles.paginationControls}>
          <div className={styles.pageSizeWrapper}>
            <span>Số hàng:</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}
              className={styles.pageSizeSelect}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className={styles.pageBtns}>
            <button
              className={styles.pageBtn}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
            >
              ‹ Trước
            </button>
            <span className={styles.currentPageBadge}>{page + 1}</span>
            <button
              className={styles.pageBtn}
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || loading}
            >
              Sau ›
            </button>
          </div>
        </div>
      </div>

      {/* Form Modal (Add / Edit) */}
      <VocabularyFormModal
        isOpen={formModalOpen}
        initialData={selectedVocab}
        onClose={() => { setFormModalOpen(false); setSelectedVocab(null); }}
        onSave={handleSaveVocabulary}
      />

      {/* Import Modal */}
      <VocabularyImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* Generate Exercises Modal */}
      <ExerciseGenerateModal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        onGenerate={handleGenerateExercises}
      />
    </div>
  );
}
