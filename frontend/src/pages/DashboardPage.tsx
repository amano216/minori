import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchHealth } from '../api/client';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [apiStatus, setApiStatus] = useState<string>('checking...');
  const [apiTimestamp, setApiTimestamp] = useState<string>('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    fetchHealth()
      .then((data) => {
        setApiStatus(data.status);
        setApiTimestamp(data.timestamp);
      })
      .catch(() => {
        setApiStatus('error');
      });
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Minori - 訪問看護スケジュール管理</h1>
        <div className="user-info">
          <span>{user?.email} ({user?.role})</span>
          <button onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
          </button>
        </div>
      </header>
      <main className="dashboard-content">
        <div className="card">
          <h2>API Status</h2>
          <p>
            Status: <strong>{apiStatus}</strong>
          </p>
          {apiTimestamp && (
            <p>
              Timestamp: <code>{apiTimestamp}</code>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
