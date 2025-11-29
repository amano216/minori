import { useState, useEffect } from 'react';
import { XMarkIcon, TrashIcon, PencilIcon, UserGroupIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { 
  type ScheduleEvent, 
  type Staff, 
  type EventType,
  updateEvent,
  fetchStaffs,
} from '../../api/client';

interface EventDetailPanelProps {
  event: ScheduleEvent;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: (eventId: number) => void;
}

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  meeting: 'ミーティング',
  facility: '施設訪問',
  training: '研修',
  other: 'その他',
};

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  meeting: 'bg-purple-100 text-purple-800',
  facility: 'bg-blue-100 text-blue-800',
  training: 'bg-green-100 text-green-800',
  other: 'bg-gray-100 text-gray-800',
};

export function EventDetailPanel({ event, onClose, onUpdate, onDelete }: EventDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [eventType, setEventType] = useState<EventType>(event.event_type);
  const [duration, setDuration] = useState(event.duration);
  const [notes, setNotes] = useState(event.notes || '');
  const [participantIds, setParticipantIds] = useState<number[]>(event.participant_ids);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Reset form when event changes
    setTitle(event.title);
    setEventType(event.event_type);
    setDuration(event.duration);
    setNotes(event.notes || '');
    setParticipantIds(event.participant_ids);
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

  const scheduledAt = new Date(event.scheduled_at);
  const endTime = new Date(scheduledAt.getTime() + event.duration * 60000);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateEvent(event.id, {
        title,
        event_type: eventType,
        duration,
        notes: notes || undefined,
        participant_ids: participantIds,
      });
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      console.error('Failed to update event:', err);
      alert('更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('このイベントを削除しますか？')) return;
    setDeleting(true);
    try {
      onDelete(event.id);
    } catch (err) {
      console.error('Failed to delete event:', err);
      setDeleting(false);
    }
  };

  const toggleParticipant = (staffId: number) => {
    if (participantIds.includes(staffId)) {
      setParticipantIds(participantIds.filter(id => id !== staffId));
    } else {
      setParticipantIds([...participantIds, staffId]);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded ${EVENT_TYPE_COLORS[event.event_type]}`}>
            {EVENT_TYPE_LABELS[event.event_type]}
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
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xl font-bold border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <h2 className="text-xl font-bold text-gray-900">{event.title}</h2>
          )}
        </div>

        {/* Event Type */}
        {isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">種類</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Time */}
        <div className="flex items-center gap-2 text-gray-600">
          <ClockIcon className="w-5 h-5" />
          <span>
            {scheduledAt.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
            {' '}
            {scheduledAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
            {' - '}
            {endTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Duration */}
        {isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">所要時間（分）</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={15}
              step={15}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Planning Lane */}
        {event.planning_lane && (
          <div className="flex items-center gap-2 text-gray-600">
            <MapPinIcon className="w-5 h-5" />
            <span>{event.planning_lane.name}</span>
          </div>
        )}

        {/* Participants */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <UserGroupIcon className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">参加者</span>
          </div>
          {isEditing ? (
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {staffs.map((staff) => (
                <label key={staff.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={participantIds.includes(staff.id)}
                    onChange={() => toggleParticipant(staff.id)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm">{staff.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {event.participants.length > 0 ? (
                event.participants.map((p) => (
                  <span
                    key={p.id}
                    className="px-2 py-1 text-sm bg-indigo-50 text-indigo-700 rounded-full"
                  >
                    {p.name}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500">参加者なし</span>
              )}
            </div>
          )}
        </div>

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
            onClick={() => {
              setIsEditing(false);
              setTitle(event.title);
              setEventType(event.event_type);
              setDuration(event.duration);
              setNotes(event.notes || '');
              setParticipantIds(event.participant_ids);
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      )}
    </div>
  );
}
