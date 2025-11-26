import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Mail, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/molecules/Card';
import { useToast } from '../contexts/ToastContext';
import { getFullApiUrl } from '../api/client';

export function EmailConfirmationPage() {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [status, setStatus] = useState<'confirming' | 'success' | 'error'>('confirming');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const response = await fetch(getFullApiUrl('/api/auth/confirm-email'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message);
          
          // Save token and redirect to main schedule page
          localStorage.setItem('minori_auth_token', data.token);
          showToast('success', 'メールアドレスを確認しました！');
          
          setTimeout(() => {
            window.location.href = '/schedule';
          }, 2000);
        } else {
          setStatus('error');
          setMessage(data.error || '確認に失敗しました');
        }
      } catch {
        setStatus('error');
        setMessage('エラーが発生しました');
      }
    };

    if (token) {
      confirmEmail();
    } else {
      setStatus('error');
      setMessage('無効な確認リンクです');
    }
  }, [token, showToast]);

  const resendConfirmation = async () => {
    if (!email) {
      showToast('error', 'メールアドレスを入力してください');
      return;
    }

    setIsResending(true);

    try {
      const response = await fetch(getFullApiUrl('/api/auth/resend-confirmation'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast('success', data.message);
      } else {
        showToast('error', data.error);
      }
    } catch {
      showToast('error', 'エラーが発生しました');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-900">Minori</span>
          </Link>
        </div>

        <Card className="p-8">
          {status === 'confirming' && (
            <div className="text-center">
              <RefreshCw className="w-16 h-16 text-indigo-600 mx-auto mb-4 animate-spin" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">メールアドレスを確認中...</h1>
              <p className="text-gray-600">少々お待ちください</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">確認完了！</h1>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">オンボーディングページにリダイレクトしています...</p>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="text-center mb-6">
                <Mail className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">確認に失敗しました</h1>
                <p className="text-gray-600">{message}</p>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">確認メールを再送信</h2>
                <div className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="メールアドレスを入力"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Button
                    onClick={resendConfirmation}
                    disabled={isResending}
                    className="w-full"
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        送信中...
                      </>
                    ) : (
                      '再送信'
                    )}
                  </Button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link to="/login" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                  ログインページに戻る
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
