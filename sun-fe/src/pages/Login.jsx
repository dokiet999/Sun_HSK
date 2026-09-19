import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import LoginForm from '../features/authentication/components/LoginForm'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (localStorage.getItem('token')) {
      const from = location.state?.from || '/'
      navigate(from, { replace: true })
    }
  }, [navigate, location])

  return <LoginForm />
}
