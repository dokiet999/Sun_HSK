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
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Validate single field
  function validateField(name, value, allValues = form) {
    switch (name) {
      case 'fullName': {
        const val = (value || '').trim()
        if (!val) return 'Vui lòng nhập họ và tên.'
        if (val.length < 2) return 'Họ và tên phải có ít nhất 2 ký tự.'
        if (val.length > 100) return 'Họ và tên không được vượt quá 100 ký tự.'
        return ''
      }

      case 'email': {
        const val = (value || '').trim()
        if (!val) return 'Vui lòng nhập địa chỉ email.'
        // Standard RFC 5322 regex pattern for valid email
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        if (!emailRegex.test(val)) return 'Email không đúng định dạng (ví dụ: name@example.com).'
        return ''
      }

      case 'password': {
        const val = value || ''
        if (!val) return 'Vui lòng nhập mật khẩu.'
        if (val.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.'
        if (val.length > 64) return 'Mật khẩu không được vượt quá 64 ký tự.'
        const hasLetter = /[a-zA-Z]/.test(val)
        const hasNumber = /\d/.test(val)
        if (!hasLetter || !hasNumber) return 'Mật khẩu phải chứa ít nhất 1 chữ cái và 1 chữ số.'
        return ''
      }

      case 'confirmPassword': {
        const val = value || ''
        if (!val) return 'Vui lòng xác nhận lại mật khẩu.'
        if (val !== allValues.password) return 'Mật khẩu xác nhận không trùng khớp.'
        return ''
      }

      default:
        return ''
    }
  }

  // Validate entire form
  function validateAll(values = form) {
    const errs = {}
    const nameErr = validateField('fullName', values.fullName, values)
    if (nameErr) errs.fullName = nameErr

    const emailErr = validateField('email', values.email, values)
    if (emailErr) errs.email = emailErr

    const passErr = validateField('password', values.password, values)
    if (passErr) errs.password = passErr

    const confirmErr = validateField('confirmPassword', values.confirmPassword, values)
    if (confirmErr) errs.confirmPassword = confirmErr

    return errs
  }

  function handleChange(e) {
    const { name, value } = e.target
    const updatedForm = { ...form, [name]: value }
    setForm(updatedForm)

    // Clear top-level API banner if user continues editing
    if (errors.api) {
      setErrors((prev) => {
        const copy = { ...prev }
        delete copy.api
        return copy
      })
    }

    // Real-time validation if the field was touched or has an active error
    if (touched[name] || errors[name]) {
      const err = validateField(name, value, updatedForm)
      setErrors((prev) => ({ ...prev, [name]: err }))
    }

    // If password changed, also recheck confirmPassword if it was typed
    if (name === 'password' && form.confirmPassword) {
      const confirmErr = validateField('confirmPassword', form.confirmPassword, updatedForm)
      setErrors((prev) => ({ ...prev, confirmPassword: confirmErr }))
    }
  }

  function handleBlur(e) {
    const { name, value } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    const err = validateField(name, value, form)
    setErrors((prev) => ({ ...prev, [name]: err }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    // Mark all input fields as touched
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    })

    const errs = validateAll(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      // Focus first field that has an error
      if (errs.fullName) document.getElementById('signup-name')?.focus()
      else if (errs.email) document.getElementById('signup-email')?.focus()
      else if (errs.password) document.getElementById('signup-password')?.focus()
      else if (errs.confirmPassword) document.getElementById('signup-confirm')?.focus()
      return
    }

    setLoading(true)

    try {
      const payload = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        displayName: form.fullName.trim(),
      }

      const res = await authService.register(payload)

      // Xử lý auto-login ngay sau khi đăng ký thành công
      let accessToken = res?.result?.accessToken
      let refreshToken = res?.result?.refreshToken
      let user = res?.result?.user

      // Fallback: nếu đăng ký không kèm token thì login ngay
      if (!accessToken) {
        const loginRes = await authService.login(payload.email, payload.password)
        accessToken = loginRes?.result?.accessToken
        refreshToken = loginRes?.result?.refreshToken
        user = loginRes?.result?.user
      }

      if (accessToken) {
        localStorage.setItem('token', accessToken)
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken)
        }
        if (user) {
          localStorage.setItem('user', JSON.stringify(user))
        }
        if (form.level) {
          localStorage.setItem('user_level', form.level)
        }

        // Báo hiệu cập nhật session cho Navbar và các component
        window.dispatchEvent(new Event('storage'))

        // Redirect thẳng sang trang chính
        if (user?.role === 'ADMIN') {
          navigate('/admin', { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      } else {
        setErrors({ api: 'Không thể tự động đăng nhập. Vui lòng đăng nhập bằng tài khoản vừa tạo.' })
        navigate('/login')
      }
    } catch (error) {
      const respData = error.response?.data
      const errorMsg = respData?.message || ''

      if (errorMsg === 'Email đã được sử dụng' || errorMsg.toLowerCase().includes('email')) {
        setErrors((prev) => ({
          ...prev,
          email: 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc chọn email khác.',
        }))
        document.getElementById('signup-email')?.focus()
      } else if (respData?.result && typeof respData.result === 'object') {
        setErrors((prev) => ({ ...prev, ...respData.result }))
      } else {
        setErrors((prev) => ({
          ...prev,
          api: errorMsg || 'Đăng ký thất bại, vui lòng thử lại.',
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  // Password rule indicators
  const isLengthValid = form.password.length >= 8
  const isCharValid = /[a-zA-Z]/.test(form.password) && /\d/.test(form.password)

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
            {errors.api && (
              <div className={styles.errorBanner}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errors.api}</span>
              </div>
            )}

            {/* Full name */}
            <div className={styles.field}>
              <label htmlFor="signup-name" className={styles.label}>
                Họ và tên <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="signup-name"
                name="fullName"
                type="text"
                placeholder="Nguyễn Văn A"
                value={form.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${styles.input} ${errors.fullName ? styles.inputError : ''}`}
                autoComplete="name"
              />
              {errors.fullName && (
                <span className={styles.fieldError}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {errors.fullName}
                </span>
              )}
            </div>

            {/* Email */}
            <div className={styles.field}>
              <label htmlFor="signup-email" className={styles.label}>
                Email <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="signup-email"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                autoComplete="email"
              />
              {errors.email && (
                <span className={styles.fieldError}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {errors.email}
                </span>
              )}
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

            {/* Password & Confirm Password */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="signup-password" className={styles.label}>
                  Mật khẩu <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className={styles.inputGroup}>
                  <input
                    id="signup-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Tối thiểu 8 ký tự"
                    value={form.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`${styles.input} ${styles.inputWithToggle} ${errors.password ? styles.inputError : ''}`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <span className={styles.fieldError}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {errors.password}
                  </span>
                )}
                {/* Visual rule checklist when entering password */}
                {form.password && (
                  <div className={styles.passwordRules}>
                    <span className={`${styles.ruleItem} ${isLengthValid ? styles.ruleValid : ''}`}>
                      {isLengthValid ? '✓' : '•'} Ít nhất 8 ký tự
                    </span>
                    <span className={`${styles.ruleItem} ${isCharValid ? styles.ruleValid : ''}`}>
                      {isCharValid ? '✓' : '•'} Gồm chữ & số
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="signup-confirm" className={styles.label}>
                  Xác nhận <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className={styles.inputGroup}>
                  <input
                    id="signup-confirm"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`${styles.input} ${styles.inputWithToggle} ${errors.confirmPassword ? styles.inputError : ''}`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showConfirmPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className={styles.fieldError}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {errors.confirmPassword}
                  </span>
                )}
              </div>
            </div>

            <p className={styles.terms}>
              Bằng cách đăng ký, bạn đồng ý với{' '}
              <a href="/terms" className={styles.link}>Điều khoản dịch vụ</a>
              {' '}và{' '}
              <a href="/privacy" className={styles.link}>Chính sách bảo mật</a>.
            </p>

            <Button type="submit" variant="primary" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Đang tạo tài khoản & đăng nhập...' : 'Đăng ký miễn phí →'}
            </Button>
          </form>

          <div className={styles.divider}><span>hoặc</span></div>

          <button className={styles.socialBtn} type="button">
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
