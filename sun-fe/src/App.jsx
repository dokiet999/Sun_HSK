import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home           from './pages/Home'
import Login          from './pages/Login'
import Signup         from './pages/Signup'
import HskTests       from './pages/HskTests'
import HskLevelExams  from './pages/HskLevelExams'
import AdminDashboard from './pages/AdminDashboard'
import AdminExams     from './pages/AdminExams'
import AdminExamBuilder from './pages/AdminExamBuilder'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                 element={<Home />} />
        <Route path="/login"            element={<Login />} />
        <Route path="/signup"           element={<Signup />} />
        <Route path="/hsk-tests"        element={<HskTests />} />
        <Route path="/hsk-tests/:level" element={<HskLevelExams />} />
        <Route path="/admin"            element={<AdminDashboard />} />
        <Route path="/admin/exams"      element={<AdminExams />} />
        <Route path="/admin/exams/create" element={<AdminExamBuilder />} />
        <Route path="/admin/exams/:id"    element={<AdminExamBuilder />} />
      </Routes>
    </BrowserRouter>
  )
}

