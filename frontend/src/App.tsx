import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PrivateRoute } from './components/PrivateRoute'
import { DashboardPage } from './pages/DashboardPage'
import { StaffListPage } from './pages/StaffListPage'
import { StaffDetailPage } from './pages/StaffDetailPage'
import { StaffFormPage } from './pages/StaffFormPage'
import { PatientListPage } from './pages/PatientListPage'
import { PatientDetailPage } from './pages/PatientDetailPage'
import { PatientFormPage } from './pages/PatientFormPage'
import { VisitListPage } from './pages/VisitListPage'
import { VisitDetailPage } from './pages/VisitDetailPage'
import { VisitFormPage } from './pages/VisitFormPage'
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
          <Route path="/patients" element={<PrivateRoute><PatientListPage /></PrivateRoute>} />
          <Route path="/patients/new" element={<PrivateRoute><PatientFormPage /></PrivateRoute>} />
          <Route path="/patients/:id" element={<PrivateRoute><PatientDetailPage /></PrivateRoute>} />
          <Route path="/patients/:id/edit" element={<PrivateRoute><PatientFormPage /></PrivateRoute>} />
          <Route path="/visits" element={<PrivateRoute><VisitListPage /></PrivateRoute>} />
          <Route path="/visits/new" element={<PrivateRoute><VisitFormPage /></PrivateRoute>} />
          <Route path="/visits/:id" element={<PrivateRoute><VisitDetailPage /></PrivateRoute>} />
          <Route path="/visits/:id/edit" element={<PrivateRoute><VisitFormPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
