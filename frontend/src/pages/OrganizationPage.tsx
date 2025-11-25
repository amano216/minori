import { useState, useEffect } from 'react';
import { organizationApi } from '../api/organizationApi';
import type { Organization } from '../types/organization';

export function OrganizationPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', subdomain: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    try {
      setLoading(true);
      const data = await organizationApi.getOrganization();
      setOrganization(data);
      setFormData({ name: data.name, subdomain: data.subdomain || '' });
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || '組織情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const updated = await organizationApi.updateOrganization(formData);
      setOrganization(updated);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      const error = err as { response?: { data?: { errors?: string[] } } };
      setError(error.response?.data?.errors?.[0] || '更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !organization) {
    return (
      <div className="p-6">
        <div className="text-center text-text-grey">読み込み中...</div>
      </div>
    );
  }

  if (error && !organization) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">組織設定</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-main text-white rounded hover:bg-main-dark transition-colors"
          >
            編集
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-border p-6">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                組織名
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-main"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                サブドメイン
              </label>
              <input
                type="text"
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-main"
                placeholder="例: your-company"
              />
              <p className="mt-1 text-sm text-text-grey">
                設定すると、https://{formData.subdomain || 'your-company'}.example.com でアクセスできます
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-main text-white rounded hover:bg-main-dark transition-colors disabled:opacity-50"
              >
                {loading ? '保存中...' : '保存'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({ name: organization?.name || '', subdomain: organization?.subdomain || '' });
                  setError(null);
                }}
                className="px-4 py-2 bg-bg-base text-text-primary rounded hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-text-grey mb-1">組織名</h3>
              <p className="text-text-primary">{organization?.name}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-text-grey mb-1">サブドメイン</h3>
              <p className="text-text-primary">{organization?.subdomain || '未設定'}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-text-grey mb-1">作成日</h3>
              <p className="text-text-primary">
                {organization?.created_at ? new Date(organization.created_at).toLocaleDateString('ja-JP') : '-'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
