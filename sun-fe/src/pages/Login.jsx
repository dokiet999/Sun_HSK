import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import LoginForm from '../features/authentication/components/LoginForm'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const searchParams = new URLSearchParams(location.search)
  const redirectParam = searchParams.get('redirect')

  useEffect(() => {
    if (localStorage.getItem('token')) {
      const from = location.state?.from || (redirectParam ? decodeURIComponent(redirectParam) : '/')
      navigate(from, { replace: true })
    }
  }, [navigate, location, redirectParam])

  return <LoginForm />
}
