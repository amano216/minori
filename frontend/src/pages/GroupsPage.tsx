import { useState, useEffect } from 'react';
import { organizationApi } from '../api/organizationApi';
import type { Group } from '../types/organization';
import { Icon } from '../components/atoms/Icon';

export function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await organizationApi.getGroups();
      setGroups(data);
      setError(null);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'グループの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (group?: Group) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name,
        description: group.description || ''
      });
    } else {
      setEditingGroup(null);
      setFormData({
        name: '',
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingGroup) {
        await organizationApi.updateGroup(editingGroup.id, formData);
      } else {
        await organizationApi.createGroup(formData);
      }
      await loadGroups();
      handleCloseModal();
    } catch (err) {
      const error = err as { response?: { data?: { errors?: string[] } } };
      setError(error.response?.data?.errors?.[0] || '保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('本当に削除しますか？このグループに所属しているユーザーがいる場合は削除できません。')) return;

    try {
      setLoading(true);
      await organizationApi.deleteGroup(id);
      await loadGroups();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || '削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading && groups.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center text-text-grey">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">グループ管理</h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-main text-white rounded hover:bg-main-dark transition-colors flex items-center gap-2"
        >
          <Icon name="Plus" size={20} />
          新規グループ
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <div key={group.id} className="bg-white rounded-lg border border-border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon name="Users" size={20} className="text-main" />
                <h3 className="text-lg font-semibold text-text-primary">{group.name}</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(group)}
                  className="text-main hover:text-main-dark p-1"
                  title="編集"
                >
                  <Icon name="Edit" size={16} />
                </button>
                <button
                  onClick={() => handleDelete(group.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                  title="削除"
                >
                  <Icon name="Trash2" size={16} />
                </button>
              </div>
            </div>

            {group.description && (
              <p className="text-sm text-text-grey mb-4">{group.description}</p>
            )}

            <div className="flex items-center gap-4 text-xs text-text-grey">
              <div className="flex items-center gap-1">
                <Icon name="User" size={14} />
                <span>{group.users?.length || 0}名</span>
              </div>
              <div>
                作成日: {new Date(group.created_at).toLocaleDateString('ja-JP')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="bg-white rounded-lg border border-border p-8 text-center text-text-grey">
          グループが登録されていません
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-text-primary mb-4">
              {editingGroup ? 'グループ編集' : '新規グループ'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  グループ名
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-main"
                  placeholder="例: 訪問看護チーム A"
                  required
                />
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
                  placeholder="このグループの説明を入力してください"
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
