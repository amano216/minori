import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Building, User, Mail, Lock, CheckCircle } from 'lucide-react';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Label } from '../components/atoms/Label';
import { Card } from '../components/molecules/Card';
import { useToast } from '../contexts/ToastContext';
import { getFullApiUrl } from '../api/client';

export function SignupPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Organization info
  const [organizationName, setOrganizationName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  
  // Admin user info
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const [error, setError] = useState('');

  const handleStep1Submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!organizationName.trim()) {
      setError('組織名を入力してください');
      return;
    }
    
    // Auto-generate subdomain from organization name if not set
    if (!subdomain.trim()) {
      const generated = organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSubdomain(generated);
    }
    
    setStep(2);
  };

  const handleStep2Submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== passwordConfirmation) {
      setError('パスワードが一致しません');
      return;
    }
    
    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(getFullApiUrl('/api/auth/signup'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_name: organizationName,
          subdomain: subdomain,
          email: adminEmail,
          password: password,
          password_confirmation: passwordConfirmation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '登録に失敗しました');
      }

      console.log('Signup response:', data); // Debug log

      showToast('success', data.message);

      // If token is returned (dev mode with auto-confirm), save and redirect to schedule
      if (data.token) {
        localStorage.setItem('minori_auth_token', data.token);
        window.location.href = '/schedule';
      } else {
        // Otherwise, show email confirmation page
        navigate('/email-confirmation-sent', { state: { email: adminEmail } });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-900">Minori</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">新規登録</h1>
          <p className="text-gray-600">14日間無料でお試しいただけます</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className="font-medium">組織情報</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="font-medium">管理者アカウント</span>
            </div>
          </div>
        </div>

        <Card className="p-8">
          {step === 1 ? (
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div className="text-center mb-6">
                <Building className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-gray-900">組織情報を入力</h2>
                <p className="text-sm text-gray-600 mt-1">
                  まずは、貴組織の基本情報を教えてください
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="organizationName" required>組織名</Label>
                <Input
                  type="text"
                  id="organizationName"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="例: さくら訪問看護ステーション"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subdomain">サブドメイン（任意）</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    id="subdomain"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    placeholder="sakura"
                    className="flex-1"
                  />
                  <span className="text-gray-500">.minori.app</span>
                </div>
                <p className="text-xs text-gray-500">
                  専用URLを設定できます（後から変更可能）
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Link to="/login" className="flex-1">
                  <Button variant="secondary" size="lg" className="w-full">
                    戻る
                  </Button>
                </Link>
                <Button variant="primary" size="lg" type="submit" className="flex-1">
                  次へ
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <div className="text-center mb-6">
                <User className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-gray-900">管理者アカウントを作成</h2>
                <p className="text-sm text-gray-600 mt-1">
                  あなたのアカウント情報を入力してください
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="adminName" required>氏名</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    id="adminName"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="山田 太郎"
                    required
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adminEmail" required>メールアドレス</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    id="adminEmail"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="yamada@example.com"
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" required>パスワード</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8文字以上"
                    required
                    minLength={8}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="passwordConfirmation" required>パスワード（確認）</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="password"
                    id="passwordConfirmation"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="もう一度入力"
                    required
                    minLength={8}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <p className="mb-2">登録することで、以下に同意したものとみなされます：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><a href="#" className="text-indigo-600 hover:underline">利用規約</a></li>
                  <li><a href="#" className="text-indigo-600 hover:underline">プライバシーポリシー</a></li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  戻る
                </Button>
                <Button 
                  variant="primary" 
                  size="lg" 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? '登録中...' : 'アカウントを作成'}
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* Login Link */}
        <p className="text-center mt-6 text-gray-600">
          すでにアカウントをお持ちの方は{' '}
          <Link to="/login" className="text-indigo-600 hover:underline font-medium">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
