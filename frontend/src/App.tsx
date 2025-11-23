import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PrivateRoute } from './components/PrivateRoute'
import { DashboardPage } from './pages/DashboardPage'
import { StaffListPage } from './pages/StaffListPage'
import { StaffDetailPage } from './pages/StaffDetailPage'
import { StaffFormPage } from './pages/StaffFormPage'
import { LoginPage } from './pages/LoginPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/staffs" element={<PrivateRoute><StaffListPage /></PrivateRoute>} />
          <Route path="/staffs/new" element={<PrivateRoute><StaffFormPage /></PrivateRoute>} />
          <Route path="/staffs/:id" element={<PrivateRoute><StaffDetailPage /></PrivateRoute>} />
          <Route path="/staffs/:id/edit" element={<PrivateRoute><StaffFormPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
