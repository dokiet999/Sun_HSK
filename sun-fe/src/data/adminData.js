// ── Visitor data (last 14 days) ──────────────────────────────
const today = new Date()
export const visitorData = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(today)
  d.setDate(d.getDate() - (13 - i))
  const label = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  return {
    label,
    visitors:    Math.floor(Math.random() * 500) + 120,
    pageViews:   Math.floor(Math.random() * 1200) + 300,
    examAttempts: Math.floor(Math.random() * 180) + 30,
  }
})

export const totalVisitors    = visitorData.reduce((s, d) => s + d.visitors, 0)
export const totalPageViews   = visitorData.reduce((s, d) => s + d.pageViews, 0)
export const totalAttempts    = visitorData.reduce((s, d) => s + d.examAttempts, 0)

// ── Dashboard stats ───────────────────────────────────────────
export const dashStats = [
  { id: 'visitors',  label: 'Lượt truy cập',  value: totalVisitors.toLocaleString(), change: '+12.4%', up: true,  icon: '👥', color: '#3b82f6' },
  { id: 'pageviews', label: 'Lượt xem trang', value: totalPageViews.toLocaleString(), change: '+8.7%',  up: true,  icon: '📄', color: '#8b5cf6' },
  { id: 'attempts',  label: 'Lượt làm đề',    value: totalAttempts.toLocaleString(),  change: '+21.3%', up: true,  icon: '📝', color: '#22c55e' },
  { id: 'users',     label: 'Thành viên mới',  value: '1,248',                         change: '-3.1%',  up: false, icon: '🎓', color: '#f59e0b' },
]

// ── Traffic sources ───────────────────────────────────────────
export const trafficSources = [
  { name: 'Tìm kiếm Google', value: 52, color: '#3b82f6' },
  { name: 'Trực tiếp',       value: 24, color: '#8b5cf6' },
  { name: 'Mạng xã hội',     value: 15, color: '#22c55e' },
  { name: 'Giới thiệu',      value:  9, color: '#f59e0b' },
]

// ── Top pages ─────────────────────────────────────────────────
export const topPages = [
  { path: '/',             label: 'Trang chủ',    views: 4821, change: '+5%' },
  { path: '/hsk-tests',   label: 'Đề thi HSK',   views: 3104, change: '+18%' },
  { path: '/hsk-tests/3', label: 'HSK 3 — Đề',   views: 1893, change: '+31%' },
  { path: '/hsk-tests/4', label: 'HSK 4 — Đề',   views: 1560, change: '+9%' },
  { path: '/login',        label: 'Đăng nhập',    views:  980, change: '-2%' },
]

// ── Recent activity ───────────────────────────────────────────
export const recentActivity = [
  { id: 1, type: 'user',    msg: 'Người dùng mới đăng ký',          time: '2 phút trước',  icon: '👤' },
  { id: 2, type: 'exam',    msg: 'HSK 3 Đề số 5 — 24 lượt làm',    time: '8 phút trước',  icon: '📝' },
  { id: 3, type: 'user',    msg: '3 người dùng mới trong 1 giờ',    time: '1 giờ trước',   icon: '👥' },
  { id: 4, type: 'system',  msg: 'Backup dữ liệu thành công',       time: '3 giờ trước',   icon: '✅' },
  { id: 5, type: 'exam',    msg: 'Đề thi HSK 1 mới được thêm',      time: '5 giờ trước',   icon: '➕' },
  { id: 6, type: 'traffic', msg: 'Đỉnh lưu lượng: 128 người/phút', time: 'Hôm qua',       icon: '📈' },
]

// ── Admin exam list ───────────────────────────────────────────
import { hskLevels, examsByLevel } from './examData'

export const adminExams = hskLevels.flatMap((level) =>
  (examsByLevel[level.id] ?? []).map((exam) => ({
    ...exam,
    level: level.label,
    levelColor: level.color,
    status: Math.random() > 0.2 ? 'Hiển thị' : 'Ẩn',
    createdAt: `${2022 + Math.floor(Math.random() * 3)}-0${Math.floor(Math.random() * 9) + 1}-${Math.floor(Math.random() * 27) + 1}`.slice(0, 10),
  }))
)
