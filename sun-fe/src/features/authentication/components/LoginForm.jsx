import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import { authService } from '../../../services/authService'
import styles from './LoginForm.module.css'

export default function LoginForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Vui lòng điền đầy đủ thông tin.')
      return
    }
    setError('')
    try {
      const data = await authService.login(form.email, form.password)
      if (data && data.result && data.result.accessToken) {
        localStorage.setItem('token', data.result.accessToken)
        if (data.result.refreshToken) {
          localStorage.setItem('refreshToken', data.result.refreshToken)
        }
        localStorage.setItem('user', JSON.stringify(data.result.user))
        window.dispatchEvent(new Event('storage'))
        
        // Kiểm tra role để chuyển hướng
        if (data.result.user && data.result.user.role === 'ADMIN') {
          navigate('/admin')
        } else {
          navigate('/')
        }
      } else {
        setError('Đăng nhập thất bại.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Sai tài khoản hoặc mật khẩu!')
    }
  }

  return (
    <div className={styles.wrapper}>
      {/* Left panel */}
      <div className={styles.panel}>
        <div className={styles.panelContent}>
          <div className={styles.hanziDecor} aria-hidden="true">汉</div>
          <h2 className={styles.panelTitle}>Chào mừng trở lại!</h2>
          <p className={styles.panelDesc}>
            Tiếp tục hành trình chinh phục tiếng Trung và luyện thi HSK của bạn.
          </p>
          <div className={styles.statRow}>
            <div className={styles.stat}><strong>HSK 1–6</strong><span>Đầy đủ cấp độ</span></div>
            <div className={styles.stat}><strong>10K+</strong><span>Học viên</span></div>
            <div className={styles.stat}><strong>50K+</strong><span>Từ vựng</span></div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className={styles.formSide}>
        <div className={styles.formBox}>
          <Link to="/" className={styles.brand}>
            <span className={styles.brandMark}>汉</span>
            <span>Sun HSK</span>
          </Link>

          <h1 className={styles.title}>Đăng nhập</h1>
          <p className={styles.subtitle}>
            Chưa có tài khoản?{' '}
            <Link to="/signup" className={styles.link}>Đăng ký ngay</Link>
          </p>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {error && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.field}>
              <label htmlFor="login-email" className={styles.label}>Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={handleChange}
                className={styles.input}
                autoComplete="email"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="login-password" className={styles.label}>
                Mật khẩu
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                className={styles.input}
                autoComplete="current-password"
              />
              <div className={styles.forgotContainer}>
                <Link to="/forgot-password" className={`${styles.link} ${styles.forgot}`}>
                  Quên mật khẩu?
                </Link>
              </div>
            </div>

            <Button type="submit" variant="primary" className={styles.submitBtn}>
              Đăng nhập →
            </Button>
          </form>

          <div className={styles.divider}><span>hoặc</span></div>

          <button className={styles.socialBtn}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
              <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05" />
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
            </svg>
            Tiếp tục với Google
          </button>
        </div>
      </div>
    </div>
  )
}
