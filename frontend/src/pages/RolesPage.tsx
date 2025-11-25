import { useState, useEffect } from 'react';
import { organizationApi } from '../api/organizationApi';
import type { Role } from '../types/organization';
import { Icon } from '../components/atoms/Icon';

export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await organizationApi.getRoles();
      setRoles(data);
      setError(null);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'ロールの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description || ''
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingRole) {
        await organizationApi.updateRole(editingRole.id, formData);
      } else {
        await organizationApi.createRole(formData);
      }
      await loadRoles();
      handleCloseModal();
    } catch (err) {
      const error = err as { response?: { data?: { errors?: string[] } } };
      setError(error.response?.data?.errors?.[0] || '保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('本当に削除しますか？このロールが割り当てられているユーザーがいる場合は削除できません。')) return;

    try {
      setLoading(true);
      await organizationApi.deleteRole(id);
      await loadRoles();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || '削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading && roles.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center text-text-grey">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">ロール管理</h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-main text-white rounded hover:bg-main-dark transition-colors flex items-center gap-2"
        >
          <Icon name="Plus" size={20} />
          新規ロール
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-lg border border-border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon name="Shield" size={20} className="text-main" />
                <h3 className="text-lg font-semibold text-text-primary">{role.name}</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(role)}
                  className="text-main hover:text-main-dark p-1"
                  title="編集"
                >
                  <Icon name="Edit" size={16} />
                </button>
                <button
                  onClick={() => handleDelete(role.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                  title="削除"
                >
                  <Icon name="Trash2" size={16} />
                </button>
              </div>
            </div>

            {role.description && (
              <p className="text-sm text-text-grey mb-4">{role.description}</p>
            )}

            <div className="text-xs text-text-grey">
              作成日: {new Date(role.created_at).toLocaleDateString('ja-JP')}
            </div>
          </div>
        ))}
      </div>

      {roles.length === 0 && (
        <div className="bg-white rounded-lg border border-border p-8 text-center text-text-grey">
          ロールが登録されていません
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-text-primary mb-4">
              {editingRole ? 'ロール編集' : '新規ロール'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  ロール名
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-main"
                  placeholder="例: organization_admin"
                  required
                />
                <p className="mt-1 text-xs text-text-grey">
                  システムロール: super_admin, organization_admin, group_admin, staff, viewer
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  説明
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-main"
                  rows={3}
                  placeholder="このロールの説明を入力してください"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-main text-white rounded hover:bg-main-dark transition-colors disabled:opacity-50"
                >
                  {loading ? '保存中...' : '保存'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-bg-base text-text-primary rounded hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
