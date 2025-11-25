import { useState, useMemo, useEffect } from 'react';
import { ClockIcon, PlusIcon, TrashIcon, PencilIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { 
  fetchPlanningLanes, 
  createPlanningLane, 
  updatePlanningLane, 
  deletePlanningLane,
  type PlanningLane,
  type Visit
} from '../../api/client';

interface PatientCalendarViewProps {
  date: Date;
  visits: Visit[];
  onVisitClick: (visit: Visit) => void;
  onTimeSlotClick?: (hour: number, laneId: string) => void;
}

const START_HOUR = 0;
const END_HOUR = 24;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const VISIBLE_HOURS = 12; // 一度に表示する時間数

const LANE_COLORS = [
  'bg-blue-50',
  'bg-green-50',
  'bg-purple-50',
  'bg-orange-50',
  'bg-pink-50',
  'bg-cyan-50',
  'bg-yellow-50',
  'bg-indigo-50',
  'bg-red-50',
  'bg-teal-50',
];

interface Lane extends PlanningLane {
  color: string;
  label: string; // Alias for name
}

interface VisitCardProps {
  visit: Visit;
  onClick: () => void;
}

const VisitCard: React.FC<VisitCardProps> = ({ visit, onClick }) => {
  const visitDate = new Date(visit.scheduled_at);
  const durationMinutes = visit.duration || 60;
  const endDate = new Date(visitDate.getTime() + durationMinutes * 60000);

  const bgColor = visit.staff_id
    ? 'bg-blue-100 border-blue-400'
    : 'bg-yellow-100 border-yellow-400';

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`${bgColor} border-l-4 p-2 text-xs cursor-pointer hover:shadow-md transition-shadow rounded mb-1`}
    >
      <div className="font-medium">{visit.patient.name}</div>
      <div className="text-gray-600">
        {visitDate.getHours()}:{String(visitDate.getMinutes()).padStart(2, '0')}-
        {endDate.getHours()}:{String(endDate.getMinutes()).padStart(2, '0')}
      </div>
      {visit.staff && (
        <div className="text-gray-500 text-[10px]">担当: {visit.staff.name}</div>
      )}
    </div>
  );
};

interface LaneRowProps {
  lane: Lane;
  visits: Visit[];
  date: Date;
  onVisitClick: (visit: Visit) => void;
  onTimeSlotClick?: (hour: number, laneId: string) => void;
  onRemove: () => void;
  onRename: (newLabel: string) => void;
  visibleHours: number[];
}

const LaneRow: React.FC<LaneRowProps> = ({ 
  lane, 
  visits, 
  date, 
  onVisitClick, 
  onTimeSlotClick,
  onRemove,
  onRename,
  visibleHours
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(lane.name);

  const todaysVisits = useMemo(() => {
    return visits.filter(v => {
      const visitDate = new Date(v.scheduled_at);
      // Filter by date AND lane
      // If lane.id is not set (e.g. temp), don't show visits?
      // Actually, visits should have planning_lane_id
      return visitDate.toDateString() === date.toDateString() && v.planning_lane_id === lane.id;
    });
  }, [visits, date, lane.id]);

  const getVisitsForHour = (hour: number) => {
    return todaysVisits.filter(v => {
      const visitDate = new Date(v.scheduled_at);
      const startHour = visitDate.getHours();
      return startHour === hour;
    });
  };

  const handleLabelSave = () => {
    if (editLabel.trim()) {
      onRename(editLabel.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className={`flex border-b border-gray-200 ${lane.color}`}>
      {/* Lane Label */}
      <div className="w-48 flex-shrink-0 p-3 border-r border-gray-200 flex items-center justify-between gap-2">
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1">
            <input
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              className="w-full text-sm px-1 py-0.5 border rounded"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLabelSave();
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
            <button onClick={handleLabelSave} className="text-green-600 hover:text-green-800">
              <CheckIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <span 
            className="font-medium text-sm flex-1 text-indigo-700 cursor-pointer hover:underline"
            onClick={() => setIsEditing(true)}
            title="クリックして名称変更"
          >
            {lane.name}
          </span>
        )}
        
        <div className="flex items-center gap-1">
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-400 hover:text-indigo-600 rounded"
              title="名称変更"
            >
              <PencilIcon className="w-3 h-3" />
            </button>
          )}
          <button 
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-600 rounded"
            title="レーンを削除"
          >
            <TrashIcon className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="flex-1 flex">
        {visibleHours.map(hour => {
          const hourVisits = getVisitsForHour(hour);
          const hasConflict = hourVisits.length > 1;
          
          return (
            <div
              key={hour}
              className={`flex-1 min-w-[100px] border-r border-gray-100 p-2 cursor-pointer hover:bg-indigo-50/50 transition-colors relative ${hasConflict ? 'bg-red-50' : ''}`}
              style={{ minHeight: '80px' }}
              onClick={() => onTimeSlotClick?.(hour, String(lane.id))}
              title={`${String(hour).padStart(2, '0')}:00 - 予定を追加`}
            >
              {hasConflict && (
                <div className="absolute top-0 right-0 p-1 text-red-500" title="重複あり: 1レーン1時間帯1患者の原則に違反しています">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                </div>
              )}
              {hourVisits.map(visit => (
                <VisitCard
                  key={visit.id}
                  visit={visit}
                  onClick={() => onVisitClick(visit)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function PatientCalendarView({
  date,
  visits,
  onVisitClick,
  onTimeSlotClick,
}: PatientCalendarViewProps) {
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLanes = async () => {
    try {
      const data = await fetchPlanningLanes();
      const mappedLanes = data.map((l, index) => ({
        ...l,
        label: l.name,
        color: LANE_COLORS[index % LANE_COLORS.length]
      }));
      setLanes(mappedLanes);
    } catch (err) {
      console.error('Failed to load lanes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLanes();
  }, []);

  const [scrollOffset, setScrollOffset] = useState(8); // 初期表示は8:00から

  const addLane = async () => {
    try {
      const newLane = await createPlanningLane(`新規レーン ${lanes.length + 1}`, lanes.length);
      const mappedLane = {
        ...newLane,
        label: newLane.name,
        color: LANE_COLORS[lanes.length % LANE_COLORS.length]
      };
      setLanes([...lanes, mappedLane]);
    } catch (err: unknown) {
      console.error('Failed to create lane:', err);
      alert('レーンの作成に失敗しました');
    }
  };

  const removeLane = async (laneId: number) => {
    if (!confirm('このレーンを削除しますか？')) return;
    try {
      await deletePlanningLane(laneId);
      setLanes(lanes.filter(l => l.id !== laneId));
    } catch (err: unknown) {
      console.error('Failed to delete lane:', err);
      alert('レーンの削除に失敗しました');
    }
  };

  const renameLane = async (laneId: number, newLabel: string) => {
    try {
      const updated = await updatePlanningLane(laneId, newLabel);
      setLanes(lanes.map(l => l.id === laneId ? { ...l, name: updated.name, label: updated.name } : l));
    } catch (err: unknown) {
      console.error('Failed to rename lane:', err);
      alert('レーンの名称変更に失敗しました');
    }
  };

  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);
  const visibleHours = hours.slice(scrollOffset, scrollOffset + VISIBLE_HOURS);

  const todaysVisits = useMemo(() => {
    return visits.filter(v => {
      const visitDate = new Date(v.scheduled_at);
      return visitDate.toDateString() === date.toDateString();
    });
  }, [visits, date]);

  const unassignedCount = todaysVisits.filter(v => !v.staff_id).length;
  const assignedCount = todaysVisits.filter(v => v.staff_id).length;

  const scrollEarlier = () => {
    setScrollOffset(prev => Math.max(0, prev - 4));
  };

  const scrollLater = () => {
    setScrollOffset(prev => Math.min(TOTAL_HOURS - VISIBLE_HOURS, prev + 4));
  };

  const canScrollEarlier = scrollOffset > 0;
  const canScrollLater = scrollOffset < TOTAL_HOURS - VISIBLE_HOURS;

  if (loading) {
    return <div className="p-4 text-center">読み込み中...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold">患者カレンダー - 計画ボード</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                {date.toLocaleDateString('ja-JP')}
              </span>
            </div>
          </div>
          <button
            onClick={addLane}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            レーン追加
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>本日の訪問: {todaysVisits.length}件</span>
            <span className="text-red-600">未割当: {unassignedCount}件</span>
            <span className="text-blue-600">割当済: {assignedCount}件</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              表示: {visibleHours[0]}:00 - {visibleHours[visibleHours.length - 1]}:59
            </span>
            <button
              onClick={scrollEarlier}
              disabled={!canScrollEarlier}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
              title="前の時間帯"
            >
              ← 早い時間
            </button>
            <button
              onClick={scrollLater}
              disabled={!canScrollLater}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
              title="次の時間帯"
            >
              遅い時間 →
            </button>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          💡 タイムスロットをクリックして新規訪問を追加 / 訪問をクリックして詳細・スタッフ割当
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto">
        {/* Time Header */}
        <div className="flex sticky top-0 bg-white z-10 border-b-2 border-gray-300">
          <div className="w-48 flex-shrink-0 p-3 border-r border-gray-200 bg-gray-100 font-semibold text-sm">
            計画レーン
          </div>
          <div className="flex-1 flex">
            {visibleHours.map(hour => (
              <div
                key={hour}
                className="flex-1 min-w-[100px] p-2 text-center border-r border-gray-200 bg-gray-100 text-xs font-medium"
              >
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>
        </div>

        {/* Lane Rows */}
        {lanes.map(lane => (
          <LaneRow
            key={lane.id}
            lane={lane}
            visits={todaysVisits}
            date={date}
            onVisitClick={onVisitClick}
            onTimeSlotClick={onTimeSlotClick}
            onRemove={() => removeLane(lane.id)}
            onRename={(newLabel) => renameLane(lane.id, newLabel)}
            visibleHours={visibleHours}
          />
        ))}
      </div>
    </div>
  );
}
