import { useState, useEffect } from 'react';
import { organizationApi } from '../api/organizationApi';
import type { User, Group } from '../types/organization';
import { Icon } from '../components/atoms/Icon';

const QUALIFICATION_OPTIONS = [
  { value: 'nurse', label: '看護師' },
  { value: 'physical_therapist', label: '理学療法士' },
  { value: 'occupational_therapist', label: '作業療法士' },
  { value: 'speech_therapist', label: '言語聴覚士' },
  { value: 'care_worker', label: '介護福祉士' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: '在籍' },
  { value: 'inactive', label: '退職' },
  { value: 'on_leave', label: '休職' },
];

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  on_leave: 'bg-yellow-100 text-yellow-800',
};

const ROLE_OPTIONS = [
  { value: 'organization_admin', label: '管理者' },
  { value: 'staff', label: 'スタッフ' },
];

const getRoleLabel = (role: string): string => {
  return ROLE_OPTIONS.find(r => r.value === role)?.label || role;
};

// グループの階層表示用ヘルパー
const getGroupHierarchyLabel = (group: Group, allGroups: Group[]) => {
  if (group.parent_id) {
    const parent = allGroups.find(g => g.id === group.parent_id);
    return parent ? `${parent.name} > ${group.name}` : group.name;
  }
  return group.name;
};

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirmation: '',
    name: '',
    role: 'staff',
    qualifications: [] as string[],
    staff_status: 'active' as 'active' | 'inactive' | 'on_leave',
    group_id: null as number | null,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => setIsPanelVisible(true), 10);
    } else {
      setIsPanelVisible(false);
    }
  }, [isModalOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, groupsData] = await Promise.all([
        organizationApi.getUsers(),
        organizationApi.getGroups().catch(() => []), // グループがなくてもエラーにしない
      ]);
      setUsers(usersData);
      setGroups(groupsData);
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
        role: user.role,
        qualifications: user.qualifications || [],
        staff_status: user.staff_status || 'active',
        group_id: user.group_id || null,
      } as typeof formData);
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        password_confirmation: '',
        name: '',
        role: 'staff',
        qualifications: [],
        staff_status: 'active' as 'active' | 'inactive' | 'on_leave',
        group_id: null,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsPanelVisible(false);
    setTimeout(() => {
      setIsModalOpen(false);
      setEditingUser(null);
      setError(null);
    }, 300);
  };

  const handleQualificationChange = (qualification: string) => {
    setFormData(prev => {
      const newQualifications = prev.qualifications.includes(qualification)
        ? prev.qualifications.filter(q => q !== qualification)
        : [...prev.qualifications, qualification];
      return { ...prev, qualifications: newQualifications };
    });
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
      await loadData();
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
      await loadData();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || '削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getQualificationLabels = (qualifications?: string[]) => {
    if (!qualifications || qualifications.length === 0) return '-';
    return qualifications
      .map(q => QUALIFICATION_OPTIONS.find(opt => opt.value === q)?.label || q)
      .join(', ');
  };

  const getGroupName = (groupId?: number | null) => {
    if (!groupId) return '-';
    const group = groups.find(g => g.id === groupId);
    return group ? getGroupHierarchyLabel(group, groups) : '-';
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
              <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">名前</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">メールアドレス</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">ロール</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">ステータス</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">資格</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">グループ</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-text-primary">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-bg-base transition-colors">
                <td className="px-4 py-4 text-sm text-text-primary font-medium">{user.name || '-'}</td>
                <td className="px-4 py-4 text-sm text-text-primary">{user.email}</td>
                <td className="px-4 py-4 text-sm">
                  <span className="px-2 py-1 bg-primary-50 text-main rounded text-xs">
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[user.staff_status || 'active']}`}>
                    {STATUS_OPTIONS.find(s => s.value === (user.staff_status || 'active'))?.label}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-text-grey">
                  {getQualificationLabels(user.qualifications)}
                </td>
                <td className="px-4 py-4 text-sm text-text-grey">
                  {getGroupName(user.group_id)}
                </td>
                <td className="px-4 py-4 text-sm text-right">
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

      {/* Side Panel (Replaces Modal) */}
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <div 
            className={`fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40 transition-opacity duration-300 ${
              isPanelVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={handleCloseModal}
          />
          
          {/* Panel */}
          <div 
            className={`fixed top-16 right-4 bottom-4 w-96 bg-white shadow-2xl border border-gray-200 rounded-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
              isPanelVisible ? 'translate-x-0' : 'translate-x-[120%]'
            }`}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-xl">
              <h2 className="text-lg font-bold text-text-primary">
                {editingUser ? 'ユーザー編集' : '新規ユーザー'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              >
                <Icon name="X" size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form id="user-form" onSubmit={handleSubmit} className="space-y-6">
                {/* 基本情報 */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">基本情報</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1.5">
                        名前 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-main/20 focus:border-main transition-all"
                        placeholder="山田 太郎"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1.5">
                        メールアドレス <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-main/20 focus:border-main transition-all"
                        placeholder="taro.yamada@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1.5">
                        パスワード {editingUser && <span className="text-xs text-gray-400 font-normal">（変更時のみ）</span>}
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-main/20 focus:border-main transition-all"
                        placeholder="••••••••"
                        required={!editingUser}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1.5">
                          ロール
                        </label>
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-main/20 focus:border-main transition-all bg-white"
                          required
                        >
                          {ROLE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1.5">
                          ステータス
                        </label>
                        <select
                          value={formData.staff_status}
                          onChange={(e) => setFormData({ ...formData, staff_status: e.target.value as 'active' | 'inactive' | 'on_leave' })}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-main/20 focus:border-main transition-all bg-white"
                        >
                          {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 my-6"></div>

                {/* スタッフ情報 */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">スタッフ情報</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        資格
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {QUALIFICATION_OPTIONS.map(opt => (
                          <label
                            key={opt.value}
                            className={`px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-all ${
                              formData.qualifications.includes(opt.value)
                                ? 'bg-main text-white border-main shadow-sm'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-main/50 hover:text-main'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.qualifications.includes(opt.value)}
                              onChange={() => handleQualificationChange(opt.value)}
                              className="sr-only"
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1.5">
                        所属グループ
                      </label>
                      <select
                        value={formData.group_id || ''}
                        onChange={(e) => setFormData({ ...formData, group_id: e.target.value ? Number(e.target.value) : null })}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-main/20 focus:border-main transition-all bg-white"
                      >
                        <option value="">未所属</option>
                        {groups
                          .map(group => ({
                            ...group,
                            label: getGroupHierarchyLabel(group, groups)
                          }))
                          .sort((a, b) => a.label.localeCompare(b.label, 'ja'))
                          .map(group => (
                            <option key={group.id} value={group.id}>{group.label}</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl flex gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                form="user-form"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-main text-white rounded-lg hover:bg-main-dark font-medium transition-colors disabled:opacity-50 shadow-sm"
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
