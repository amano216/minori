import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ToastContainer } from './components/molecules/ToastContainer'
import { PrivateRoute } from './components/PrivateRoute'
import { ScheduleApp } from './apps/ScheduleApp'
import { PatientsApp } from './apps/PatientsApp'
import { AdminApp } from './apps/AdminApp'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { EmailConfirmationPage } from './pages/EmailConfirmationPage'
import { EmailConfirmationSentPage } from './pages/EmailConfirmationSentPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { TwoFactorPage } from './pages/TwoFactorPage'

// Authenticated userのルートリダイレクト
const RootRedirect = () => {
  const { user } = useAuth()
  if (user) {
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
            
            {/* Auth Flow Pages */}
            <Route path="/confirm-email" element={<EmailConfirmationPage />} />
            <Route path="/email-confirmation-sent" element={<EmailConfirmationSentPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/two-factor" element={<TwoFactorPage />} />

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
