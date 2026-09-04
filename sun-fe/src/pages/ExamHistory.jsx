import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { examService } from '../services/examService'
import styles from './ExamHistory.module.css'

const STATUS_LABEL = {
  SUBMITTED: 'Đã nộp',
  IN_PROGRESS: 'Đang làm',
  EXPIRED: 'Hết giờ',
}

const TYPE_LABEL = {
  MOCK: 'Thi thử',
  REAL: 'Đề thật',
  PRACTICE: 'Luyện tập',
}

function formatTime(secs) {
  if (!secs) return '—'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}p ${String(s).padStart(2, '0')}s`
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function ExamHistory() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const examId = searchParams.get('examId') // lọc theo đề thi cụ thể nếu có

  const [history, setHistory]   = useState([])
  const [page, setPage]         = useState(0)
  const [totalPages, setTotal]  = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    fetchHistory(page)
  }, [page])

  async function fetchHistory(p) {
    try {
      setLoading(true)
      setError(null)
      const data = await examService.getHistory(p, 50) // lấy nhiều hơn để lọc client-side
      if (data?.result) {
        let content = data.result.content || []
        // Lọc theo examId nếu đến từ card đề thi
        if (examId) {
          content = content.filter(h => h.examId === examId)
        }
        setHistory(content)
        setTotal(data.result.totalPages || 0)
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Bạn cần đăng nhập để xem lịch sử làm bài.')
      } else {
        setError('Không thể tải lịch sử. Vui lòng thử lại.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(examId ? '/hsk-tests' : '/')}>
          ← Quay lại
        </button>
        <div>
          <h1 className={styles.title}>📚 Lịch sử làm bài</h1>
          <p className={styles.subtitle}>
            {examId
              ? `Lọc theo đề thi · ${history.length} lần làm`
              : 'Xem lại tất cả các lần bạn đã làm bài thi'
            }
          </p>
        </div>
        {examId && (
          <button
            className={styles.clearFilterBtn}
            onClick={() => navigate('/history')}
          >
            ✕ Bỏ lọc
          </button>
        )}
      </div>

      {loading && (
        <div className={styles.center}>
          <div className={styles.spinner} />
          <p>Đang tải lịch sử...</p>
        </div>
      )}

      {error && (
        <div className={styles.errorBox}>
          <span>⚠️ {error}</span>
          {error.includes('đăng nhập') && (
            <button className={styles.loginBtn} onClick={() => navigate('/login')}>
              Đăng nhập ngay
            </button>
          )}
        </div>
      )}

      {!loading && !error && history.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📝</div>
          <p>Bạn chưa làm bài thi nào.</p>
          <button className={styles.startBtn} onClick={() => navigate('/hsk-tests')}>
            Bắt đầu làm bài ngay →
          </button>
        </div>
      )}

      {!loading && !error && history.length > 0 && (
        <>
          {/* Stats bar */}
          <div className={styles.statsBar}>
            <div className={styles.statItem}>
              <span className={styles.statNum}>{history.length}</span>
              <span className={styles.statLabel}>Lần thi trong trang này</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNum} style={{ color: '#16a34a' }}>
                {history.filter(h => h.passed).length}
              </span>
              <span className={styles.statLabel}>Lần đạt</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNum} style={{ color: '#dc2626' }}>
                {history.filter(h => !h.passed && h.status === 'SUBMITTED').length}
              </span>
              <span className={styles.statLabel}>Lần chưa đạt</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNum}>
                {history.length > 0
                  ? Math.round(history.filter(h => h.status === 'SUBMITTED').reduce((s, h) => s + (Number(h.scorePercent) || 0), 0) / Math.max(history.filter(h => h.status === 'SUBMITTED').length, 1))
                  : 0}%
              </span>
              <span className={styles.statLabel}>Trung bình điểm</span>
            </div>
          </div>

          {/* Table */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên đề thi</th>
                  <th>Cấp độ</th>
                  <th>Loại</th>
                  <th>Điểm</th>
                  <th>% Điểm</th>
                  <th>Thời gian làm</th>
                  <th>Trạng thái</th>
                  <th>Ngày thi</th>
                  <th>Xem lại</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => {
                  const pct = Number(item.scorePercent) || 0
                  return (
                    <tr key={item.attemptId} className={item.passed ? styles.rowPass : item.status === 'SUBMITTED' ? styles.rowFail : ''}>
                      <td className={styles.num}>{page * 10 + idx + 1}</td>
                      <td className={styles.examTitle}>{item.examTitle}</td>
                      <td>
                        <span className={styles.levelBadge}>HSK {item.hskLevel}</span>
                      </td>
                      <td className={styles.type}>{TYPE_LABEL[item.examType] || item.examType}</td>
                      <td className={styles.score}>
                        <span className={item.passed ? styles.scoreGreen : styles.scoreRed}>
                          {item.totalScore} / {item.totalPoints}
                        </span>
                      </td>
                      <td>
                        <div className={styles.pctWrap}>
                          <div className={styles.pctBar}>
                            <div
                              className={`${styles.pctFill} ${item.passed ? styles.pctGreen : styles.pctRed}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className={styles.pctText}>{pct}%</span>
                        </div>
                      </td>
                      <td className={styles.time}>{formatTime(item.timeSpentSecs)}</td>
                      <td>
                        {item.status === 'SUBMITTED' ? (
                          <span className={item.passed ? styles.badgePass : styles.badgeFail}>
                            {item.passed ? '✅ Đạt' : '❌ Chưa đạt'}
                          </span>
                        ) : (
                          <span className={styles.badgeNeutral}>{STATUS_LABEL[item.status] || item.status}</span>
                        )}
                      </td>
                      <td className={styles.date}>{formatDate(item.submittedAt || item.startedAt)}</td>
                      <td>
                        {item.status === 'SUBMITTED' ? (
                          <button
                            className={styles.reviewBtn}
                            onClick={() => navigate(`/history/${item.attemptId}/result`)}
                          >
                            Xem lại
                          </button>
                        ) : (
                          <span className={styles.noReview}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                ← Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i).map(p => (
                <button
                  key={p}
                  className={`${styles.pageNum} ${p === page ? styles.pageActive : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p + 1}
                </button>
              ))}
              <button
                className={styles.pageBtn}
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
