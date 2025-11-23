import './App.css'
import { AuthProvider } from './contexts/AuthContext'
import { PrivateRoute } from './components/PrivateRoute'
import { DashboardPage } from './pages/DashboardPage'

function App() {
  return (
    <AuthProvider>
      <PrivateRoute>
        <DashboardPage />
      </PrivateRoute>
    </AuthProvider>
  )
}

export default App
