// frontend/src/App.jsx

import Navbar from './components/Navbar'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AnalyzePage from './pages/AnalyzePage'
import DebatePage, { ChallengePage } from './pages/DebatePage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/analyze" element={
          <ProtectedRoute>
            <Navbar />
            <AnalyzePage />
          </ProtectedRoute>
        } />

        <Route path="/debate/new" element={
          <ProtectedRoute>
            <Navbar />
            <ChallengePage />
          </ProtectedRoute>
        } />

        <Route path="/debate/:id" element={
          <ProtectedRoute>
            <Navbar />
            <DebatePage />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  )
}

export default App