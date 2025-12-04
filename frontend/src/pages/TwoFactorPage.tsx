import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, Sparkles } from 'lucide-react';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Label } from '../components/atoms/Label';
import { Card } from '../components/molecules/Card';
import { useToast } from '../contexts/ToastContext';
import { getFullApiUrl } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export function TwoFactorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { loginWithToken } = useAuth();
  
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Get email from location state
  const email = location.state?.email || '';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('セッションが無効です。再度ログインしてください。');
      return;
    }

    if (otpCode.length !== 6) {
      setError('6桁の認証コードを入力してください');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(getFullApiUrl('/api/auth/verify-otp'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp_code: otpCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Set token and user state directly without page reload
        loginWithToken(data.token, data.user);
        showToast('success', 'ログインしました');
        navigate('/schedule');
      } else {
        setError(data.error || '認証に失敗しました');
      }
    } catch {
      setError('エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    // Resend OTP by re-attempting login (backend will send a new OTP)
    showToast('info', '認証コードを再送信しています...');
    
    try {
      const response = await fetch(getFullApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: location.state?.password || '',
        }),
      });

      if (response.ok) {
        showToast('success', '認証コードを再送信しました');
      }
    } catch {
      showToast('error', '再送信に失敗しました');
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">セッションエラー</h1>
            <p className="text-gray-600 mb-6">
              セッションが無効です。再度ログインしてください。
            </p>
            <Link to="/login">
              <Button className="w-full">ログインページへ</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-900">Minori</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">2要素認証</h1>
          <p className="text-gray-600">
            <span className="font-medium">{email}</span> に送信された6桁の認証コードを入力してください
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-6">
              <Shield className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="otpCode" required>認証コード</Label>
              <Input
                type="text"
                id="otpCode"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
                required
                autoFocus
                autoComplete="one-time-code"
              />
              <p className="text-xs text-gray-500 text-center mt-2">
                ※ コードは10分間有効です
              </p>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? '認証中...' : '認証して続ける'}
            </Button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={resendOtp}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                コードを再送信
              </button>
              <div>
                <Link to="/login" className="text-gray-600 hover:text-gray-700 text-sm">
                  ログインページに戻る
                </Link>
              </div>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>💡 ヒント：</strong> 認証が完了すると、24時間は再度の認証は不要です。
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
