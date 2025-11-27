import { useState, useEffect } from 'react';
import { organizationApi } from '../api/organizationApi';
import { forgotPassword } from '../api/client';
import type { User, Group } from '../types/organization';
import { Icon } from '../components/atoms/Icon';
import { SearchableSelect } from '../components/molecules/SearchableSelect';

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
    setIsModalOpen(false);
    setEditingUser(null);
    setError(null);
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

  const handleSendPasswordReset = async () => {
    if (!formData.email) {
      setError('メールアドレスを入力してください');
      return;
    }
    if (!confirm(`${formData.email} 宛にパスワードリセットメールを送信しますか？`)) {
      return;
    }

    try {
      setLoading(true);
      await forgotPassword(formData.email);
      alert('パスワードリセットメールを送信しました');
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || 'メール送信に失敗しました');
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
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">ユーザー管理</h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-3 sm:px-4 py-2 bg-main text-white rounded hover:bg-main-dark transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <Icon name="Plus" size={18} />
          <span>新規ユーザー</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Mobile-responsive table wrapper */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-bg-base border-b border-border">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-text-primary whitespace-nowrap min-w-[80px]">名前</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-text-primary whitespace-nowrap min-w-[150px]">メールアドレス</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-text-primary whitespace-nowrap min-w-[70px]">ロール</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-text-primary whitespace-nowrap min-w-[80px]">ステータス</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-text-primary whitespace-nowrap min-w-[100px] hidden sm:table-cell">資格</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-text-primary whitespace-nowrap min-w-[100px] hidden sm:table-cell">グループ</th>
                <th className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium text-text-primary whitespace-nowrap min-w-[80px]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-bg-base transition-colors">
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-text-primary font-medium whitespace-nowrap">{user.name || '-'}</td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-text-primary">{user.email}</td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm">
                    <span className="px-2 py-1 bg-primary-50 text-main rounded text-xs whitespace-nowrap">
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm">
                    <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${STATUS_COLORS[user.staff_status || 'active']}`}>
                      {STATUS_OPTIONS.find(s => s.value === (user.staff_status || 'active'))?.label}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-text-grey hidden sm:table-cell">
                    {getQualificationLabels(user.qualifications)}
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-text-grey hidden sm:table-cell">
                    {getGroupName(user.group_id)}
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-right whitespace-nowrap">
                    <button
                      onClick={() => handleOpenModal(user)}
                      className="text-main hover:text-main-dark mr-2 sm:mr-3"
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
        </div>

        {users.length === 0 && (
          <div className="p-8 text-center text-text-grey">
            ユーザーが登録されていません
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 overflow-y-auto p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-lg p-4 sm:p-6 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold text-text-primary mb-4">
              {editingUser ? 'ユーザー編集' : '新規ユーザー'}
            </h2>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 基本情報 */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-semibold text-text-grey mb-3">基本情報</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      名前 <span className="text-red-500">*</span>
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
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      メールアドレス <span className="text-red-500">*</span>
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
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      パスワード {editingUser ? '（変更する場合のみ入力）' : <span className="text-red-500">*</span>}
                    </label>
                    {editingUser ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSendPasswordReset}
                          className="px-3 py-2 bg-gray-100 text-text-primary rounded border border-border hover:bg-gray-200 transition-colors text-sm"
                        >
                          パスワードリセットメールを送信
                        </button>
                        <span className="text-xs text-text-grey">
                          ※ユーザー自身で再設定を行います
                        </span>
                      </div>
                    ) : (
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-main"
                        required
                        minLength={8}
                        placeholder="8文字以上"
                      />
                    )}
                  </div>

                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        パスワード確認 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={formData.password_confirmation}
                        onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-main"
                        required
                        minLength={8}
                        placeholder="パスワードを再入力"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        ロール
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-main"
                        required
                      >
                        {ROLE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        ステータス
                      </label>
                      <select
                        value={formData.staff_status}
                        onChange={(e) => setFormData({ ...formData, staff_status: e.target.value as 'active' | 'inactive' | 'on_leave' })}
                        className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-main"
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* スタッフ情報 */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-semibold text-text-grey mb-3">スタッフ情報</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      資格
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {QUALIFICATION_OPTIONS.map(opt => (
                        <label
                          key={opt.value}
                          className={`px-3 py-1.5 rounded border cursor-pointer text-sm transition-colors ${
                            formData.qualifications.includes(opt.value)
                              ? 'bg-main text-white border-main'
                              : 'bg-white text-text-primary border-border hover:border-main'
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
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      所属グループ
                    </label>
                    <SearchableSelect
                      options={[
                        { value: '', label: '未所属' },
                        ...groups
                          .map(group => ({
                            value: group.id,
                            label: getGroupHierarchyLabel(group, groups)
                          }))
                          .sort((a, b) => a.label.localeCompare(b.label, 'ja'))
                      ]}
                      value={formData.group_id || ''}
                      onChange={(val) => setFormData({ ...formData, group_id: val ? Number(val) : null })}
                      placeholder="グループを選択"
                      searchPlaceholder="グループを検索..."
                      allowClear
                    />
                  </div>
                </div>
              </div>

              {/* ボタン */}
              <div className="flex gap-2 pt-2">
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
