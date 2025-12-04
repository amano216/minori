import { useState, useEffect, useMemo } from 'react';
import { organizationApi } from '../api/organizationApi';
import { forgotPassword } from '../api/client';
import { fetchVersions, type AuditVersion } from '../api/versionsApi';
import type { User, Group } from '../types/organization';
import { Icon } from '../components/atoms/Icon';
import { SearchableSelect } from '../components/molecules/SearchableSelect';
import { HistoryItem } from '../components/molecules/HistoryItem';
import { Spinner } from '../components/atoms/Spinner';
import { Shield, ShieldOff, Search } from 'lucide-react';

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

const USER_FIELD_LABELS: Record<string, string> = {
  email: 'メールアドレス',
  name: '名前',
  role: 'ロール',
  qualifications: '資格',
  staff_status: 'ステータス',
  group_id: '所属グループ',
  encrypted_password: 'パスワード',
  otp_required_for_login: '2段階認証',
};

const EVENT_LABELS: Record<string, string> = {
  create: '作成',
  update: '更新',
  destroy: '削除',
};

/**
 * changesを正しいフォーマットに変換
 */
function formatChangesForHistoryItem(objectChanges: Record<string, unknown> | null | undefined): Record<string, { before: unknown; after: unknown }> | undefined {
  if (!objectChanges) return undefined;
  
  const result: Record<string, { before: unknown; after: unknown }> = {};
  
  for (const [key, value] of Object.entries(objectChanges)) {
    if (Array.isArray(value) && value.length === 2) {
      let before = value[0];
      let after = value[1];
      
      // ロールの変換
      if (key === 'role') {
        before = ROLE_OPTIONS.find(r => r.value === before)?.label || before;
        after = ROLE_OPTIONS.find(r => r.value === after)?.label || after;
      }
      // ステータスの変換
      if (key === 'staff_status') {
        before = STATUS_OPTIONS.find(s => s.value === before)?.label || before;
        after = STATUS_OPTIONS.find(s => s.value === after)?.label || after;
      }
      // 資格の変換
      if (key === 'qualifications') {
        const formatQuals = (quals: unknown) => {
          if (!Array.isArray(quals)) return quals;
          return quals.map(q => QUALIFICATION_OPTIONS.find(opt => opt.value === q)?.label || q).join(', ') || '(なし)';
        };
        before = formatQuals(before);
        after = formatQuals(after);
      }
      // パスワードは「変更」とだけ表示
      if (key === 'encrypted_password') {
        before = '***';
        after = '(変更されました)';
      }
      
      result[key] = { before, after };
    }
  }
  
  return Object.keys(result).length > 0 ? result : undefined;
}

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
  const [modalTab, setModalTab] = useState<'edit' | 'history'>('edit');
  const [versions, setVersions] = useState<AuditVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
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

  // 履歴タブが選択されたときにデータを読み込む
  useEffect(() => {
    if (modalTab === 'history' && editingUser && versions.length === 0) {
      loadUserVersions(editingUser.id);
    }
  }, [modalTab, editingUser]);

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

  const loadUserVersions = async (userId: number) => {
    try {
      setVersionsLoading(true);
      const response = await fetchVersions({
        item_type: 'User',
        item_id: userId,
        per_page: 50,
      });
      setVersions(response.versions);
    } catch (err) {
      console.error('Failed to load user history:', err);
      setVersions([]);
    } finally {
      setVersionsLoading(false);
    }
  };

  const handleOpenModal = (user?: User) => {
    setModalTab('edit');
    setVersions([]);
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
    // アニメーション用に少し遅延
    setTimeout(() => setIsPanelVisible(true), 10);
  };

  const handleCloseModal = () => {
    setIsPanelVisible(false);
    // アニメーション完了後にモーダルを閉じる
    setTimeout(() => {
      setIsModalOpen(false);
      setEditingUser(null);
      setError(null);
    }, 200);
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

  const handleQualificationChange = (qualification: string) => {
    setFormData(prev => {
      const newQualifications = prev.qualifications.includes(qualification)
        ? prev.qualifications.filter(q => q !== qualification)
        : [...prev.qualifications, qualification];
      return { ...prev, qualifications: newQualifications };
    });
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

  // フィルタリングされたユーザーリスト
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // 検索クエリでフィルタ
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = user.name?.toLowerCase().includes(query);
        const matchesEmail = user.email?.toLowerCase().includes(query);
        const matchesQualifications = user.qualifications?.some(q => {
          const label = QUALIFICATION_OPTIONS.find(opt => opt.value === q)?.label || q;
          return label.toLowerCase().includes(query);
        });
        if (!matchesName && !matchesEmail && !matchesQualifications) {
          return false;
        }
      }
      // ステータスでフィルタ
      if (statusFilter && (user.staff_status || 'active') !== statusFilter) {
        return false;
      }
      // ロールでフィルタ
      if (roleFilter && user.role !== roleFilter) {
        return false;
      }
      return true;
    });
  }, [users, searchQuery, statusFilter, roleFilter]);

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
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">ユーザー管理</h1>
          <p className="text-sm text-text-grey mt-1">
            {filteredUsers.length}件のユーザー{searchQuery || statusFilter || roleFilter ? '（フィルタ結果）' : ''}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-3 sm:px-4 py-2 bg-main text-white rounded hover:bg-main-dark transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <Icon name="Plus" size={18} />
          <span>新規ユーザー</span>
        </button>
      </div>

      {/* 検索・フィルターバー */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="名前、メールアドレス、資格で検索..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main sm:w-auto"
        >
          <option value="">すべてのステータス</option>
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main sm:w-auto"
        >
          <option value="">すべてのロール</option>
          {ROLE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
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
                <th className="px-3 sm:px-4 py-3 text-center text-xs sm:text-sm font-medium text-text-primary whitespace-nowrap min-w-[50px]">2FA</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-text-primary whitespace-nowrap min-w-[100px] hidden sm:table-cell">資格</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-text-primary whitespace-nowrap min-w-[100px] hidden sm:table-cell">グループ</th>
                <th className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium text-text-primary whitespace-nowrap min-w-[80px]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => (
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
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-center">
                    {user.otp_enabled ? (
                      <Shield className="w-4 h-4 text-green-600 mx-auto" />
                    ) : (
                      <ShieldOff className="w-4 h-4 text-gray-300 mx-auto" />
                    )}
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

        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-text-grey">
            {searchQuery || statusFilter || roleFilter 
              ? '検索条件に一致するユーザーがいません' 
              : 'ユーザーが登録されていません'}
          </div>
        )}
      </div>

      {/* Side Panel */}
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-200 ${isPanelVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleCloseModal}
          />

          {/* Panel */}
          <div className={`fixed top-0 right-0 bottom-0 w-full sm:w-[420px] md:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-200 ${isPanelVisible ? 'translate-x-0' : 'translate-x-full'} flex flex-col overflow-hidden`}>
            {/* Header */}
            <div className="flex-none px-4 py-3 border-b border-border flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-semibold text-text-primary">
                {editingUser ? 'ユーザー編集' : '新規ユーザー'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
              >
                <Icon name="X" size={20} />
              </button>
            </div>

            {/* Tabs - 編集モードでのみ表示 */}
            {editingUser && (
              <div className="flex-none flex border-b border-border bg-white">
                <button
                  type="button"
                  onClick={() => setModalTab('edit')}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    modalTab === 'edit'
                      ? 'border-main text-main bg-primary-50'
                      : 'border-transparent text-text-grey hover:text-text-primary hover:bg-gray-50'
                  }`}
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('history')}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    modalTab === 'history'
                      ? 'border-main text-main bg-primary-50'
                      : 'border-transparent text-text-grey hover:text-text-primary hover:bg-gray-50'
                  }`}
                >
                  変更履歴
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* 履歴タブ */}
              {modalTab === 'history' && editingUser ? (
                <div className="space-y-3">
                  {versionsLoading ? (
                    <div className="flex justify-center py-8">
                      <Spinner />
                    </div>
                  ) : versions.length === 0 ? (
                    <div className="text-center text-text-grey py-8">
                      変更履歴がありません
                    </div>
                  ) : (
                    versions.map((version) => (
                      <HistoryItem
                        key={version.id}
                        event={version.event as 'create' | 'update' | 'destroy'}
                        eventLabel={EVENT_LABELS[version.event] || version.event}
                        whodunnitName={version.whodunnit_name}
                        createdAt={version.created_at}
                        changes={formatChangesForHistoryItem(version.object_changes)}
                        fieldLabels={USER_FIELD_LABELS}
                      />
                    ))
                  )}
                </div>
              ) : (
                /* 編集フォーム */
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
              )}
            </div>

            {/* 履歴タブ時の閉じるボタン */}
            {modalTab === 'history' && (
              <div className="flex-none p-4 sm:p-6 pt-0 border-t border-border">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full px-4 py-2 bg-bg-base text-text-primary rounded hover:bg-gray-200 transition-colors"
                >
                  閉じる
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
