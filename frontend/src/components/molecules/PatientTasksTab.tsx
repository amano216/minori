import { useState, useEffect } from 'react';
import { Plus, Check, Clock, FileText, AlertCircle, MessageSquare, Pill, ClipboardList, MoreHorizontal } from 'lucide-react';
import { 
  fetchPatientTasks, 
  createPatientTask, 
  markPatientTaskRead, 
  completePatientTask,
  type PatientTask, 
  type TaskType, 
  type PatientTaskInput 
} from '../../api/client';

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

interface PatientTasksTabProps {
  patientId: number;
  patientName: string;
}

export function PatientTasksTab({ patientId, patientName }: PatientTasksTabProps) {
  const [tasks, setTasks] = useState<PatientTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all');
  
  // 新規タスク用フォーム
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTaskType, setNewTaskType] = useState<TaskType>('handover');
  const [newDueDate, setNewDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTasks = async () => {
    try {
      const response = await fetchPatientTasks({ 
        patient_id: patientId,
        status: filter === 'all' ? undefined : filter as 'open' | 'done'
      });
      setTasks(response.tasks);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [patientId, filter]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    try {
      const input: PatientTaskInput = {
        title: newTitle.trim(),
        content: newContent.trim() || undefined,
        task_type: newTaskType,
        due_date: newDueDate || undefined,
      };
      await createPatientTask(patientId, input);
      
      // フォームをリセット
      setNewTitle('');
      setNewContent('');
      setNewTaskType('handover');
      setNewDueDate('');
      setShowAddForm(false);
      
      // リロード
      await loadTasks();
    } catch (err) {
      console.error('Failed to create task:', err);
      alert('案件の作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkRead = async (taskId: number) => {
    try {
      await markPatientTaskRead(taskId);
      await loadTasks();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleComplete = async (taskId: number) => {
    try {
      await completePatientTask(taskId);
      await loadTasks();
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  const openTasks = tasks.filter(t => t.status === 'open');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {patientName}の案件
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          追加
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleAddTask} className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">タイトル *</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="案件のタイトル"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-500 mb-1">種別</label>
            <select
              value={newTaskType}
              onChange={(e) => setNewTaskType(e.target.value as TaskType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.entries(TASK_TYPE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">内容</label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="詳細な内容（任意）"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">期限</label>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={submitting || !newTitle.trim()}
              className="flex-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? '作成中...' : '作成'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
            filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          すべて ({tasks.length})
        </button>
        <button
          onClick={() => setFilter('open')}
          className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
            filter === 'open' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          未対応 ({openTasks.length})
        </button>
        <button
          onClick={() => setFilter('done')}
          className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
            filter === 'done' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          完了 ({doneTasks.length})
        </button>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>案件はありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onMarkRead={handleMarkRead}
              onComplete={handleComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 個別のタスクアイテム
function TaskItem({ 
  task, 
  onMarkRead, 
  onComplete 
}: { 
  task: PatientTask; 
  onMarkRead: (id: number) => void;
  onComplete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = TASK_TYPE_CONFIG[task.task_type];
  const isUnread = !task.read_by_current_user;
  const isDone = task.status === 'done';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const handleClick = () => {
    setExpanded(!expanded);
    if (isUnread) {
      onMarkRead(task.id);
    }
  };

  return (
    <div 
      className={`border rounded-lg overflow-hidden transition-all ${
        isDone ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-indigo-300'
      } ${isUnread && !isDone ? 'border-l-4 border-l-red-500' : ''}`}
    >
      <div 
        className="p-3 cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex items-start gap-3">
          {/* Type Icon */}
          <div className={`p-1.5 rounded-md ${config.color}`}>
            {config.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-medium text-sm ${isDone ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                {task.title}
              </span>
              {isUnread && !isDone && (
                <span className="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-600 rounded font-medium">
                  未読
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
              <span>{config.label}</span>
              <span>•</span>
              <span>{task.created_by?.name || '不明'}</span>
              {task.due_date && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {formatDate(task.due_date)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Status */}
          {isDone ? (
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
          ) : (
            <div className="text-xs text-gray-400">
              {task.read_count}/{task.total_staff_count}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-100">
          {task.content && (
            <div className="mt-3 text-sm text-gray-600 whitespace-pre-wrap">
              {task.content}
            </div>
          )}
          
          <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
            <span>作成: {new Date(task.created_at).toLocaleString('ja-JP')}</span>
            {task.completed_at && (
              <span>完了: {new Date(task.completed_at).toLocaleString('ja-JP')} by {task.completed_by?.name}</span>
            )}
          </div>

          {!isDone && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete(task.id);
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 border border-green-300 rounded-md hover:bg-green-50 transition-colors"
              >
                <Check className="w-4 h-4" />
                完了にする
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
