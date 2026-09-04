import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SignupForm from '../features/authentication/components/SignupForm'

export default function Signup() {
  const navigate = useNavigate()

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/', { replace: true })
    }
  }, [navigate])

  return <SignupForm />
}

