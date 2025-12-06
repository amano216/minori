import { useState, useEffect } from 'react';
import { X, AlertCircle, Pill, ClipboardList, MessageSquare, MoreHorizontal, Megaphone, ListTodo, Pencil } from 'lucide-react';
import { Button } from '../atoms/Button';
import { 
  fetchPatients,
  fetchPatientTasks,
  createPatientTask,
  updatePatientTask,
  type Patient,
  type TaskType,
  type TaskCategory,
  type PatientTaskInput,
  type PatientTask,
} from '../../api/client';

// タスクタイプの設定
const TASK_TYPE_OPTIONS: { value: TaskType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'directive_change', label: '事前指示変更', icon: <AlertCircle className="w-4 h-4" />, color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'medication', label: '服薬変更', icon: <Pill className="w-4 h-4" />, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { value: 'care_plan', label: 'ケアプラン変更', icon: <ClipboardList className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'handover', label: '申し送り', icon: <MessageSquare className="w-4 h-4" />, color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'other', label: 'その他', icon: <MoreHorizontal className="w-4 h-4" />, color: 'text-gray-600 bg-gray-50 border-gray-200' },
];

// カテゴリの設定
const CATEGORY_OPTIONS: { value: TaskCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'board', label: '掲示板', icon: <Megaphone className="w-4 h-4" /> },
  { value: 'task', label: 'タスク', icon: <ListTodo className="w-4 h-4" /> },
];

interface TaskCreatePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  preselectedPatientId?: number;
  editingTask?: PatientTask | null;
}

export function TaskCreatePanel({ isOpen, onClose, onCreated, preselectedPatientId, editingTask }: TaskCreatePanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [existingBoards, setExistingBoards] = useState<Map<number, PatientTask>>(new Map());
  
  // フォーム
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
  const [category, setCategory] = useState<TaskCategory>('task');
  const [taskType, setTaskType] = useState<TaskType>('handover');
  const [content, setContent] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 既存掲示板編集モード
  const [editingExistingBoard, setEditingExistingBoard] = useState<PatientTask | null>(null);

  const isEditing = !!editingTask || !!editingExistingBoard;
  
  // 選択した患者の既存掲示板
  const existingBoard = selectedPatientId ? existingBoards.get(selectedPatientId as number) : null;
  // 既存掲示板を編集中でない場合のみ表示
  const showExistingBoardWarning = category === 'board' && !editingTask && !editingExistingBoard && existingBoard;

  // 患者リストと既存の掲示板を取得（パネルが開いた時）
  useEffect(() => {
    if (!isOpen) return;
    
    const loadData = async () => {
      setLoadingPatients(true);
      setError(null);
      try {
        // まず患者だけ取得
        const patientsData = await fetchPatients({ status: 'active' });
        setPatients(patientsData || []);
        
        // 次に掲示板を取得（失敗しても患者は表示できるように）
        try {
          const boardsResponse = await fetchPatientTasks({ category: 'board' });
          const boardMap = new Map<number, PatientTask>();
          boardsResponse.tasks.forEach(task => {
            boardMap.set(task.patient.id, task);
          });
          setExistingBoards(boardMap);
        } catch (boardErr) {
          console.error('Failed to load boards:', boardErr);
        }
      } catch (err) {
        console.error('Failed to load patients:', err);
        setError('患者データの読み込みに失敗しました');
      } finally {
        setLoadingPatients(false);
      }
    };
    loadData();
  }, [isOpen]);

  // パネル開閉のアニメーション
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
      
      if (editingTask) {
        // 編集モード
        setSelectedPatientId(editingTask.patient.id);
        setCategory(editingTask.category);
        setTaskType(editingTask.task_type || 'handover');
        setContent(editingTask.content || '');
        setDueDate(editingTask.due_date || '');
        setEditingExistingBoard(null);
      } else {
        // 新規作成モード
        setSelectedPatientId(preselectedPatientId || '');
        setCategory('task');
        setTaskType('handover');
        setContent('');
        setDueDate('');
        setEditingExistingBoard(null);
      }
      setError(null);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, preselectedPatientId, editingTask]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatientId) {
      setError('患者を選択してください');
      return;
    }
    if (!content.trim()) {
      setError('内容を入力してください');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const input: PatientTaskInput = {
        category,
        content: content.trim(),
        task_type: category === 'task' ? taskType : null,
        due_date: category === 'task' && dueDate ? dueDate : null,
      };
      
      if (editingTask) {
        // 外部から渡された編集対象
        await updatePatientTask(editingTask.id, input);
      } else if (editingExistingBoard) {
        // 既存掲示板の編集
        await updatePatientTask(editingExistingBoard.id, input);
      } else {
        // 新規作成
        await createPatientTask(selectedPatientId as number, input);
      }
      
      onCreated();
      handleClose();
    } catch (err) {
      console.error('Failed to save task:', err);
      setError(isEditing ? '更新に失敗しました' : '作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />
      
      {/* Panel */}
      <div
        className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-16 sm:right-4 sm:bottom-4 w-full sm:w-[420px] bg-white shadow-2xl sm:border sm:border-gray-200 sm:rounded-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col max-h-[90vh] sm:max-h-none rounded-t-2xl sm:rounded-xl ${
          isVisible ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-y-0 sm:translate-x-[120%]'
        }`}
      >
        {/* Drag Handle for Mobile */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {editingTask ? '案件を編集' : editingExistingBoard ? '掲示板を編集' : '新規案件'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
          <div className="space-y-5">
            {/* カテゴリ選択 */}
            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  種類
                </label>
                <div className="flex gap-2">
                  {CATEGORY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setCategory(option.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all ${
                        category === option.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {option.icon}
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 患者選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                患者 <span className="text-red-500">*</span>
              </label>
              {loadingPatients ? (
                <div className="text-gray-400 text-sm">読み込み中...</div>
              ) : patients.length === 0 ? (
                <div className="text-red-500 text-sm">患者データがありません</div>
              ) : (
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                  disabled={isEditing}
                >
                  <option value="">患者を選択...</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} {patient.group ? `(${patient.group.name})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 既存の掲示板がある場合の表示（掲示板カテゴリで新規作成時のみ） */}
            {showExistingBoardWarning && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Megaphone className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-amber-800 mb-1">
                      この患者には既に掲示板があります
                    </p>
                    <p className="text-xs text-amber-700 line-clamp-2 mb-2">
                      {existingBoard.content}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        // 既存掲示板の編集モードに切り替え
                        setEditingExistingBoard(existingBoard);
                        setContent(existingBoard.content || '');
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      この掲示板を編集する
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 既存掲示板編集モードの表示 */}
            {editingExistingBoard && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-800">
                    既存の掲示板を編集中
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingExistingBoard(null);
                      setContent('');
                    }}
                    className="ml-auto text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            {/* 種別（タスクの場合のみ） */}
            {category === 'task' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  種別
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TASK_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTaskType(option.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                        taskType === option.value
                          ? `${option.color} border-current font-medium ring-2 ring-offset-1 ring-current/30`
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 内容 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={category === 'board' ? '掲示する内容を入力...' : 'タスクの内容を入力...'}
                rows={5}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                required
              />
            </div>

            {/* 期限（タスクの場合のみ） */}
            {category === 'task' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  期限
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            )}

            {/* エラー表示 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={handleClose}
              disabled={submitting}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              onClick={handleSubmit}
              disabled={submitting || !selectedPatientId || !content.trim()}
            >
              {submitting ? (isEditing ? '更新中...' : '作成中...') : (isEditing ? '更新' : '作成')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
