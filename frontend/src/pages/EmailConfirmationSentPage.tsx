import { useLocation, Link } from 'react-router-dom';
import { Mail, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/molecules/Card';
import { useToast } from '../contexts/ToastContext';
import { useState } from 'react';

export function EmailConfirmationSentPage() {
  const location = useLocation();
  const { showToast } = useToast();
  const [isResending, setIsResending] = useState(false);
  
  const email = location.state?.email || '';

  const resendConfirmation = async () => {
    if (!email) {
      showToast('error', 'メールアドレスが見つかりません');
      return;
    }

    setIsResending(true);

    try {
      const response = await fetch('/api/auth/resend-confirmation', {
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
          <div className="text-center">
            <Mail className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">確認メールを送信しました</h1>
            <p className="text-gray-600 mb-6">
              <span className="font-medium">{email}</span> に確認メールを送信しました。
              <br />
              メール内のリンクをクリックして、アカウントを有効化してください。
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6 text-left">
              <h2 className="font-semibold text-blue-900 mb-2">📧 メールが届かない場合</h2>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>迷惑メールフォルダをご確認ください</li>
                <li>メールアドレスが正しいかご確認ください</li>
                <li>数分待ってから再送信をお試しください</li>
              </ul>
            </div>

            <Button
              onClick={resendConfirmation}
              disabled={isResending}
              variant="secondary"
              className="w-full mb-4"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  送信中...
                </>
              ) : (
                '確認メールを再送信'
              )}
            </Button>

            <Link to="/login">
              <Button variant="text" className="w-full">
                ログインページに戻る
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
