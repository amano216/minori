import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1>Minori</h1>
      <h2>訪問看護スケジュール管理</h2>
      <form onSubmit={handleSubmit} className="login-form">
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label htmlFor="email">メールアドレス</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">パスワード</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            minLength={8}
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'ログイン中...' : 'ログイン'}
        </button>

        <div style={{ marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '1rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>開発用アカウント</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@example.com');
                setPassword('password123');
              }}
              style={{ fontSize: '0.9rem', padding: '0.4rem' }}
            >
              管理者 (admin@example.com)
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('staff@example.com');
                setPassword('password123');
              }}
              style={{ fontSize: '0.9rem', padding: '0.4rem' }}
            >
              スタッフ (staff@example.com)
            </button>
          </div>
        </div>
      </form>
      <div className="test-accounts">
        <p>テストアカウント:</p>
        <ul>
          <li>admin@example.com / password123</li>
          <li>staff@example.com / password123</li>
        </ul>
      </div>
    </div>
  );
}
