import { useState, useEffect } from 'react';
import { X, AlertCircle, Pill, ClipboardList, MessageSquare, MoreHorizontal } from 'lucide-react';
import { Button } from '../atoms/Button';
import { 
  fetchPatients,
  createPatientTask,
  type Patient,
  type TaskType,
  type PatientTaskInput,
} from '../../api/client';

// タスクタイプの設定
const TASK_TYPE_OPTIONS: { value: TaskType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'directive_change', label: '事前指示変更', icon: <AlertCircle className="w-4 h-4" />, color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'medication', label: '服薬変更', icon: <Pill className="w-4 h-4" />, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { value: 'care_plan', label: 'ケアプラン変更', icon: <ClipboardList className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'handover', label: '申し送り', icon: <MessageSquare className="w-4 h-4" />, color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'other', label: 'その他', icon: <MoreHorizontal className="w-4 h-4" />, color: 'text-gray-600 bg-gray-50 border-gray-200' },
];

interface TaskCreatePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  preselectedPatientId?: number;
}

export function TaskCreatePanel({ isOpen, onClose, onCreated, preselectedPatientId }: TaskCreatePanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  
  // フォーム
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('handover');
  const [content, setContent] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 患者リストを取得
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const data = await fetchPatients({ status: 'active' });
        setPatients(data);
      } catch (err) {
        console.error('Failed to load patients:', err);
      } finally {
        setLoadingPatients(false);
      }
    };
    loadPatients();
  }, []);

  // パネル開閉のアニメーション
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
      // 初期値をリセット
      setSelectedPatientId(preselectedPatientId || '');
      setTitle('');
      setTaskType('handover');
      setContent('');
      setDueDate('');
      setError(null);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, preselectedPatientId]);

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
    if (!title.trim()) {
      setError('タイトルを入力してください');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const input: PatientTaskInput = {
        title: title.trim(),
        task_type: taskType,
        content: content.trim() || undefined,
        due_date: dueDate || undefined,
      };
      await createPatientTask(selectedPatientId as number, input);
      onCreated();
      handleClose();
    } catch (err) {
      console.error('Failed to create task:', err);
      setError('案件の作成に失敗しました');
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
          <h2 className="text-lg font-bold text-gray-900">新規案件の作成</h2>
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
            {/* 患者選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                患者 <span className="text-red-500">*</span>
              </label>
              {loadingPatients ? (
                <div className="text-gray-400 text-sm">読み込み中...</div>
              ) : (
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
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

            {/* タイトル */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="案件のタイトルを入力"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            {/* 種別 */}
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

            {/* 内容 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                内容
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="詳細な内容（任意）"
                rows={4}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>

            {/* 期限 */}
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
              disabled={submitting || !selectedPatientId || !title.trim()}
            >
              {submitting ? '作成中...' : '作成'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
