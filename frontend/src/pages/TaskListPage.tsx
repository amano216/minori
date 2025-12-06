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
  RefreshCw,
  Plus,
  Megaphone,
  Pencil,
  Search,
} from 'lucide-react';
import { 
  fetchPatientTasks, 
  completePatientTask,
  type PatientTask, 
  type TaskType,
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

export function TaskListPage() {
  const [tasks, setTasks] = useState<PatientTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [editingTask, setEditingTask] = useState<PatientTask | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    
    try {
      const tasksResponse = await fetchPatientTasks({ status: 'open' });
      setTasks(tasksResponse.tasks);
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

  // 検索フィルター
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    
    const query = searchQuery.toLowerCase();
    return tasks.filter(task => 
      task.patient.name.toLowerCase().includes(query) ||
      task.content?.toLowerCase().includes(query) ||
      (task.task_type && TASK_TYPE_CONFIG[task.task_type]?.label.toLowerCase().includes(query))
    );
  }, [tasks, searchQuery]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">案件一覧</h1>
            <p className="text-sm text-gray-500">{tasks.length}件</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreatePanel(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              新規作成
            </button>
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="患者名、内容で検索..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
          />
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{searchQuery ? '検索結果がありません' : '案件はありません'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            task.category === 'board' ? (
              <BoardRow 
                key={task.id} 
                task={task}
                onEdit={() => handleEdit(task)}
              />
            ) : (
              <TaskRow 
                key={task.id} 
                task={task}
                onComplete={handleComplete}
              />
            )
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
  onEdit,
}: { 
  task: PatientTask; 
  onEdit: () => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-amber-300 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="p-1.5 rounded-lg bg-amber-100 flex-shrink-0">
            <Megaphone className="w-4 h-4 text-amber-600" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900">{task.patient.name}</span>
              <span className="text-xs text-amber-600 font-medium">掲示板</span>
            </div>
            <div className="text-sm text-gray-600 line-clamp-2">
              {task.content}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {task.created_by?.name} • {new Date(task.created_at).toLocaleDateString('ja-JP')}
            </div>
          </div>

          {/* Edit Button */}
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors flex-shrink-0"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// タスク行
function TaskRow({ 
  task, 
  onComplete 
}: { 
  task: PatientTask; 
  onComplete: (id: number) => void;
}) {
  const config = task.task_type ? TASK_TYPE_CONFIG[task.task_type] : { label: 'タスク', icon: <MoreHorizontal className="w-4 h-4" />, color: 'text-gray-600 bg-gray-50' };
  const isDone = task.status === 'done';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className={`bg-white rounded-lg border transition-colors ${isDone ? 'border-gray-100 bg-gray-50' : 'border-gray-200 hover:border-indigo-300'}`}>
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          {/* Type Icon */}
          <div className={`p-1.5 rounded-lg ${config.color} flex-shrink-0`}>
            {config.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`font-medium ${isDone ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                {task.patient.name}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${config.color}`}>
                {config.label}
              </span>
              {isDone && (
                <span className="text-xs text-green-600 font-medium">✓ 完了</span>
              )}
            </div>
            {task.content && (
              <p className={`text-sm ${isDone ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                {task.content}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 flex-wrap">
              <span>{task.created_by?.name}</span>
              <span>•</span>
              <span>{new Date(task.created_at).toLocaleDateString('ja-JP')}</span>
              {task.due_date && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-orange-500">
                    <Clock className="w-3 h-3" />
                    {formatDate(task.due_date)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action */}
          {!isDone && (
            <button
              onClick={() => onComplete(task.id)}
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors flex-shrink-0"
              title="完了にする"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
