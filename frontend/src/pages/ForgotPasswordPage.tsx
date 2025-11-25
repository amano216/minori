import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Sparkles, CheckCircle } from 'lucide-react';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Label } from '../components/atoms/Label';
import { Card } from '../components/molecules/Card';
import { useToast } from '../contexts/ToastContext';

export function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      showToast('error', 'メールアドレスを入力してください');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        showToast('success', data.message);
      } else {
        showToast('error', data.error);
      }
    } catch (err) {
      showToast('error', 'エラーが発生しました');
    } finally {
      setIsLoading(false);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">パスワードをお忘れの方</h1>
          <p className="text-gray-600">登録したメールアドレスにリセットリンクを送信します</p>
        </div>

        <Card className="p-8">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <Label htmlFor="email" required>メールアドレス</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="pl-10"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? '送信中...' : 'リセットリンクを送信'}
              </Button>

              <div className="text-center">
                <Link to="/login" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                  ログインページに戻る
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">メールを送信しました</h2>
              <p className="text-gray-600 mb-6">
                ご登録のメールアドレスにパスワードリセットのリンクを送信しました。
                メールをご確認ください。
              </p>
              <p className="text-sm text-gray-500 mb-4">
                ※ リンクは24時間有効です
              </p>
              <Link to="/login">
                <Button className="w-full">ログインページに戻る</Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
