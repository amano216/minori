import { useState, useEffect } from 'react';
import { XMarkIcon, TrashIcon, PencilIcon, UserIcon, ClockIcon, MapPinIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { 
  type ScheduleEvent, 
  type Staff, 
  type AbsenceReason,
  updateEvent,
  fetchStaffs,
} from '../../api/client';

interface AbsenceDetailPanelProps {
  event: ScheduleEvent;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: (eventId: number) => void;
}

const ABSENCE_REASON_LABELS: Record<AbsenceReason, string> = {
  compensatory_leave: '振休',
  paid_leave: '有給',
  half_day_leave: '半休',
  other: 'その他',
};

const ABSENCE_REASON_COLORS: Record<AbsenceReason, string> = {
  compensatory_leave: 'bg-orange-100 text-orange-800',
  paid_leave: 'bg-green-100 text-green-800',
  half_day_leave: 'bg-blue-100 text-blue-800',
  other: 'bg-gray-100 text-gray-800',
};

export function AbsenceDetailPanel({ event, onClose, onUpdate, onDelete }: AbsenceDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [absenceReason, setAbsenceReason] = useState<AbsenceReason>(event.absence_reason || 'paid_leave');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState(event.duration);
  const [notes, setNotes] = useState(event.notes || '');
  const [staffId, setStaffId] = useState<number | null>(event.participant_ids[0] || null);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Reset form when event changes
    setAbsenceReason(event.absence_reason || 'paid_leave');
    const eventDate = new Date(event.scheduled_at);
    setScheduledDate(eventDate.toISOString().split('T')[0]);
    setScheduledTime(eventDate.toTimeString().slice(0, 5));
    setDuration(event.duration);
    setNotes(event.notes || '');
    setStaffId(event.participant_ids[0] || null);
    setIsEditing(false);
    setDeleting(false);
  }, [event]);

  useEffect(() => {
    const loadStaffs = async () => {
      try {
        const data = await fetchStaffs({ status: 'active' });
        setStaffs(data);
      } catch (err) {
        console.error('Failed to load staffs:', err);
      }
    };
    loadStaffs();
  }, []);

  // 対象スタッフを取得
  const targetStaff = event.participants[0];
  const scheduledAt = new Date(event.scheduled_at);
  const endTime = new Date(scheduledAt.getTime() + event.duration * 60000);

  // 終日かどうかを判定
  const isAllDay = event.duration === 480 && scheduledAt.getHours() === 9 && scheduledAt.getMinutes() === 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      const newScheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
      const selectedStaff = staffs.find(s => s.id === staffId);
      const title = `${selectedStaff?.name || targetStaff?.name || ''} - ${ABSENCE_REASON_LABELS[absenceReason]}`;
      
      await updateEvent(event.id, {
        title,
        absence_reason: absenceReason,
        scheduled_at: newScheduledAt.toISOString(),
        duration,
        notes: notes || undefined,
        participant_ids: staffId ? [staffId] : [],
      });
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      console.error('Failed to update absence:', err);
      alert('更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('この不在予定を削除しますか？')) return;
    setDeleting(true);
    try {
      onDelete(event.id);
    } catch (err) {
      console.error('Failed to delete absence:', err);
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAbsenceReason(event.absence_reason || 'paid_leave');
    const eventDate = new Date(event.scheduled_at);
    setScheduledDate(eventDate.toISOString().split('T')[0]);
    setScheduledTime(eventDate.toTimeString().slice(0, 5));
    setDuration(event.duration);
    setNotes(event.notes || '');
    setStaffId(event.participant_ids[0] || null);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded ${
            event.absence_reason ? ABSENCE_REASON_COLORS[event.absence_reason] : 'bg-gray-100 text-gray-800'
          }`}>
            {event.absence_reason ? ABSENCE_REASON_LABELS[event.absence_reason] : '不在'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="編集"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg disabled:opacity-50"
            title="削除"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title */}
        <div>
          <h2 className="text-xl font-bold text-gray-900">不在予定</h2>
        </div>

        {/* Staff */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <UserIcon className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">対象スタッフ</span>
          </div>
          {isEditing ? (
            <select
              value={staffId || ''}
              onChange={(e) => setStaffId(e.target.value ? Number(e.target.value) : null)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">スタッフを選択...</option>
              {staffs.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold">
                {targetStaff?.name.slice(0, 1) || '?'}
              </div>
              <span className="text-gray-900">{targetStaff?.name || '未設定'}</span>
            </div>
          )}
        </div>

        {/* Absence Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">不在理由</label>
          {isEditing ? (
            <select
              value={absenceReason}
              onChange={(e) => setAbsenceReason(e.target.value as AbsenceReason)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              {Object.entries(ABSENCE_REASON_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          ) : (
            <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
              event.absence_reason ? ABSENCE_REASON_COLORS[event.absence_reason] : 'bg-gray-100 text-gray-800'
            }`}>
              {event.absence_reason ? ABSENCE_REASON_LABELS[event.absence_reason] : '不在'}
            </span>
          )}
        </div>

        {/* Date & Time */}
        <div>
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <CalendarIcon className="w-5 h-5" />
            <span className="text-sm font-medium text-gray-700">日時</span>
          </div>
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ) : (
            <div className="text-gray-900">
              <div>{scheduledAt.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}</div>
              {isAllDay ? (
                <div className="text-sm text-gray-500">終日</div>
              ) : (
                <div className="text-sm text-gray-500">
                  {scheduledAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  {' - '}
                  {endTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Duration */}
        {isEditing && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ClockIcon className="w-5 h-5 text-gray-600" />
              <label className="text-sm font-medium text-gray-700">時間</label>
            </div>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value={240}>4時間（午前/午後）</option>
              <option value={480}>8時間（終日）</option>
            </select>
          </div>
        )}

        {/* Planning Lane */}
        {event.planning_lane && (
          <div className="flex items-center gap-2 text-gray-600">
            <MapPinIcon className="w-5 h-5" />
            <span>{event.planning_lane.name}</span>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
          {isEditing ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {event.notes || 'メモなし'}
            </p>
          )}
        </div>
      </div>

      {/* Footer - Edit mode buttons */}
      {isEditing && (
        <div className="border-t border-gray-200 px-4 py-3 flex gap-2">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !staffId}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      )}
    </div>
  );
}
