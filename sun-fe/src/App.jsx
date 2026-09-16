import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home           from './pages/Home'
import Login          from './pages/Login'
import Signup         from './pages/Signup'
import HskTests       from './pages/HskTests'
import HskLevelExams  from './pages/HskLevelExams'
import Hsk3Tests      from './pages/Hsk3Tests'
import TakeExam       from './pages/TakeExam'
import TakeExamHsk3   from './pages/TakeExamHsk3'
import ExamIntro      from './pages/ExamIntro'
import AdminDashboard from './pages/AdminDashboard'
import AdminExams     from './pages/AdminExams'
import AdminExamBuilder from './pages/AdminExamBuilder'
import AdminVocabulary from './pages/AdminVocabulary'
import ExamHistory    from './pages/ExamHistory'
import ReviewAttempt  from './pages/ReviewAttempt'
import NotFound       from './pages/NotFound'
import UnderDevelopment from './pages/UnderDevelopment'
import Vocabulary     from './pages/Vocabulary'
import VocabularyHsk3 from './pages/VocabularyHsk3'
import LessonDetail   from './pages/LessonDetail'
import FlashcardPage  from './pages/FlashcardPage'
import ExercisePage   from './pages/ExercisePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                 element={<Home />} />
        <Route path="/login"            element={<Login />} />
        <Route path="/signup"           element={<Signup />} />

        {/* Online Test Routes: HSK 2.0 & HSK 3.0 iBT */}
        <Route path="/hsk-tests"        element={<HskTests />} />
        <Route path="/hsk-tests/hsk2"   element={<HskTests />} />
        <Route path="/hsk-tests/hsk3"   element={<Hsk3Tests />} />
        <Route path="/hsk-tests/hsk3/take/:id" element={<TakeExamHsk3 />} />
        <Route path="/hsk-tests/:level" element={<HskLevelExams />} />
        <Route path="/hsk-tests/intro/:id" element={<ExamIntro />} />
        <Route path="/hsk-tests/take/:id" element={<TakeExam />} />

        {/* Vocabulary Routes */}
        <Route path="/vocabulary"       element={<Vocabulary version="hsk2" />} />
        <Route path="/vocabulary/hsk2"  element={<Vocabulary version="hsk2" />} />
        <Route path="/vocabulary/hsk2/:level" element={<Vocabulary version="hsk2" />} />
        <Route path="/vocabulary/hsk3"  element={<VocabularyHsk3 />} />
        <Route path="/vocabulary/hsk3/:level" element={<VocabularyHsk3 />} />
        <Route path="/vocabulary/:level" element={<Vocabulary version="hsk2" />} />
        
        {/* Lesson Detail, Flashcard, Exercise Routes */}
        <Route path="/vocabulary/:level/lesson/:lessonNumber" element={<LessonDetail />} />
        <Route path="/vocabulary/:level/lesson/:lessonNumber/flashcard" element={<FlashcardPage />} />
        <Route path="/vocabulary/:level/lesson/:lessonNumber/exercise" element={<ExercisePage />} />
        <Route path="/vocabulary/hsk2/:level/lesson/:lessonNumber" element={<LessonDetail />} />
        <Route path="/vocabulary/hsk2/:level/lesson/:lessonNumber/flashcard" element={<FlashcardPage />} />
        <Route path="/vocabulary/hsk2/:level/lesson/:lessonNumber/exercise" element={<ExercisePage />} />
        <Route path="/vocabulary/hsk3/:level/lesson/:lessonNumber" element={<LessonDetail />} />
        <Route path="/vocabulary/hsk3/:level/lesson/:lessonNumber/flashcard" element={<FlashcardPage />} />
        <Route path="/vocabulary/hsk3/:level/lesson/:lessonNumber/exercise" element={<ExercisePage />} />

        {/* History & Admin */}
        <Route path="/history"          element={<ExamHistory />} />
        <Route path="/history/:attemptId/result" element={<ReviewAttempt />} />
        <Route path="/admin"            element={<AdminDashboard />} />
        <Route path="/admin/vocabulary" element={<AdminVocabulary />} />
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
