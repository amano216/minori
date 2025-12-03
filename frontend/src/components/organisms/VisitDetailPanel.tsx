import { useState, useEffect, useMemo } from 'react';
import { X, Clock, User, FileText, MapPin, Calendar, Edit, Trash2, CheckCircle, XCircle, RefreshCw, Save, ExternalLink, History } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { HistoryPanel } from '../molecules/HistoryPanel';
import { fetchVisits, fetchPlanningLanes, type Staff, type Visit, type Group, type PlanningLane } from '../../api/client';

interface VisitDetailPanelProps {
  visit: Visit | null;
  staffs?: Staff[];
  groups?: Group[];
  onClose: () => void;
  onEdit?: (visitId: number) => void;
  onCancel?: (visitId: number) => void;
  onComplete?: (visitId: number) => void;
  onReassign?: (visitId: number) => void;
  onUpdate?: (visitId: number, data: { 
    staff_id?: number | null; 
    scheduled_at?: string; 
    status?: string;
    duration?: number;
    notes?: string;
    planning_lane_id?: number | null;
  }) => Promise<void>;
  onDelete?: (visitId: number) => Promise<void>;
}

// 所要時間の選択肢
const DURATION_OPTIONS = [
  { value: 30, label: '30分' },
  { value: 45, label: '45分' },
  { value: 60, label: '1時間' },
  { value: 90, label: '1時間30分' },
  { value: 120, label: '2時間' },
];

const STATUS_LABELS: Record<string, string> = {
  scheduled: '予定',
  in_progress: '実施中',
  completed: '完了',
  cancelled: 'キャンセル',
  unassigned: '未割当',
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  unassigned: 'bg-gray-100 text-gray-800',
};

// 監査ログ用のフィールドラベル
const VISIT_FIELD_LABELS: Record<string, string> = {
  scheduled_at: '予定日時',
  duration: '所要時間',
  user_id: '担当スタッフ',
  staff_id: '担当スタッフ',
  patient_id: '利用者',
  status: 'ステータス',
  notes: '備考',
  planning_lane_id: 'レーン',
};

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return `${hours}時間${mins}分`;
  } else if (hours > 0) {
    return `${hours}時間`;
  } else {
    return `${mins}分`;
  }
}

function PatientCalendar({ patientId }: { patientId: number }) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const loadVisits = async () => {
      setLoading(true);
      try {
        // Fetch visits for the patient
        // Ideally we should filter by date range, but for now we fetch all and filter client side or rely on API default
        const data = await fetchVisits({ patient_id: patientId });
        setVisits(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadVisits();
  }, [patientId]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const getVisitsForDay = (day: number) => {
    return visits.filter(v => {
      const d = new Date(v.scheduled_at);
      return d.getDate() === day && 
             d.getMonth() === currentMonth.getMonth() && 
             d.getFullYear() === currentMonth.getFullYear();
    });
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  if (loading) return <div className="p-4 text-center text-gray-500">読み込み中...</div>;

  return (
    <div className="mt-4 border rounded-lg p-3 bg-white">
      <div className="flex justify-between items-center mb-2">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">&lt;</button>
        <span className="font-bold text-sm">
          {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
        </span>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">&gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1">
        <div className="text-red-500">日</div>
        <div>月</div>
        <div>火</div>
        <div>水</div>
        <div>木</div>
        <div>金</div>
        <div className="text-blue-500">土</div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {blanks.map(i => <div key={`blank-${i}`} className="h-8"></div>)}
        {days.map(day => {
          const dayVisits = getVisitsForDay(day);
          const hasVisit = dayVisits.length > 0;
          return (
            <div key={day} className={`h-8 flex flex-col items-center justify-center rounded-sm ${hasVisit ? 'bg-indigo-50 font-bold text-indigo-700' : 'hover:bg-gray-50'}`}>
              <span className="text-xs">{day}</span>
              {hasVisit && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayVisits.map(v => (
                    <div key={v.id} className={`w-1 h-1 rounded-full ${v.status === 'unassigned' ? 'bg-red-400' : 'bg-indigo-400'}`} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-xs text-gray-500 flex gap-2 justify-center">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-400"></div>予定あり</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"></div>未割当</div>
      </div>
    </div>
  );
}

export function VisitDetailPanel({
  visit,
  staffs = [],
  groups = [],
  onClose,
  // onEdit is deprecated - inline editing is now used instead
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onEdit: _onEdit,
  onCancel,
  onComplete,
  onReassign,
  onUpdate,
  onDelete,
}: VisitDetailPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'calendar' | 'history'>('details');
  const [isReassigning, setIsReassigning] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<number | ''>('');
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // 編集モード用ステート
  const [isEditing, setIsEditing] = useState(false);
  const [editedScheduledAt, setEditedScheduledAt] = useState('');
  const [editedDuration, setEditedDuration] = useState(60);
  const [editedNotes, setEditedNotes] = useState('');
  const [editedPlanningLaneId, setEditedPlanningLaneId] = useState<number | null>(null);
  const [editedStaffId, setEditedStaffId] = useState<number | null>(null);
  const [planningLanes, setPlanningLanes] = useState<PlanningLane[]>([]);

  // スタッフをグループ別にソート（「親 > チーム - スタッフ名」形式）
  const staffsWithGroupLabels = useMemo(() => {
    const groupMap = new Map<number, Group>();
    groups.forEach(g => groupMap.set(g.id, g));

    return staffs.map(staff => {
      let groupName = '未所属';
      if (staff.group_id) {
        const group = groupMap.get(staff.group_id);
        if (group) {
          const parent = group.parent_id ? groupMap.get(group.parent_id) : null;
          groupName = parent ? `${parent.name} > ${group.name}` : group.name;
        }
      }
      return { ...staff, groupLabel: `${groupName} - ${staff.name}`, sortKey: groupName };
    }).sort((a, b) => {
      // グループ名でソート、同じグループ内ではスタッフ名でソート
      if (a.sortKey !== b.sortKey) {
        return a.sortKey.localeCompare(b.sortKey, 'ja');
      }
      return a.name.localeCompare(b.name, 'ja');
    });
  }, [staffs, groups]);

  useEffect(() => {
    if (visit) {
      setTimeout(() => setIsVisible(true), 10);
      setActiveTab('details'); // Reset tab when visit changes
      setIsReassigning(false);
      setSelectedStaffId(visit.staff_id || '');
      setUpdating(false); // Reset updating state
      setDeleting(false); // Reset deleting state
      setIsEditing(false); // Reset editing state
      // 編集用フィールドを初期化
      const scheduledDate = new Date(visit.scheduled_at);
      // datetime-local用のフォーマット（YYYY-MM-DDTHH:mm）
      const localDatetime = scheduledDate.getFullYear() + '-' +
        String(scheduledDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(scheduledDate.getDate()).padStart(2, '0') + 'T' +
        String(scheduledDate.getHours()).padStart(2, '0') + ':' +
        String(scheduledDate.getMinutes()).padStart(2, '0');
      setEditedScheduledAt(localDatetime);
      setEditedDuration(visit.duration);
      setEditedNotes(visit.notes || '');
      setEditedPlanningLaneId(visit.planning_lane_id || null);
      setEditedStaffId(visit.staff_id || null);
    } else {
      setIsVisible(false);
    }
  }, [visit]);

  // 計画レーンを取得
  useEffect(() => {
    const loadPlanningLanes = async () => {
      try {
        const lanes = await fetchPlanningLanes();
        setPlanningLanes(lanes.filter(l => !l.archived_at));
      } catch (err) {
        console.error('Failed to load planning lanes:', err);
      }
    };
    loadPlanningLanes();
  }, []);

  if (!visit) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleReassignSave = async () => {
    if (!visit || !onUpdate) return;
    setUpdating(true);
    try {
      await onUpdate(visit.id, { 
        staff_id: selectedStaffId || null,
        status: selectedStaffId ? 'scheduled' : 'unassigned'
      });
      setIsReassigning(false);
    } catch (error) {
      console.error('Failed to reassign:', error);
      alert('再割当に失敗しました');
    } finally {
      setUpdating(false);
    }
  };

  // 編集モード開始
  const handleStartEditing = () => {
    if (!visit) return;
    setIsEditing(true);
  };

  // 編集キャンセル
  const handleCancelEditing = () => {
    if (!visit) return;
    // 元の値に戻す
    const scheduledDate = new Date(visit.scheduled_at);
    const localDatetime = scheduledDate.getFullYear() + '-' +
      String(scheduledDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(scheduledDate.getDate()).padStart(2, '0') + 'T' +
      String(scheduledDate.getHours()).padStart(2, '0') + ':' +
      String(scheduledDate.getMinutes()).padStart(2, '0');
    setEditedScheduledAt(localDatetime);
    setEditedDuration(visit.duration);
    setEditedNotes(visit.notes || '');
    setEditedPlanningLaneId(visit.planning_lane_id || null);
    setEditedStaffId(visit.staff_id || null);
    setIsEditing(false);
  };

  // 編集保存
  const handleSaveEditing = async () => {
    if (!visit || !onUpdate) return;
    setUpdating(true);
    try {
      const updateData: {
        scheduled_at?: string;
        duration?: number;
        notes?: string;
        planning_lane_id?: number | null;
        staff_id?: number | null;
        status?: string;
      } = {};

      // 変更があったフィールドのみ送信
      const newScheduledAt = new Date(editedScheduledAt).toISOString();
      if (newScheduledAt !== visit.scheduled_at) {
        updateData.scheduled_at = newScheduledAt;
      }
      if (editedDuration !== visit.duration) {
        updateData.duration = editedDuration;
      }
      if (editedNotes !== (visit.notes || '')) {
        updateData.notes = editedNotes;
      }
      if (editedPlanningLaneId !== visit.planning_lane_id) {
        updateData.planning_lane_id = editedPlanningLaneId;
      }
      if (editedStaffId !== visit.staff_id) {
        updateData.staff_id = editedStaffId;
        updateData.status = editedStaffId ? 'scheduled' : 'unassigned';
      }

      // 変更がある場合のみAPI呼び出し
      if (Object.keys(updateData).length > 0) {
        await onUpdate(visit.id, updateData);
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
      // エラーは親コンポーネントでハンドリングされる
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!visit || !onDelete) return;
    
    // 確認ダイアログ
    if (!confirm('この予定を削除しますか？\nこの操作は取り消せません。')) {
      return;
    }
    
    setDeleting(true);
    try {
      await onDelete(visit.id);
      // Panel will be closed by parent
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('削除に失敗しました。もう一度お試しください。');
      setDeleting(false);
    }
  };

  const canEdit = visit.status === 'scheduled' || visit.status === 'unassigned';
  const canCancel = visit.status === 'scheduled' || visit.status === 'in_progress';
  const canComplete = visit.status === 'scheduled' || visit.status === 'in_progress';
  const canReassign = visit.status === 'scheduled' || visit.status === 'unassigned';
  const canDelete = true; // Always allow delete for now, or restrict based on role/status

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/30 z-30 sm:hidden transition-opacity ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />
      {/* Panel */}
      <div
        className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-16 sm:right-4 sm:bottom-4 w-full sm:w-96 bg-white shadow-2xl sm:border sm:border-gray-200 sm:rounded-xl z-40 transform transition-transform duration-300 ease-in-out flex flex-col max-h-[85vh] sm:max-h-none rounded-t-2xl sm:rounded-xl ${
          isVisible ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-y-0 sm:translate-x-[120%]'
        }`}
      >
        {/* Drag Handle for Mobile */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100">
          <div className="flex gap-2 items-center">
             <Badge className={STATUS_COLORS[visit.status]}>
                {STATUS_LABELS[visit.status]}
             </Badge>
          </div>
          <div className="flex gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('details')}
              className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${activeTab === 'details' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}
              title="詳細を表示"
            >
              <FileText className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${activeTab === 'calendar' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}
              title="カレンダーを表示"
            >
              <Calendar className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${activeTab === 'history' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}
              title="変更履歴を表示"
            >
              <History className="w-5 h-5" />
            </button>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {activeTab === 'details' ? (
            <div className="space-y-6">
              {/* Patient（編集不可） */}
              <div className="flex items-center gap-4">
                <User className="w-5 h-5 text-gray-400" />
                <div className="font-medium text-gray-900 text-lg">{visit.patient.name}</div>
              </div>

              {/* Staff（編集モードまたは担当変更ボタンで変更可能） */}
              <div className="flex items-center gap-4">
                <User className="w-5 h-5 text-indigo-400" />
                <div className="flex-1">
                  {isEditing || isReassigning ? (
                    <select
                      value={isEditing ? (editedStaffId || '') : selectedStaffId}
                      onChange={(e) => {
                        const value = e.target.value ? Number(e.target.value) : null;
                        if (isEditing) {
                          setEditedStaffId(value);
                        } else {
                          setSelectedStaffId(value || '');
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">未割当</option>
                      {staffsWithGroupLabels.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.groupLabel}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="font-medium text-gray-900">
                      {visit.staff?.name || '未割当'}
                    </div>
                  )}
                </div>
              </div>

              {/* Scheduled Time */}
              <div className="flex items-center gap-4">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  {isEditing ? (
                    <input
                      type="datetime-local"
                      value={editedScheduledAt}
                      onChange={(e) => setEditedScheduledAt(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  ) : (
                    <div className="font-medium text-gray-900">
                      {formatDateTime(visit.scheduled_at)}
                    </div>
                  )}
                </div>
              </div>

              {/* Duration */}
              <div className="flex items-center gap-4">
                <Clock className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  {isEditing ? (
                    <select
                      value={editedDuration}
                      onChange={(e) => setEditedDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {DURATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="font-medium text-gray-900">
                      {formatDuration(visit.duration)}
                    </div>
                  )}
                </div>
              </div>

              {/* Planning Lane */}
              {isEditing && (
                <div className="flex items-center gap-4">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <select
                      value={editedPlanningLaneId || ''}
                      onChange={(e) => setEditedPlanningLaneId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">レーンなし</option>
                      {planningLanes.map((lane) => (
                        <option key={lane.id} value={lane.id}>
                          {lane.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Address */}
              {visit.patient.address && (
                <div className="flex items-center gap-4">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(visit.patient.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    {visit.patient.address}
                  </a>
                </div>
              )}

              {/* External URLs */}
              {visit.patient.external_urls && visit.patient.external_urls.length > 0 && (
                <div className="flex items-start gap-4">
                  <ExternalLink className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="space-y-1">
                    {visit.patient.external_urls.map((urlEntry, index) => (
                      <a
                        key={index}
                        href={urlEntry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {urlEntry.label || urlEntry.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="flex items-start gap-4">
                <FileText className="w-5 h-5 text-gray-400 mt-1" />
                <div className="flex-1">
                  {isEditing ? (
                    <textarea
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      placeholder="メモを入力..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  ) : (
                    <div className="text-gray-700 whitespace-pre-wrap">
                      {visit.notes || <span className="text-gray-400">メモなし</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'calendar' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-gray-400" />
                <span className="font-bold text-gray-900">{visit.patient.name}</span>
              </div>
              <PatientCalendar patientId={visit.patient_id} />
            </div>
          ) : (
            <HistoryPanel
              itemType="Visit"
              itemId={visit.id}
              fieldLabels={VISIT_FIELD_LABELS}
              className="border-0"
            />
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl space-y-2">
          {isEditing ? (
            /* 編集モードのボタン */
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1 flex justify-center items-center"
                onClick={handleCancelEditing}
                disabled={updating}
                title="キャンセル"
              >
                <X className="w-5 h-5" />
              </Button>
              <Button
                variant="primary"
                className="flex-1 flex justify-center items-center"
                onClick={handleSaveEditing}
                disabled={updating}
                title="保存"
              >
                <Save className="w-5 h-5" />
              </Button>
            </div>
          ) : isReassigning ? (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1 flex justify-center items-center"
                onClick={() => setIsReassigning(false)}
                disabled={updating}
                title="キャンセル"
              >
                <X className="w-5 h-5" />
              </Button>
              <Button
                variant="primary"
                className="flex-1 flex justify-center items-center"
                onClick={handleReassignSave}
                disabled={updating}
                title="保存"
              >
                <Save className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <>
              {onUpdate && canEdit && (
                <Button
                  variant="primary"
                  className="w-full flex justify-center items-center"
                  onClick={handleStartEditing}
                  title="編集"
                >
                  <Edit className="w-5 h-5" />
                </Button>
              )}

              <div className="flex gap-2">
                {(onUpdate || onReassign) && canReassign && (
                  <Button
                    variant="secondary"
                    className="flex-1 flex justify-center items-center"
                    onClick={() => setIsReassigning(true)}
                    title="再割当"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </Button>
                )}
                {onComplete && canComplete && (
                  <Button
                    variant="secondary"
                    className="flex-1 border-green-300 text-green-700 hover:bg-green-50 flex justify-center items-center"
                    onClick={() => onComplete(visit.id)}
                    title="完了"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </Button>
                )}
                {onCancel && canCancel && (
                  <Button
                    variant="secondary"
                    className="flex-1 border-red-300 text-red-700 hover:bg-red-50 flex justify-center items-center"
                    onClick={() => onCancel(visit.id)}
                    title="キャンセル"
                  >
                    <XCircle className="w-5 h-5" />
                  </Button>
                )}
              </div>

              {onDelete && canDelete && (
                <div className="pt-2 border-t border-gray-200 mt-2">
                  <Button
                    variant="danger"
                    className="w-full text-sm flex justify-center items-center gap-2"
                    onClick={handleDelete}
                    disabled={deleting}
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                    削除
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
