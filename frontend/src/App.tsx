import { useState, useEffect } from 'react'
import './App.css'
import { fetchHealth } from './api/client'

function App() {
  const [apiStatus, setApiStatus] = useState<string>('checking...')
  const [apiTimestamp, setApiTimestamp] = useState<string>('')

  useEffect(() => {
    fetchHealth()
      .then((data) => {
        setApiStatus(data.status)
        setApiTimestamp(data.timestamp)
      })
      .catch(() => {
        setApiStatus('error')
      })
  }, [])

  return (
    <>
      <h1>Minori - 訪問看護スケジュール管理</h1>
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
    </>
  )
}

export default App
