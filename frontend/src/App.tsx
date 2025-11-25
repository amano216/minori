import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PrivateRoute } from './components/PrivateRoute'
import { AppLauncherPage } from './pages/AppLauncherPage'
import { ScheduleApp } from './apps/ScheduleApp'
import { PatientsApp } from './apps/PatientsApp'
import { StaffApp } from './apps/StaffApp'
import { LoginPage } from './pages/LoginPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={<PrivateRoute><AppLauncherPage /></PrivateRoute>}
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

          {/* Fallback to App Launcher */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
