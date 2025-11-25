import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Label } from '../components/atoms/Label';
import { Card } from '../components/molecules/Card';
import { Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';
import { getFullApiUrl } from '../api/client';

export function LoginPage() {
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
      const response = await fetch(getFullApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requires_confirmation) {
          // Email confirmation required
          setError(data.error);
          navigate('/email-confirmation-sent', { state: { email: data.email } });
          return;
        }
        throw new Error(data.error || 'ログインに失敗しました');
      }

      if (data.requires_otp) {
        // 2FA required - redirect to OTP page
        navigate('/two-factor', { state: { email, password } });
        return;
      }

      // Normal login - save token and redirect
      console.log('Login success, token:', data.token);
      localStorage.setItem('minori_auth_token', data.token);
      console.log('Navigating to /schedule');
      // Force page reload to trigger AuthContext to fetch user
      window.location.href = '/schedule';
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
            <Sparkles className="w-10 h-10 text-indigo-600" />
            <span className="text-3xl font-bold text-gray-900">Minori</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ログイン</h1>
          <p className="text-gray-600">訪問看護スケジュール管理システム</p>
        </div>

        {/* Login Form */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">メールアドレス</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  disabled={isLoading}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">パスワード</Label>
                <a href="#" className="text-sm text-indigo-600 hover:underline">
                  パスワードを忘れた方
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8文字以上"
                  required
                  disabled={isLoading}
                  minLength={8}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
              {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
            </Button>
          </form>

          {/* Dev Account Quick Fill */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3 font-medium">開発用クイックログイン</p>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fillTestAccount('admin@example.com', 'password123')}
                className="text-left justify-start"
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">管理者アカウント</span>
                  <span className="text-xs text-gray-500">admin@example.com</span>
                </div>
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fillTestAccount('staff@example.com', 'password123')}
                className="text-left justify-start"
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">スタッフアカウント</span>
                  <span className="text-xs text-gray-500">staff@example.com</span>
                </div>
              </Button>
            </div>
          </div>
        </Card>

        {/* Signup Link */}
        <p className="text-center mt-6 text-gray-600">
          アカウントをお持ちでない方は{' '}
          <Link to="/signup" className="text-indigo-600 hover:underline font-medium">
            新規登録
          </Link>
        </p>

        {/* Back to Home */}
        <p className="text-center mt-4">
          <Link to="/" className="text-gray-500 hover:text-gray-700 text-sm">
            ← ホームに戻る
          </Link>
        </p>
      </div>
    </div>
  );
}
