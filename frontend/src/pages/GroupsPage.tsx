import { useState, useEffect, useMemo } from 'react';
import { organizationApi } from '../api/organizationApi';
import type { Group, Organization, User } from '../types/organization';
import { Icon } from '../components/atoms/Icon';

interface TreeNode {
  id: string; // 'org' or group id
  type: 'organization' | 'office' | 'team';
  name: string;
  data?: Group | Organization;
  children: TreeNode[];
  users?: User[];
}

export function GroupsPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selection state
  const [selectedNodeId, setSelectedNodeId] = useState<string>('org');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['org']));

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    parent_id?: number | null;
    group_type?: 'office' | 'team';
  }>({
    name: '',
    description: '',
    parent_id: null,
    group_type: 'office'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [orgData, groupsData] = await Promise.all([
        organizationApi.getOrganization(),
        organizationApi.getGroups()
      ]);
      setOrganization(orgData);
      setGroups(groupsData);
      setError(null);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // Build Tree Structure
  const treeData = useMemo(() => {
    if (!organization) return null;

    const root: TreeNode = {
      id: 'org',
      type: 'organization',
      name: organization.name,
      data: organization,
      children: [],
      users: [] // Organization level users could be fetched if needed
    };

    // Map groups by ID for easy access
    const groupMap = new Map<number, TreeNode>();
    
    // First pass: Create nodes
    groups.forEach(group => {
      groupMap.set(group.id, {
        id: group.id.toString(),
        type: group.group_type || 'office',
        name: group.name,
        data: group,
        children: [],
        users: group.users || []
      });
    });

    // Second pass: Build hierarchy
    groups.forEach(group => {
      const node = groupMap.get(group.id)!;
      if (group.parent_id && groupMap.has(group.parent_id)) {
        const parent = groupMap.get(group.parent_id)!;
        parent.children.push(node);
      } else {
        // Top level groups (Offices) go under Organization
        root.children.push(node);
      }
    });

    return root;
  }, [organization, groups]);

  const toggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  const handleOpenModal = (parentGroup?: Group, editGroup?: Group) => {
    if (editGroup) {
      setEditingGroup(editGroup);
      setFormData({
        name: editGroup.name,
        description: editGroup.description || '',
        parent_id: editGroup.parent_id || null,
        group_type: editGroup.group_type || 'office'
      });
    } else {
      setEditingGroup(null);
      // If parent is provided, we are creating a child (Team)
      // If no parent, we are creating a top-level group (Office)
      setFormData({
        name: '',
        description: '',
        parent_id: parentGroup ? parentGroup.id : null,
        group_type: parentGroup ? 'team' : 'office'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
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
    if (!confirm('本当に削除しますか？このグループに所属しているユーザーがいる場合は削除できません。')) return;

    try {
      setLoading(true);
      await organizationApi.deleteGroup(id);
      await loadData();
      setSelectedNodeId('org'); // Reset selection
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || '削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // Recursive Tree Component
  const renderTree = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNodeId === node.id;
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center py-2 px-2 cursor-pointer hover:bg-gray-100 transition-colors ${
            isSelected ? 'bg-blue-50 text-main' : 'text-text-primary'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => handleSelect(node.id)}
        >
          <div
            className="p-1 mr-1 rounded hover:bg-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(node.id);
            }}
          >
            {hasChildren ? (
              <Icon name={isExpanded ? "ChevronDown" : "ChevronRight"} size={16} className="text-text-grey" />
            ) : (
              <div className="w-4 h-4" />
            )}
          </div>
          
          <div className="mr-2">
            {node.type === 'organization' && <Icon name="Building2" size={18} />}
            {node.type === 'office' && <Icon name="Building" size={18} className="text-blue-600" />}
            {node.type === 'team' && <Icon name="Users" size={18} className="text-green-600" />}
          </div>
          
          <span className="text-sm font-medium truncate">{node.name}</span>
        </div>

        {isExpanded && node.children.map(child => renderTree(child, level + 1))}
      </div>
    );
  };

  // Detail View Component
  const renderDetail = () => {
    if (!treeData) return null;

    // Find selected node
    let selectedNode: TreeNode | null = null;
    const findNode = (node: TreeNode): TreeNode | null => {
      if (node.id === selectedNodeId) return node;
      for (const child of node.children) {
        const found = findNode(child);
        if (found) return found;
      }
      return null;
    };
    selectedNode = findNode(treeData);

    if (!selectedNode) return <div className="p-8 text-center text-text-grey">選択されていません</div>;

    const isOrg = selectedNode.type === 'organization';
    const group = !isOrg ? (selectedNode.data as Group) : null;

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-xs ${
                selectedNode.type === 'organization' ? 'bg-gray-100 text-gray-700' :
                selectedNode.type === 'office' ? 'bg-blue-100 text-blue-700' :
                'bg-green-100 text-green-700'
              }`}>
                {selectedNode.type === 'organization' ? '組織' :
                 selectedNode.type === 'office' ? '事業所' : 'チーム'}
              </span>
              <h2 className="text-2xl font-bold text-text-primary">{selectedNode.name}</h2>
            </div>
            {group?.description && (
              <p className="text-text-grey text-sm">{group.description}</p>
            )}
          </div>
          
          <div className="flex gap-2">
            {/* Actions based on type */}
            {selectedNode.type === 'organization' && (
              <button
                onClick={() => handleOpenModal()}
                className="px-3 py-1.5 bg-main text-white rounded hover:bg-main-dark text-sm flex items-center gap-1"
              >
                <Icon name="Plus" size={16} />
                事業所を追加
              </button>
            )}
            
            {selectedNode.type === 'office' && (
              <>
                <button
                  onClick={() => handleOpenModal(group!)}
                  className="px-3 py-1.5 bg-main text-white rounded hover:bg-main-dark text-sm flex items-center gap-1"
                >
                  <Icon name="Plus" size={16} />
                  チームを追加
                </button>
                <button
                  onClick={() => handleOpenModal(undefined, group!)}
                  className="px-3 py-1.5 border border-border rounded hover:bg-gray-50 text-sm flex items-center gap-1"
                >
                  <Icon name="Edit" size={16} />
                  編集
                </button>
                <button
                  onClick={() => handleDelete(group!.id)}
                  className="px-3 py-1.5 border border-red-200 text-red-600 rounded hover:bg-red-50 text-sm flex items-center gap-1"
                >
                  <Icon name="Trash2" size={16} />
                  削除
                </button>
              </>
            )}

            {selectedNode.type === 'team' && (
              <>
                <button
                  onClick={() => handleOpenModal(undefined, group!)}
                  className="px-3 py-1.5 border border-border rounded hover:bg-gray-50 text-sm flex items-center gap-1"
                >
                  <Icon name="Edit" size={16} />
                  編集
                </button>
                <button
                  onClick={() => handleDelete(group!.id)}
                  className="px-3 py-1.5 border border-red-200 text-red-600 rounded hover:bg-red-50 text-sm flex items-center gap-1"
                >
                  <Icon name="Trash2" size={16} />
                  削除
                </button>
              </>
            )}
          </div>
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <Icon name="Users" size={20} />
              所属メンバー
              <span className="text-sm font-normal text-text-grey ml-2">
                ({selectedNode.users?.length || 0}名)
              </span>
            </h3>
            {/* Add Member Button could go here */}
          </div>

          <div className="flex-1 overflow-y-auto border border-border rounded-lg bg-white">
            {selectedNode.users && selectedNode.users.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-3 text-xs font-medium text-text-grey border-b border-border">名前</th>
                    <th className="p-3 text-xs font-medium text-text-grey border-b border-border">メールアドレス</th>
                    <th className="p-3 text-xs font-medium text-text-grey border-b border-border">ロール</th>
                    <th className="p-3 text-xs font-medium text-text-grey border-b border-border">資格</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedNode.users.map(user => (
                    <tr key={user.id} className="border-b border-border hover:bg-gray-50">
                      <td className="p-3 text-sm text-text-primary">{user.name || '未設定'}</td>
                      <td className="p-3 text-sm text-text-primary">{user.email}</td>
                      <td className="p-3 text-sm">
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700">
                          {user.role}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-text-grey">
                        {user.qualifications?.join(', ') || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-text-grey">
                メンバーがいません
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading && !organization) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white">
      {/* Sidebar */}
      <div className="w-80 border-r border-border bg-gray-50 flex flex-col">
        <div className="p-4 border-b border-border bg-white">
          <h2 className="font-bold text-text-primary">組織構成</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {treeData && renderTree(treeData)}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-hidden bg-white">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}
        {renderDetail()}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-text-primary mb-4">
              {editingGroup ? 'グループ編集' : '新規グループ作成'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  タイプ
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded text-text-primary">
                  {formData.group_type === 'office' ? '事業所' : 'チーム'}
                </div>
              </div>

              {formData.group_type === 'team' && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    所属事業所
                  </label>
                  <select
                    value={formData.parent_id || ''}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-main"
                    required
                    disabled={!!editingGroup} // Prevent moving teams for now to keep it simple
                  >
                    <option value="">選択してください</option>
                    {groups.filter(g => g.group_type === 'office').map(office => (
                      <option key={office.id} value={office.id}>
                        {office.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  グループ名
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-main"
                  placeholder={formData.group_type === 'office' ? "例: 東京本社" : "例: 訪問看護チームA"}
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
                  placeholder="説明を入力してください"
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
