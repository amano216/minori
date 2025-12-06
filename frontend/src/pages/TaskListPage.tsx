import { useState, useEffect, useMemo } from 'react';
import { 
  Check, 
  Clock, 
  FileText, 
  AlertCircle, 
  MessageSquare, 
  Pill, 
  ClipboardList, 
  MoreHorizontal,
  Building2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Plus,
  Megaphone,
  Pencil,
} from 'lucide-react';
import { 
  fetchPatientTasks, 
  fetchGroups,
  markPatientTaskRead, 
  completePatientTask,
  type PatientTask, 
  type TaskType,
  type Group 
} from '../api/client';
import { TaskCreatePanel } from '../components/organisms/TaskCreatePanel';

// タスクタイプのラベルとアイコン
const TASK_TYPE_CONFIG: Record<TaskType, { label: string; icon: React.ReactNode; color: string }> = {
  directive_change: { 
    label: '事前指示変更', 
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-red-600 bg-red-50'
  },
  medication: { 
    label: '服薬変更', 
    icon: <Pill className="w-4 h-4" />,
    color: 'text-orange-600 bg-orange-50'
  },
  care_plan: { 
    label: 'ケアプラン変更', 
    icon: <ClipboardList className="w-4 h-4" />,
    color: 'text-blue-600 bg-blue-50'
  },
  handover: { 
    label: '申し送り', 
    icon: <MessageSquare className="w-4 h-4" />,
    color: 'text-green-600 bg-green-50'
  },
  other: { 
    label: 'その他', 
    icon: <MoreHorizontal className="w-4 h-4" />,
    color: 'text-gray-600 bg-gray-50'
  },
};

type GroupBy = 'none' | 'patient' | 'team' | 'task_type';

export function TaskListPage() {
  const [tasks, setTasks] = useState<PatientTask[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [editingTask, setEditingTask] = useState<PatientTask | null>(null);
  
  // グルーピング（チーム別固定）
  const groupBy: GroupBy = 'team';
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const loadData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    
    try {
      const [tasksResponse, groupsData] = await Promise.all([
        fetchPatientTasks({ status: 'open' }),
        fetchGroups({ status: 'active' }),
      ]);
      setTasks(tasksResponse.tasks);
      setGroups(groupsData);
      
      // 初回読み込み時は全グループを展開
      if (!showRefreshing && tasksResponse.tasks.length > 0) {
        const allGroupKeys = new Set<string>();
        tasksResponse.tasks.forEach(task => {
          const key = getGroupKey(task, groupBy);
          allGroupKeys.add(key);
        });
        setExpandedGroups(allGroupKeys);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getGroupKey = (task: PatientTask, by: GroupBy): string => {
    switch (by) {
      case 'patient':
        return `patient-${task.patient.id}`;
      case 'team':
        const groupId = task.patient.group?.id;
        if (!groupId) return 'team-none';
        return `team-${groupId}`;
      case 'task_type':
        return `type-${task.task_type || 'none'}`;
      default:
        return 'all';
    }
  };

  const getGroupLabel = (key: string, groupList: Group[]): string => {
    if (key === 'all') return 'すべて';
    if (key === 'team-none') return '未所属';
    if (key === 'type-none') return '掲示板';
    
    const [type, id] = key.split('-');
    
    if (type === 'patient') {
      const task = tasks.find(t => t.patient.id === Number(id));
      return task?.patient.name || '不明';
    }
    if (type === 'team') {
      const group = groupList.find(g => g.id === Number(id));
      return group?.name || '不明';
    }
    if (type === 'type') {
      return TASK_TYPE_CONFIG[id as TaskType]?.label || id;
    }
    return key;
  };

  // グルーピング
  const filteredAndGroupedTasks = useMemo(() => {
    // グルーピング
    const grouped = new Map<string, PatientTask[]>();
    
    tasks.forEach(task => {
      const key = getGroupKey(task, groupBy);
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(task);
    });

    // ソート（キーでソート）
    const sortedEntries = Array.from(grouped.entries()).sort((a, b) => {
      // 未所属は最後
      if (a[0] === 'team-none') return 1;
      if (b[0] === 'team-none') return -1;
      return getGroupLabel(a[0], groups).localeCompare(getGroupLabel(b[0], groups), 'ja');
    });

    return sortedEntries;
  }, [tasks, groupBy, groups]);

  const toggleGroup = (key: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedGroups(newExpanded);
  };

  const handleMarkRead = async (taskId: number) => {
    try {
      await markPatientTaskRead(taskId);
      await loadData(true);
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleComplete = async (taskId: number) => {
    try {
      await completePatientTask(taskId);
      await loadData(true);
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  const handleEdit = (task: PatientTask) => {
    setEditingTask(task);
    setShowCreatePanel(true);
  };

  const handleClosePanel = () => {
    setShowCreatePanel(false);
    setEditingTask(null);
  };

  const totalUnread = tasks.filter(t => !t.read_by_current_user && t.status === 'open').length;
  const totalOpen = tasks.filter(t => t.status === 'open').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">案件一覧</h1>
            <p className="text-sm text-gray-500 mt-1">
              {totalOpen}件の未対応 {totalUnread > 0 && `（${totalUnread}件未読）`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreatePanel(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              新規作成
            </button>
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Task List */}
      {filteredAndGroupedTasks.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">案件はありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndGroupedTasks.map(([groupKey, groupTasks]) => (
            <div key={groupKey} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(groupKey)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedGroups.has(groupKey) ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-900">
                    {getGroupLabel(groupKey, groups)}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({groupTasks.length}件)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {groupTasks.filter(t => !t.read_by_current_user && t.status === 'open').length > 0 && (
                    <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full font-medium">
                      {groupTasks.filter(t => !t.read_by_current_user && t.status === 'open').length}件未読
                    </span>
                  )}
                </div>
              </button>

              {/* Group Tasks */}
              {expandedGroups.has(groupKey) && (
                <div className="divide-y divide-gray-100">
                  {groupTasks.map((task) => (
                    task.category === 'board' ? (
                      <BoardRow 
                        key={task.id} 
                        task={task}
                        showPatient={true}
                        onMarkRead={handleMarkRead}
                        onEdit={() => handleEdit(task)}
                      />
                    ) : (
                      <TaskRow 
                        key={task.id} 
                        task={task}
                        showPatient={true}
                        onMarkRead={handleMarkRead}
                        onComplete={handleComplete}
                      />
                    )
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Panel */}
      <TaskCreatePanel
        isOpen={showCreatePanel}
        onClose={handleClosePanel}
        onCreated={() => {
          handleClosePanel();
          loadData(true);
        }}
        editingTask={editingTask}
      />
    </div>
  );
}

// 掲示板行
function BoardRow({ 
  task, 
  showPatient,
  onMarkRead,
  onEdit,
}: { 
  task: PatientTask; 
  showPatient: boolean;
  onMarkRead: (id: number) => void;
  onEdit: () => void;
}) {
  const isUnread = !task.read_by_current_user;

  const handleClick = () => {
    if (isUnread) {
      onMarkRead(task.id);
    }
  };

  return (
    <div 
      className={`px-4 py-3 cursor-pointer hover:bg-amber-50/50 transition-colors ${
        isUnread ? 'border-l-4 border-l-amber-500 bg-amber-50/30' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="p-2 rounded-lg bg-amber-100 flex-shrink-0">
          <Megaphone className="w-4 h-4 text-amber-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {showPatient && (
              <span className="font-medium text-gray-900">{task.patient.name}</span>
            )}
            {isUnread && (
              <span className="px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-700 rounded font-medium">
                NEW
              </span>
            )}
          </div>
          <div className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
            {task.content}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
            <span>{task.created_by?.name || '不明'}</span>
            <span>•</span>
            <span>{new Date(task.created_at).toLocaleDateString('ja-JP')}</span>
          </div>
        </div>

        {/* Edit Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-amber-100 rounded-lg transition-colors flex-shrink-0"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// タスク行
function TaskRow({ 
  task, 
  showPatient,
  onMarkRead, 
  onComplete 
}: { 
  task: PatientTask; 
  showPatient: boolean;
  onMarkRead: (id: number) => void;
  onComplete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = task.task_type ? TASK_TYPE_CONFIG[task.task_type] : { label: 'その他', icon: <MoreHorizontal className="w-4 h-4" />, color: 'text-gray-600 bg-gray-50' };
  const isUnread = !task.read_by_current_user;
  const isDone = task.status === 'done';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleClick = () => {
    setExpanded(!expanded);
    if (isUnread) {
      onMarkRead(task.id);
    }
  };

  return (
    <div className={`${isDone ? 'bg-gray-50' : ''}`}>
      <div 
        className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
          isUnread && !isDone ? 'border-l-4 border-l-red-500' : ''
        }`}
        onClick={handleClick}
      >
        <div className="flex items-start gap-4">
          {/* Type Icon */}
          <div className={`p-2 rounded-lg ${config.color} flex-shrink-0`}>
            {config.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-medium ${isDone ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                {config.label}
              </span>
              {isUnread && !isDone && (
                <span className="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-600 rounded font-medium">
                  未読
                </span>
              )}
              {isDone && (
                <span className="px-1.5 py-0.5 text-[10px] bg-green-100 text-green-600 rounded font-medium">
                  完了
                </span>
              )}
            </div>
            {task.content && (
              <p className={`text-sm mt-1 ${isDone ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                {task.content}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 flex-wrap">
              {showPatient && (
                <>
                  <span className="font-medium">{task.patient.name}</span>
                  <span>•</span>
                </>
              )}
              <span>{task.created_by?.name || '不明'}</span>
              <span>•</span>
              <span>{formatDateTime(task.created_at)}</span>
              {task.due_date && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-orange-600">
                    <Clock className="w-3.5 h-3.5" />
                    期限: {formatDate(task.due_date)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {isDone ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : (
              <div className="text-xs text-gray-400">
                {task.read_count}/{task.total_staff_count}
              </div>
            )}
            {expanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 ml-14 border-t border-gray-100 pt-3">
          {task.content && (
            <div className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 mb-3">
              {task.content}
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="space-y-1">
              <div>作成: {new Date(task.created_at).toLocaleString('ja-JP')}</div>
              {task.completed_at && (
                <div>完了: {new Date(task.completed_at).toLocaleString('ja-JP')} by {task.completed_by?.name}</div>
              )}
            </div>

            {!isDone && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete(task.id);
                }}
                className="flex items-center gap-1 px-4 py-2 text-sm text-green-600 border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
              >
                <Check className="w-4 h-4" />
                完了にする
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
