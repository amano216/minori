import { useState } from 'react';
import { Shield, Mail, AlertCircle, CheckCircle, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { toggle2FA } from '../api/client';
import { GroupReorderSection } from '../components/organisms/GroupReorderSection';

export function AccountSettingsPage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle2FA = async () => {
    setIsLoading(true);
    try {
      const result = await toggle2FA();
      showToast('success', result.message);
      // ユーザー情報を更新
      await refreshUser();
    } catch (error) {
      showToast('error', '2FA設定の変更に失敗しました');
      console.error('Failed to toggle 2FA:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">アカウント設定</h1>
        <p className="text-sm text-text-secondary mt-1">セキュリティとアカウント情報の管理</p>
      </div>

      {/* アカウント情報 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-gray-500" />
          アカウント情報
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-text-secondary">メールアドレス</label>
            <p className="text-text-primary font-medium">{user?.email}</p>
          </div>
          <div>
            <label className="text-sm text-text-secondary">ロール</label>
            <p className="text-text-primary font-medium">
              {user?.role === 'super_admin' && 'スーパー管理者'}
              {user?.role === 'organization_admin' && '組織管理者'}
              {user?.role === 'staff' && 'スタッフ'}
            </p>
          </div>
        </div>
      </div>

      {/* 2要素認証 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-gray-500" />
          2要素認証（2FA）
        </h2>
        
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`
              px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5
              ${user?.otp_enabled 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600'
              }
            `}>
              {user?.otp_enabled ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  有効
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  無効
                </>
              )}
            </div>
          </div>
          
          <p className="text-sm text-text-secondary mb-4">
            2要素認証を有効にすると、ログイン時に追加の認証コードが必要になります。
            認証コードはメールで送信され、24時間ごとに再認証が必要です。
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>仕組み:</strong> 2FAを有効にすると、ログイン時（または24時間経過後）に
              6桁の認証コードがメールアドレスに送信されます。このコードを入力することで
              ログインが完了します。
            </p>
          </div>
        </div>

        <button
          onClick={handleToggle2FA}
          disabled={isLoading}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors
            ${user?.otp_enabled
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-main text-white hover:bg-main-dark'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isLoading ? '処理中...' : user?.otp_enabled ? '2FAを無効にする' : '2FAを有効にする'}
        </button>
      </div>

      {/* グループ並び替え */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-500" />
          チーム表示順
        </h2>
        <GroupReorderSection />
      </div>
    </div>
  );
}
