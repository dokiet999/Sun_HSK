import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { examService } from "../services/examService"
import styles from "./ExamIntro.module.css"

const SECTION_META = {
  LISTENING: { zh: "听力", vi: "Nghe", color: "#4f46e5" },
  READING: { zh: "阅读", vi: "Đọc", color: "#0891b2" },
  WRITING: { zh: "书写", vi: "Viết", color: "#059669" },
}

const HSK_STANDARD_BREAKDOWN = {
  1: {
    LISTENING: { parts: [5, 5, 5, 5], time: "15'" },
    READING: { parts: [5, 5, 5, 5], time: "17'" },
  },
  2: {
    LISTENING: { parts: [10, 10, 10, 5], time: "25'" },
    READING: { parts: [5, 5, 5, 10], time: "22'" },
  },
  3: {
    LISTENING: { parts: [10, 10, 10, 10], time: "35'" },
    READING: { parts: [10, 10, 10], time: "30'" },
    WRITING: { parts: [5, 5], time: "15'" },
  },
  4: {
    LISTENING: { parts: [10, 15, 20], time: "30'" },
    READING: { parts: [10, 10, 20], time: "40'" },
    WRITING: { parts: [10, 5], time: "25'" },
  },
  5: {
    LISTENING: { parts: [20, 25], time: "30'" },
    READING: { parts: [15, 20, 10], time: "45'" },
    WRITING: { parts: [8, 2], time: "40'" },
  },
  6: {
    LISTENING: { parts: [15, 15, 20], time: "35'" },
    READING: { parts: [10, 10, 10, 20], time: "50'" },
    WRITING: { parts: [1], time: "45'" },
  },
}

const TYPE_LABEL = { MOCK_EXAM: "Thi thử", PRACTICE: "Luyện tập" }

export default function ExamIntro() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [exam, setExam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    examService.getExamDetail(id)
      .then(res => setExam(res.result))
      .catch(() => {
        alert("Không thể tải thông tin đề thi.")
        navigate("/hsk-tests")
      })
      .finally(() => setLoading(false))
  }, [id, navigate])

  function handleStart() {
    setStarting(true)
    navigate(`/hsk-tests/take/${id}`)
  }

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p>Đang tải thông tin đề thi...</p>
      </div>
    )
  }

  if (!exam) return null

  const sections = exam.sections || []
  const totalTime = exam.timeLimit || 0
  const totalQ = exam.totalQuestions || 0

  function getSectionBreakdown(sec) {
    const std = HSK_STANDARD_BREAKDOWN[exam.hskLevel]?.[sec.sectionType]
    const qList = sec.questions || []
    const count = qList.length || 0

    // Nếu số câu khớp cấu trúc chuẩn HSK
    if (std && count === std.parts.reduce((a, b) => a + b, 0)) {
      return { parts: std.parts, total: count, time: std.time }
    }

    // Nếu có danh sách câu hỏi trong DB, nhóm theo questionType
    if (qList.length > 0) {
      const groups = []
      let currentType = null
      let currentCount = 0
      for (const q of qList) {
        if (q.questionType !== currentType) {
          if (currentCount > 0) groups.push(currentCount)
          currentType = q.questionType
          currentCount = 1
        } else {
          currentCount++
        }
      }
      if (currentCount > 0) groups.push(currentCount)

      const proportionalMins = Math.round((count / (totalQ || 1)) * totalTime)
      return {
        parts: groups,
        total: count,
        time: std?.time || (proportionalMins > 0 ? `${proportionalMins}'` : "—")
      }
    }

    // Nếu không có mảng câu hỏi nhưng có chuẩn
    if (std) {
      return { parts: std.parts, total: std.parts.reduce((a, b) => a + b, 0), time: std.time }
    }

    return { parts: [count], total: count, time: "—" }
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>Sun<span>HSK</span></div>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ← Quay lại danh sách
        </button>
      </header>

      <main className={styles.main}>
        {/* Banner thông tin đề */}
        <div className={styles.hero}>
          <div className={styles.levelBadge}>HSK {exam.hskLevel}</div>
          <h1 className={styles.examTitle}>{exam.title}</h1>
          <p className={styles.examDesc}>
            {exam.description || "Bài kiểm tra đánh giá toàn diện năng lực tiếng Hán theo tiêu chuẩn khảo thí HSK quốc tế."}
          </p>
          <div className={styles.metaRow}>
            <span className={styles.metaItem}><span></span> {totalQ} câu hỏi</span>
            <span className={styles.metaItem}><span>⏱</span> {totalTime} phút</span>
            <span className={styles.metaItem}><span></span> {TYPE_LABEL[exam.examType] || exam.examType}</span>
            <span className={styles.metaItem}><span></span> Điểm đạt: {exam.passingScore}%</span>
          </div>
        </div>

        {/* ── CẤU TRÚC ĐỀ THI (HTML TEMPLATE) ── */}
        <section className={styles["structure-section"]}>
          <h2 className={styles["section-title"]}>
            <span className={styles["section-icon"]} aria-hidden="true">☷</span>
            Cấu trúc đề thi
          </h2>

          <div className={styles["table-container"]}>
            <table className={styles["structure-table"]}>
              <thead>
                <tr>
                  <th>Nội dung thi</th>
                  <th>Câu hỏi</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {sections.map(sec => {
                  const meta = SECTION_META[sec.sectionType] || { zh: sec.sectionType, vi: "", color: "#4f46e5" }
                  const { parts, total, time } = getSectionBreakdown(sec)
                  const rowSpan = parts.length + 1

                  return [
                    /* Dòng đầu tiên của kỹ năng */
                    <tr key={`${sec.id}-part-0`}>
                      <td rowSpan={rowSpan} className={styles["skill-name"]}>
                        {meta.zh}
                        <small className={styles["skill-subtitle"]}>({meta.vi})</small>
                      </td>
                      <td className={styles["question-detail"]}>{parts[0]}</td>
                      <td rowSpan={rowSpan} className={styles["time-duration"]}>{time}</td>
                    </tr>,

                    /* Các dòng câu hỏi chi tiết tiếp theo */
                    ...parts.slice(1).map((pCount, pIdx) => (
                      <tr key={`${sec.id}-part-${pIdx + 1}`}>
                        <td className={styles["question-detail"]}>{pCount}</td>
                      </tr>
                    )),

                    /* Dòng tổng số câu của kỹ năng */
                    <tr key={`${sec.id}-total`}>
                      <td className={styles["question-count"]}>{total}</td>
                    </tr>
                  ]
                })}

                {/* Dòng tổng kết đề thi */}
                <tr className={styles["total-summary-row"]}>
                  <td className={styles["skill-name"]}>
                    <strong>Tổng cộng</strong>
                  </td>
                  <td className={styles["question-count"]}>
                    {totalQ}
                  </td>
                  <td className={styles["time-duration"]}>
                    {totalTime}'
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Lưu ý trước khi thi */}
        <section className={styles["notice-section"]}>
          <h2 className={styles["section-title"]}>
            <span className={styles["section-icon"]}>ℹ️</span>
            Lưu ý trước khi làm bài
          </h2>
          <ul className={styles["notice-list"]}>
            <li>Đồng hồ đếm ngược sẽ bắt đầu chạy ngay khi bấm <strong>Bắt đầu thi</strong>.</li>
            <li>Hệ thống tự động lưu câu trả lời sau mỗi lần chọn đáp án.</li>
            <li>Hết giờ làm bài, hệ thống sẽ tự động nộp bài và tính điểm.</li>
            <li>Nếu cần rời bài thi sớm, bạn có thể bấm nút <strong>×</strong> ở góc trên để xác nhận nộp bài sớm.</li>
            <li>Sau khi nộp bài thành công, bạn sẽ xem được bảng điểm chi tiết và giải thích đáp án từng câu.</li>
          </ul>
        </section>

        {/* Nút hành động */}
        <div className={styles["cta-row"]}>
          <button className={styles["cancel-btn"]} onClick={() => navigate(-1)}>
            Quay lại
          </button>
          <button
            className={styles["start-btn"]}
            onClick={handleStart}
            disabled={starting}
          >
            {starting ? "Đang chuẩn bị đề..." : "Bắt đầu thi ngay"}
          </button>
        </div>
      </main>
    </div>
  )
}
