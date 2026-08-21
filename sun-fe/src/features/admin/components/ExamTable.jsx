import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { hskLevels } from '../../../data/examData'
import { adminService } from '../../../services/adminService'
import styles from './ExamTable.module.css'

const PAGE_SIZE = 10

const diffClass = {
  'Dễ': styles.diffEasy,
  'Trung bình': styles.diffMedium,
  'Khó': styles.diffHard,
}

export default function ExamTable() {
  const navigate = useNavigate()
  const [search, setSearch]     = useState('')
  const [levelFilter, setLevel] = useState('all')
  const [statusFilter, setStatus] = useState('all')
  const [page, setPage]         = useState(1)

  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchExams()
  }, [])

  async function fetchExams() {
    try {
      setLoading(true)
      const data = await adminService.getExams(0, 100)
      if (data && data.result && data.result.content) {
        const mapped = data.result.content.map(e => {
          const levelInfo = hskLevels.find(l => l.id === e.hskLevel) || { label: `HSK ${e.hskLevel}`, color: '#3b82f6' }
          return {
            ...e,
            level: levelInfo.label,
            levelColor: levelInfo.color,
            type: e.examType,
            difficulty: 'Trung bình', // Mock
            attempts: 0, // Mock
            rating: 4.5, // Mock
            createdAt: new Date(e.createdAt).toLocaleDateString('vi-VN'),
            status: e.status === 'PUBLISHED' ? 'Hiển thị' : 'Ẩn'
          }
        })
        setExams(mapped)
      }
    } catch (err) {
      setError('Lỗi khi tải danh sách đề thi.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    let list = exams
    if (search)            list = list.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()))
    if (levelFilter !== 'all') list = list.filter((e) => e.level === levelFilter)
    if (statusFilter !== 'all') list = list.filter((e) => e.status === statusFilter)
    return list
  }, [exams, search, levelFilter, statusFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function toggleStatus(id) {
    const exam = exams.find(e => e.id === id)
    if (exam.status === 'Hiển thị') {
      alert('Backend chưa hỗ trợ tính năng ẩn đề thi (Unpublish).')
      return
    }
    try {
      await adminService.publishExam(id)
      setExams((prev) =>
        prev.map((e) => e.id === id ? { ...e, status: 'Hiển thị' } : e)
      )
    } catch (err) {
      alert('Lỗi khi công bố đề thi.')
    }
  }

  async function deleteExam(id) {
    if (window.confirm('Xác nhận xóa đề thi này?')) {
      try {
        await adminService.deleteExam(id)
        setExams((prev) => prev.filter((e) => e.id !== id))
      } catch (err) {
        alert('Lỗi khi xóa đề thi.')
      }
    }
  }

  return (
    <div className={styles.wrapper}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <input
            className={styles.searchInput}
            placeholder="🔍 Tìm kiếm đề thi..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
          <select
            className={styles.select}
            value={levelFilter}
            onChange={(e) => { setLevel(e.target.value); setPage(1) }}
          >
            <option value="all">Tất cả cấp độ</option>
            {hskLevels.map((l) => <option key={l.id} value={l.label}>{l.label}</option>)}
          </select>
          <select
            className={styles.select}
            value={statusFilter}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Hiển thị">Hiển thị</option>
            <option value="Ẩn">Ẩn</option>
          </select>
        </div>
        <button className={styles.addBtn} onClick={() => navigate('/admin/exams/create')}>
          ＋ Thêm đề thi
        </button>
      </div>

      {/* Count */}
      <div className={styles.countRow}>
        <span>{filtered.length} đề thi</span>
        {(search || levelFilter !== 'all' || statusFilter !== 'all') && (
          <button className={styles.clearBtn} onClick={() => { setSearch(''); setLevel('all'); setStatus('all'); setPage(1) }}>
            Xóa bộ lọc ×
          </button>
        )}
      </div>

      {loading && <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu...</div>}
      {error && <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{error}</div>}

      {/* Table */}
      {!loading && !error && (
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Tên đề thi</th>
              <th>Cấp độ</th>
              <th>Loại</th>
              <th>Độ khó</th>
              <th>Lượt làm</th>
              <th>Đánh giá</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((exam, i) => (
              <tr key={exam.id}>
                <td className={styles.num}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                <td className={styles.titleCell}>
                  <div className={styles.examTitle}>{exam.title}</div>
                  <div className={styles.examDate}>{exam.createdAt}</div>
                </td>
                <td>
                  <span className={styles.levelBadge}
                    style={{ background: exam.levelColor + '18', color: exam.levelColor }}>
                    {exam.level}
                  </span>
                </td>
                <td className={styles.type}>{exam.type}</td>
                <td>
                  <span className={`${styles.diff} ${diffClass[exam.difficulty]}`}>
                    {exam.difficulty}
                  </span>
                </td>
                <td className={styles.attempts}>{exam.attempts.toLocaleString()}</td>
                <td className={styles.rating}>⭐ {exam.rating}</td>
                <td>
                  <button
                    className={`${styles.statusBtn} ${exam.status === 'Hiển thị' ? styles.statusOn : styles.statusOff}`}
                    onClick={() => toggleStatus(exam.id)}
                  >
                    {exam.status}
                  </button>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.actionBtn} title="Chỉnh sửa" onClick={() => navigate(`/admin/exams/${exam.id}`)}>✏️</button>
                    <button className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      title="Xóa" onClick={() => deleteExam(exam.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className={styles.empty}>Không tìm thấy đề thi nào phù hợp.</div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className={styles.pageBtn}>← Trước</button>
          <div className={styles.pages}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`${styles.pageNum} ${p === page ? styles.pageActive : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className={styles.pageBtn}>Sau →</button>
        </div>
      )}
    </div>
  )
}
