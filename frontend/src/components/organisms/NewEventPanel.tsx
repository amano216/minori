import { useState, useEffect } from 'react';
import { XMarkIcon, UserGroupIcon, ClockIcon } from '@heroicons/react/24/outline';
import { 
  type Staff, 
  type EventType,
  type PlanningLane,
  createEvent,
  fetchStaffs,
  fetchPlanningLanes,
} from '../../api/client';

interface NewEventPanelProps {
  initialDate: Date;
  planningLaneId?: number;
  onClose: () => void;
  onCreate: () => void;
}

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  meeting: 'ミーティング',
  facility: '施設訪問',
  training: '研修',
  other: 'その他',
};

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  meeting: 'border-purple-400 bg-purple-50',
  facility: 'border-blue-400 bg-blue-50',
  training: 'border-green-400 bg-green-50',
  other: 'border-gray-400 bg-gray-50',
};

export function NewEventPanel({ initialDate, planningLaneId, onClose, onCreate }: NewEventPanelProps) {
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('meeting');
  const [date, setDate] = useState(formatDateForInput(initialDate));
  const [time, setTime] = useState(formatTimeForInput(initialDate));
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [selectedPlanningLaneId, setSelectedPlanningLaneId] = useState<number | undefined>(planningLaneId);
  const [participantIds, setParticipantIds] = useState<number[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [planningLanes, setPlanningLanes] = useState<PlanningLane[]>([]);
  const [saving, setSaving] = useState(false);

  function formatDateForInput(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  function formatTimeForInput(d: Date): string {
    return d.toTimeString().slice(0, 5);
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [staffData, laneData] = await Promise.all([
          fetchStaffs({ status: 'active' }),
          fetchPlanningLanes(),
        ]);
        setStaffs(staffData);
        setPlanningLanes(laneData);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setSaving(true);
    try {
      const scheduledAt = new Date(`${date}T${time}`);
      await createEvent({
        title,
        event_type: eventType,
        scheduled_at: scheduledAt.toISOString(),
        duration,
        notes: notes || undefined,
        planning_lane_id: selectedPlanningLaneId,
        participant_ids: participantIds,
      });
      onCreate();
      onClose();
    } catch (err) {
      console.error('Failed to create event:', err);
      alert('イベントの作成に失敗しました');
    } finally {
      setSaving(false);
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
        <h2 className="text-lg font-semibold text-gray-900">新規イベント</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="イベント名を入力"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              autoFocus
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">種類</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setEventType(value as EventType)}
                  className={`px-3 py-2 text-sm rounded-lg border-2 transition-colors ${
                    eventType === value
                      ? EVENT_TYPE_COLORS[value as EventType]
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-start gap-2">
            <ClockIcon className="w-5 h-5 text-gray-400 mt-2" />
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mr-2">所要時間</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={15}>15分</option>
                  <option value={30}>30分</option>
                  <option value={45}>45分</option>
                  <option value={60}>1時間</option>
                  <option value={90}>1時間30分</option>
                  <option value={120}>2時間</option>
                  <option value={180}>3時間</option>
                  <option value={240}>4時間</option>
                </select>
              </div>
            </div>
          </div>

          {/* Planning Lane */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">レーン（任意）</label>
            <select
              value={selectedPlanningLaneId || ''}
              onChange={(e) => setSelectedPlanningLaneId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">レーンを選択しない</option>
              {planningLanes.map((lane) => (
                <option key={lane.id} value={lane.id}>{lane.name}</option>
              ))}
            </select>
          </div>

          {/* Participants */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <UserGroupIcon className="w-5 h-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">参加者</label>
            </div>
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
              {staffs.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-2">スタッフがいません</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="備考・詳細など"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-4 py-3 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={saving || !title}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? '作成中...' : '作成'}
          </button>
        </div>
      </form>
    </div>
  );
}
