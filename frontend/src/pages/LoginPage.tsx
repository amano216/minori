import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Label } from '../components/atoms/Label';
import { Card } from '../components/molecules/Card';

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

  const fillTestAccount = (testEmail: string, testPassword: string) => {
    setEmail(testEmail);
    setPassword(testPassword);
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-main mb-2">Minori</h1>
          <p className="text-text-grey">訪問看護スケジュール管理</p>
        </div>

        {/* Login Form */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-danger-100 border border-danger-300 text-danger rounded-md p-3 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">パスワード</Label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8文字以上"
                required
                disabled={isLoading}
                minLength={8}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>

          {/* Dev Account Quick Fill */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-text-grey mb-3">開発用アカウント</p>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fillTestAccount('admin@example.com', 'password123')}
              >
                管理者 (admin@example.com)
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fillTestAccount('staff@example.com', 'password123')}
              >
                スタッフ (staff@example.com)
              </Button>
            </div>
          </div>
        </Card>

        {/* Test Account Info */}
        <div className="mt-4 p-4 bg-primary-100 rounded-lg text-sm">
          <p className="font-medium text-text-black mb-2">テストアカウント:</p>
          <ul className="text-text-grey space-y-1 list-disc list-inside">
            <li>admin@example.com / password123</li>
            <li>staff@example.com / password123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
