import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home           from './pages/Home'
import Login          from './pages/Login'
import Signup         from './pages/Signup'
import HskTests       from './pages/HskTests'
import HskLevelExams  from './pages/HskLevelExams'
import TakeExam       from './pages/TakeExam'
import ExamIntro      from './pages/ExamIntro'
import AdminDashboard from './pages/AdminDashboard'
import AdminExams     from './pages/AdminExams'
import AdminExamBuilder from './pages/AdminExamBuilder'
import ExamHistory    from './pages/ExamHistory'
import ReviewAttempt  from './pages/ReviewAttempt'
import NotFound       from './pages/NotFound'
import UnderDevelopment from './pages/UnderDevelopment'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                 element={<Home />} />
        <Route path="/login"            element={<Login />} />
        <Route path="/signup"           element={<Signup />} />
        <Route path="/hsk-tests"        element={<HskTests />} />
        <Route path="/hsk-tests/:level" element={<HskLevelExams />} />
        <Route path="/hsk-tests/intro/:id" element={<ExamIntro />} />
        <Route path="/hsk-tests/take/:id" element={<TakeExam />} />
        <Route path="/history"          element={<ExamHistory />} />
        <Route path="/history/:attemptId/result" element={<ReviewAttempt />} />
        <Route path="/admin"            element={<AdminDashboard />} />
        <Route path="/admin/exams"      element={<AdminExams />} />
        <Route path="/admin/exams/create" element={<AdminExamBuilder />} />
        <Route path="/admin/exams/:id"    element={<AdminExamBuilder />} />
        <Route path="/coming-soon"      element={<UnderDevelopment />} />
        <Route path="/under-development" element={<UnderDevelopment />} />
        <Route path="*"                 element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

