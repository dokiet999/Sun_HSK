import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginForm from '../features/authentication/components/LoginForm'

export default function Login() {
  const navigate = useNavigate()

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/', { replace: true })
    }
  }, [navigate])

  return <LoginForm />
}
