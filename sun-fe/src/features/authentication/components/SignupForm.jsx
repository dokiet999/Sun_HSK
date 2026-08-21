import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import { authService } from '../../../services/authService'
import styles from './SignupForm.module.css'

const HSK_LEVELS = ['Chưa biết gì', 'HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6']

export default function SignupForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    level: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' })
    }
  }

  function validate() {
    const errs = {}
    if (!form.fullName.trim())            errs.fullName = 'Vui lòng nhập họ tên.'
    if (!form.email)                       errs.email = 'Vui lòng nhập email.'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email không hợp lệ.'
    if (!form.password)                    errs.password = 'Vui lòng nhập mật khẩu.'
    else if (form.password.length < 8)     errs.password = 'Mật khẩu phải có ít nhất 8 ký tự.'
    if (!form.confirmPassword)             errs.confirmPassword = 'Vui lòng xác nhận mật khẩu.'
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Mật khẩu không khớp.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    
    try {
      await authService.register({
        email: form.email,
        password: form.password,
        displayName: form.fullName, // Adjust property names if backend expects differently
        username: form.email.split('@')[0], // Generate a basic username if not explicitly asked
      })
      alert('Đăng ký thành công! Đang chuyển hướng sang trang đăng nhập...')
      navigate('/login')
    } catch (error) {
      setErrors({ ...errors, api: error.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      {/* Left panel */}
      <div className={styles.panel}>
        <div className={styles.panelContent}>
          <div className={styles.hanziDecor} aria-hidden="true">学</div>
          <h2 className={styles.panelTitle}>Bắt đầu hành trình<br />chinh phục HSK!</h2>
          <p className={styles.panelDesc}>
            Tạo tài khoản miễn phí và bắt đầu luyện thi HSK ngay hôm nay
            với lộ trình được cá nhân hóa theo trình độ của bạn.
          </p>
          <div className={styles.benefits}>
            {[
              { icon: '🎯', text: 'Lộ trình học cá nhân hóa' },
              { icon: '📊', text: 'Theo dõi tiến độ chi tiết' },
              { icon: '🔥', text: 'Streak học mỗi ngày' },
              { icon: '🏆', text: 'Mô phỏng thi HSK thực tế' },
            ].map((b) => (
              <div key={b.text} className={styles.benefit}>
                <span className={styles.benefitIcon}>{b.icon}</span>
                <span>{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className={styles.formSide}>
        <div className={styles.formBox}>
          <Link to="/" className={styles.brand}>
            <span className={styles.brandMark}>☀</span>
            <span>Sun HSK</span>
          </Link>

          <h1 className={styles.title}>Tạo tài khoản</h1>
          <p className={styles.subtitle}>
            Đã có tài khoản?{' '}
            <Link to="/login" className={styles.link}>Đăng nhập ngay</Link>
          </p>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {errors.api && <div className={styles.errorBanner}>{errors.api}</div>}

            {/* Full name */}
            <div className={styles.field}>
              <label htmlFor="signup-name" className={styles.label}>Họ và tên</label>
              <input
                id="signup-name"
                name="fullName"
                type="text"
                placeholder="Nguyễn Văn A"
                value={form.fullName}
                onChange={handleChange}
                className={`${styles.input} ${errors.fullName ? styles.inputError : ''}`}
                autoComplete="name"
              />
              {errors.fullName && <span className={styles.fieldError}>{errors.fullName}</span>}
            </div>

            {/* Email */}
            <div className={styles.field}>
              <label htmlFor="signup-email" className={styles.label}>Email</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={handleChange}
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                autoComplete="email"
              />
              {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
            </div>

            {/* Level */}
            <div className={styles.field}>
              <label htmlFor="signup-level" className={styles.label}>
                Trình độ HSK hiện tại <span className={styles.optional}>(tuỳ chọn)</span>
              </label>
              <select
                id="signup-level"
                name="level"
                value={form.level}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="">-- Chọn trình độ --</option>
                {HSK_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            {/* Password row */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="signup-password" className={styles.label}>Mật khẩu</label>
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                  autoComplete="new-password"
                />
                {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
              </div>
              <div className={styles.field}>
                <label htmlFor="signup-confirm" className={styles.label}>Xác nhận</label>
                <input
                  id="signup-confirm"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && <span className={styles.fieldError}>{errors.confirmPassword}</span>}
              </div>
            </div>

            <p className={styles.terms}>
              Bằng cách đăng ký, bạn đồng ý với{' '}
              <a href="/terms" className={styles.link}>Điều khoản dịch vụ</a>
              {' '}và{' '}
              <a href="/privacy" className={styles.link}>Chính sách bảo mật</a>.
            </p>

            <Button type="submit" variant="primary" className={styles.submitBtn}>
              {loading ? 'Đang tạo tài khoản...' : 'Đăng ký miễn phí →'}
            </Button>
          </form>

          <div className={styles.divider}><span>hoặc</span></div>

          <button className={styles.socialBtn}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            Tiếp tục với Google
          </button>
        </div>
      </div>
    </div>
  )
}
