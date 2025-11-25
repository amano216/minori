import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PrivateRoute } from './components/PrivateRoute'
import { ScheduleApp } from './apps/ScheduleApp'
import { PatientsApp } from './apps/PatientsApp'
import { StaffApp } from './apps/StaffApp'
import { AdminApp } from './apps/AdminApp'
import { LoginPage } from './pages/LoginPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Redirect root to schedule */}
          <Route path="/" element={<Navigate to="/schedule" replace />} />

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
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
