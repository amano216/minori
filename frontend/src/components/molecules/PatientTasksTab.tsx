import { useState, useEffect } from 'react';
import { Plus, Check, Clock, FileText, AlertCircle, MessageSquare, Pill, ClipboardList, MoreHorizontal, Megaphone, Pencil } from 'lucide-react';
import { 
  fetchPatientTasks, 
  completePatientTask,
  type PatientTask, 
  type TaskType,
} from '../../api/client';
import { TaskCreatePanel } from '../organisms/TaskCreatePanel';

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
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [editingTask, setEditingTask] = useState<PatientTask | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all');

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

  const handleComplete = async (taskId: number) => {
    try {
      await completePatientTask(taskId);
      await loadTasks();
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
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  // 掲示板とタスクを分離
  const boards = tasks.filter(t => t.category === 'board');
  const taskItems = tasks.filter(t => t.category === 'task');
  const openTasks = taskItems.filter(t => t.status === 'open');
  const doneTasks = taskItems.filter(t => t.status === 'done');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {patientName}の案件
        </div>
        <button
          onClick={() => setShowCreatePanel(true)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          追加
        </button>
      </div>

      {/* 掲示板セクション */}
      {boards.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Megaphone className="w-4 h-4 text-amber-500" />
            掲示板
          </div>
          <div className="space-y-2">
            {boards.map((board) => (
              <BoardItem 
                key={board.id} 
                board={board}
                onEdit={() => handleEdit(board)}
              />
            ))}
          </div>
        </div>
      )}

      {/* タスクセクション */}
      <div className="space-y-2">
        {boards.length > 0 && (
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mt-4">
            <FileText className="w-4 h-4 text-indigo-500" />
            タスク
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            すべて ({taskItems.length})
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
        {taskItems.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>案件はありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {taskItems.map((task) => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onComplete={handleComplete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Panel */}
      <TaskCreatePanel
        isOpen={showCreatePanel}
        onClose={handleClosePanel}
        onCreated={() => {
          handleClosePanel();
          loadTasks();
        }}
        preselectedPatientId={patientId}
        editingTask={editingTask}
      />
    </div>
  );
}

// 掲示板アイテム
function BoardItem({ 
  board, 
  onEdit,
}: { 
  board: PatientTask; 
  onEdit: () => void;
}) {
  return (
    <div className="relative bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Megaphone className="w-5 h-5 text-amber-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-800 whitespace-pre-wrap">
            {board.content}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span>{board.created_by?.name || '不明'}</span>
            <span>•</span>
            <span>{new Date(board.created_at).toLocaleDateString('ja-JP')}</span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-amber-100 rounded-md transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// タスクアイテム
function TaskItem({ 
  task, 
  onComplete 
}: { 
  task: PatientTask; 
  onComplete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = task.task_type ? TASK_TYPE_CONFIG[task.task_type] : { label: 'その他', icon: <MoreHorizontal className="w-4 h-4" />, color: 'text-gray-600 bg-gray-50' };
  const isDone = task.status === 'done';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div 
      className={`border rounded-lg overflow-hidden transition-all ${
        isDone ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-indigo-300'
      }`}
    >
      <div 
        className="p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
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
                {config.label}
              </span>
            </div>
            {task.content && (
              <p className={`text-sm mt-1 ${isDone ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                {task.content}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
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
          {isDone && (
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
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
