import { useState, useEffect } from 'react';
import { X, Clock, User, FileText, MapPin, Calendar } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { fetchVisits, type Staff, type Visit } from '../../api/client';

interface VisitDetailPanelProps {
  visit: Visit | null;
  staffs?: Staff[];
  onClose: () => void;
  onEdit?: (visitId: number) => void;
  onCancel?: (visitId: number) => void;
  onComplete?: (visitId: number) => void;
  onReassign?: (visitId: number) => void;
  onUpdate?: (visitId: number, data: { staff_id: number | null; scheduled_at?: string; status?: string }) => Promise<void>;
  onDelete?: (visitId: number) => Promise<void>;
}

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
  onClose,
  onEdit,
  onCancel,
  onComplete,
  onReassign,
  onUpdate,
  onDelete,
}: VisitDetailPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'calendar'>('details');
  const [isReassigning, setIsReassigning] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<number | ''>('');
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (visit) {
      setTimeout(() => setIsVisible(true), 10);
      setActiveTab('details'); // Reset tab when visit changes
      setIsReassigning(false);
      setSelectedStaffId(visit.staff_id || '');
    } else {
      setIsVisible(false);
    }
  }, [visit]);

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

  const handleDelete = async () => {
    if (!visit || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(visit.id);
      // Panel will be closed by parent
    } catch (error) {
      console.error('Failed to delete:', error);
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
      {/* Backdrop - Removed for better UX on iPad/Desktop as requested? No, keep it for modal feel but maybe lighter? Or remove as per "New Visit Panel" request? 
          User said "New Visit Panel" background was black. Let's keep this one standard for now or make it lighter.
          Actually, user complained about "New Visit Panel" background. Let's remove backdrop here too for consistency if it's a side panel.
      */}
      {/* <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isVisible ? 'bg-opacity-20' : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      /> */}

      {/* Panel */}
      <div
        className={`fixed top-16 right-4 bottom-4 w-96 bg-white shadow-2xl border border-gray-200 rounded-xl z-40 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isVisible ? 'translate-x-0' : 'translate-x-[120%]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {activeTab === 'details' ? '訪問詳細' : '患者スケジュール'}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'details' ? 'calendar' : 'details')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-indigo-600"
              title={activeTab === 'details' ? 'カレンダーを表示' : '詳細を表示'}
            >
              {activeTab === 'details' ? <Calendar className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
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
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'details' ? (
            <div className="space-y-4">
              {/* Status */}
              <div>
                <Badge className={STATUS_COLORS[visit.status]}>
                  {STATUS_LABELS[visit.status]}
                </Badge>
              </div>

              {/* Patient */}
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">患者</div>
                  <div className="font-medium text-gray-900">{visit.patient.name}</div>
                </div>
              </div>

              {/* Staff */}
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">担当スタッフ</div>
                  {isReassigning ? (
                    <div className="mt-1">
                      <select
                        value={selectedStaffId}
                        onChange={(e) => setSelectedStaffId(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">未割当</option>
                        {staffs.map((staff) => (
                          <option key={staff.id} value={staff.id}>
                            {staff.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="font-medium text-gray-900">
                      {visit.staff?.name || '未割当'}
                    </div>
                  )}
                </div>
              </div>

              {/* Scheduled Time */}
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">予定日時</div>
                  <div className="font-medium text-gray-900">
                    {formatDateTime(visit.scheduled_at)}
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">所要時間</div>
                  <div className="font-medium text-gray-900">
                    {formatDuration(visit.duration)}
                  </div>
                </div>
              </div>



              {/* Address */}
              {visit.patient.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">訪問先</div>
                    <div className="font-medium text-gray-900">{visit.patient.address}</div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {visit.notes && (
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">メモ</div>
                    <div className="text-gray-700 whitespace-pre-wrap">{visit.notes}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-gray-400" />
                <span className="font-bold text-gray-900">{visit.patient.name}</span>
                <span className="text-sm text-gray-500">様のスケジュール</span>
              </div>
              <PatientCalendar patientId={visit.patient_id} />
              <div className="mt-4 text-sm text-gray-600">
                <p>※ カレンダーの日付をクリックすると、その日の詳細を確認できます（実装予定）</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl space-y-2">
          {isReassigning ? (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setIsReassigning(false)}
                disabled={updating}
              >
                キャンセル
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleReassignSave}
                disabled={updating}
              >
                {updating ? '保存中...' : '保存'}
              </Button>
            </div>
          ) : (
            <>
              {onEdit && canEdit && (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => onEdit(visit.id)}
                >
                  編集
                </Button>
              )}

              <div className="flex gap-2">
                {(onUpdate || onReassign) && canReassign && (
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setIsReassigning(true)}
                  >
                    再割当
                  </Button>
                )}
                {onComplete && canComplete && (
                  <Button
                    variant="secondary"
                    className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
                    onClick={() => onComplete(visit.id)}
                  >
                    完了
                  </Button>
                )}
                {onCancel && canCancel && (
                  <Button
                    variant="secondary"
                    className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => onCancel(visit.id)}
                  >
                    キャンセル
                  </Button>
                )}
              </div>

              {onDelete && canDelete && (
                <div className="pt-2 border-t border-gray-200 mt-2">
                  <Button
                    variant="secondary"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 text-xs"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? '削除中...' : 'この予定を削除'}
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
