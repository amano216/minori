import { useState, useEffect } from 'react';
import { organizationApi } from '../api/organizationApi';
import type { User } from '../types/organization';
import { Icon } from '../components/atoms/Icon';

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirmation: '',
    name: '',
    role: 'staff'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await organizationApi.getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'ユーザーの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '',
        password_confirmation: '',
        name: user.name || '',
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        password_confirmation: '',
        name: '',
        role: 'staff'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingUser) {
        await organizationApi.updateUser(editingUser.id, formData);
      } else {
        await organizationApi.createUser(formData);
      }
      await loadUsers();
      handleCloseModal();
    } catch (err) {
      const error = err as { response?: { data?: { errors?: string[] } } };
      setError(error.response?.data?.errors?.[0] || '保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('本当に削除しますか？')) return;

    try {
      setLoading(true);
      await organizationApi.deleteUser(id);
      await loadUsers();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || '削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center text-text-grey">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">ユーザー管理</h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-main text-white rounded hover:bg-main-dark transition-colors flex items-center gap-2"
        >
          <Icon name="Plus" size={20} />
          新規ユーザー
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-bg-base border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-primary">メールアドレス</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-primary">名前</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-primary">ロール</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-primary">作成日</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-text-primary">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-bg-base transition-colors">
                <td className="px-6 py-4 text-sm text-text-primary">{user.email}</td>
                <td className="px-6 py-4 text-sm text-text-primary">{user.name || '-'}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-1 bg-primary-50 text-main rounded text-xs">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-text-grey">
                  {new Date(user.created_at).toLocaleDateString('ja-JP')}
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  <button
                    onClick={() => handleOpenModal(user)}
                    className="text-main hover:text-main-dark mr-3"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="p-8 text-center text-text-grey">
            ユーザーが登録されていません
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-text-primary mb-4">
              {editingUser ? 'ユーザー編集' : '新規ユーザー'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-main"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  名前
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-main"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  パスワード {editingUser && '（変更する場合のみ入力）'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-main"
                  required={!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  ロール
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-main"
                  required
                >
                  <option value="staff">スタッフ</option>
                  <option value="admin">管理者</option>
                </select>
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
