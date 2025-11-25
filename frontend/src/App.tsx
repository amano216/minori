import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ToastContainer } from './components/ToastContainer'
import { PrivateRoute } from './components/PrivateRoute'
import { ScheduleApp } from './apps/ScheduleApp'
import { PatientsApp } from './apps/PatientsApp'
import { StaffApp } from './apps/StaffApp'
import { AdminApp } from './apps/AdminApp'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { OnboardingPage } from './pages/OnboardingPage'

// Authenticated userのルートリダイレクト
const RootRedirect = () => {
  const { currentUser } = useAuth()
  if (currentUser) {
    return <Navigate to="/schedule" replace />
  }
  return <LandingPage />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Onboarding Route (認証必須) */}
            <Route
              path="/onboarding"
              element={<PrivateRoute><OnboardingPage /></PrivateRoute>}
            />

            {/* Schedule App */}
            <Route
              path="/schedule/*"
              element={<PrivateRoute><ScheduleApp /></PrivateRoute>}
            />

            {/* Patients App */}
            <Route
              path="/patients/*"
              element={<PrivateRoute><PatientsApp /></PrivateRoute>}
            />

            {/* Staff App */}
            <Route
              path="/staff/*"
              element={<PrivateRoute><StaffApp /></PrivateRoute>}
            />

            {/* Admin App */}
            <Route
              path="/admin/*"
              element={<PrivateRoute><AdminApp /></PrivateRoute>}
            />

            {/* Fallback to Schedule */}
            <Route path="*" element={<Navigate to="/schedule" replace />} />
          </Routes>
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
