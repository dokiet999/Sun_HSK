import { useState } from 'react'
import { visitorData } from '../../../data/adminData'
import styles from './VisitorChart.module.css'

const METRICS = [
  { key: 'visitors',    label: 'Người truy cập', color: '#3b82f6' },
  { key: 'pageViews',   label: 'Lượt xem trang',  color: '#8b5cf6' },
  { key: 'examAttempts', label: 'Làm đề',          color: '#22c55e' },
]

export default function VisitorChart() {
  const [active, setActive] = useState('visitors')
  const [hovered, setHovered] = useState(null)

  const metric = METRICS.find((m) => m.key === active)
  const values = visitorData.map((d) => d[active])
  const maxVal  = Math.max(...values)

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Lưu lượng truy cập</div>
          <div className={styles.subtitle}>14 ngày gần nhất</div>
        </div>
        <div className={styles.metricTabs}>
          {METRICS.map((m) => (
            <button
              key={m.key}
              className={`${styles.tab} ${active === m.key ? styles.tabActive : ''}`}
              style={active === m.key ? { background: m.color + '18', color: m.color, borderColor: m.color + '40' } : {}}
              onClick={() => setActive(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div className={styles.chartWrap}>
        <div className={styles.chart}>
          {visitorData.map((d, i) => {
            const pct = (d[active] / maxVal) * 100
            const isHovered = hovered === i
            return (
              <div
                key={i}
                className={styles.barGroup}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className={styles.tooltip}>
                    <strong>{d.label}</strong>
                    <span>{d[active].toLocaleString()} {metric.label}</span>
                  </div>
                )}

                {/* Bar */}
                <div className={styles.barOuter}>
                  <div
                    className={styles.bar}
                    style={{
                      height: `${pct}%`,
                      background: isHovered
                        ? metric.color
                        : metric.color + 'b0',
                    }}
                  />
                </div>

                {/* X Label */}
                <div className={styles.xLabel}>{d.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Total */}
      <div className={styles.total}>
        Tổng: <strong style={{ color: metric.color }}>
          {values.reduce((s, v) => s + v, 0).toLocaleString()}
        </strong> {metric.label} trong 14 ngày
      </div>
    </div>
  )
}
