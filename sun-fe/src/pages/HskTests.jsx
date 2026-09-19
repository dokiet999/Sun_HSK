import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageContainer from '../layouts/PageContainer'
import { ExamLevelGrid } from '../features/exam'
import { hskLevels } from '../data/examData'
import { examService } from '../services/examService'
import styles from './HskTests.module.css'

export default function HskTests() {
  const [exams, setExams] = useState([])
  
  useEffect(() => {
    async function fetchExams() {
      try {
        const data = await examService.listExams({ size: 500 }) // Fetch all
        if (data?.result?.content) {
          setExams(data.result.content)
        }
      } catch (err) {
        console.error('Failed to fetch exams', err)
      }
    }
    fetchExams()
  }, [])

  return (
    <PageContainer>
      <div className={styles.pageWrap}>
        {/* Page hero */}
        <div className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.eyebrow}>📝 LUYỆN THI HSK</div>
          <h1 className={styles.heading}>Kho đề thi HSK Online</h1>
          <p className={styles.desc}>
            Luyện tập với hàng chục đề thi mô phỏng theo từng cấp độ. Chọn cấp độ phù hợp
            và bắt đầu bài kiểm tra ngay hôm nay.
          </p>
        </div>
      </div>

      {/* Level grid */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHead}>
            <h2>Chọn cấp độ HSK</h2>
            <p>Mỗi cấp độ có đề thi riêng với cấu trúc và từ vựng phù hợp.</p>
          </div>
          <ExamLevelGrid exams={exams} />
        </div>
      </section>

      {/* Tips */}
      <section className={styles.tipsSection}>
        <div className="container">
          <div className={styles.sectionHead}>
            <h2>Hướng dẫn làm bài thi</h2>
          </div>
          <div className={styles.tipsGrid}>
            {[
              { icon: '🎯', title: 'Chọn đúng cấp độ', desc: 'Bắt đầu với cấp độ phù hợp với trình độ hiện tại. Đừng bỏ qua bước này!' },
              { icon: '⏱',  title: 'Quản lý thời gian', desc: 'Phân bổ thời gian đều cho từng phần. Đừng dừng quá lâu ở một câu.' },
              { icon: '📊', title: 'Xem kết quả chi tiết', desc: 'Sau mỗi đề thi, xem lại đáp án và phần giải thích để cải thiện.' },
              { icon: '🔄', title: 'Luyện nhiều lần', desc: 'Làm đi làm lại nhiều đề để quen với cấu trúc và dạng câu hỏi.' },
            ].map((tip) => (
              <div key={tip.title} className={styles.tipCard}>
                <div className={styles.tipIcon}>{tip.icon}</div>
                <h3>{tip.title}</h3>
                <p>{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </div>
    </PageContainer>
  )
}
