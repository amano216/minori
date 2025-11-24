import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PrivateRoute } from './components/PrivateRoute'
import { Layout } from './components/Layout'
import { StaffListPage } from './pages/StaffListPage'
import { StaffDetailPage } from './pages/StaffDetailPage'
import { StaffFormPage } from './pages/StaffFormPage'
import { PatientListPage } from './pages/PatientListPage'
import { PatientDetailPage } from './pages/PatientDetailPage'
import { PatientFormPage } from './pages/PatientFormPage'
import { VisitListPage } from './pages/VisitListPage'
import { VisitDetailPage } from './pages/VisitDetailPage'
import { VisitFormPage } from './pages/VisitFormPage'
import { SchedulePage } from './pages/SchedulePage'
import { GanttSchedulePage } from './pages/GanttSchedulePage'
import { LoginPage } from './pages/LoginPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/schedule" replace />} />
          <Route path="/staffs" element={<PrivateRoute><Layout><StaffListPage /></Layout></PrivateRoute>} />
          <Route path="/staffs/new" element={<PrivateRoute><Layout><StaffFormPage /></Layout></PrivateRoute>} />
          <Route path="/staffs/:id" element={<PrivateRoute><Layout><StaffDetailPage /></Layout></PrivateRoute>} />
          <Route path="/staffs/:id/edit" element={<PrivateRoute><Layout><StaffFormPage /></Layout></PrivateRoute>} />
          <Route path="/patients" element={<PrivateRoute><Layout><PatientListPage /></Layout></PrivateRoute>} />
          <Route path="/patients/new" element={<PrivateRoute><Layout><PatientFormPage /></Layout></PrivateRoute>} />
          <Route path="/patients/:id" element={<PrivateRoute><Layout><PatientDetailPage /></Layout></PrivateRoute>} />
          <Route path="/patients/:id/edit" element={<PrivateRoute><Layout><PatientFormPage /></Layout></PrivateRoute>} />
          <Route path="/visits" element={<PrivateRoute><Layout><VisitListPage /></Layout></PrivateRoute>} />
          <Route path="/visits/new" element={<PrivateRoute><Layout><VisitFormPage /></Layout></PrivateRoute>} />
          <Route path="/visits/:id" element={<PrivateRoute><Layout><VisitDetailPage /></Layout></PrivateRoute>} />
          <Route path="/visits/:id/edit" element={<PrivateRoute><Layout><VisitFormPage /></Layout></PrivateRoute>} />
          <Route path="/schedule" element={<PrivateRoute><Layout><GanttSchedulePage /></Layout></PrivateRoute>} />
          <Route path="/schedule/weekly" element={<PrivateRoute><Layout><SchedulePage /></Layout></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/schedule" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
