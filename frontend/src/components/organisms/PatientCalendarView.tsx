// Updated: 2025-11-26 03:30 - Force sync
import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon, 
  CheckIcon, 
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { 
  fetchPlanningLanes, 
  createPlanningLane, 
  updatePlanningLane, 
  deletePlanningLane,
  fetchVisitPatterns,
  type PlanningLane,
  type Visit,
  type Group,
  type VisitPattern,
  type ScheduleEvent,
} from '../../api/client';
import { EventCard } from '../molecules/EventCard';

// Extend Visit type for pattern mode to carry original pattern data
export interface PatternVisit extends Visit {
  __isPattern?: boolean;
  __pattern?: VisitPattern;
}
import { SearchableSelect } from '../molecules/SearchableSelect';
import { VisitCard, DraggableVisitCard } from '../molecules/VisitCard';
import { 
  DragOverlay, 
  useDroppable,
  useDndContext,
} from '@dnd-kit/core';

interface PatientCalendarViewProps {
  date: Date;
  visits: Visit[];
  events?: ScheduleEvent[];
  groups: Group[];
  selectedGroupIds: number[];
  onVisitClick: (visit: Visit) => void;
  onEventClick?: (event: ScheduleEvent) => void;
  onTimeSlotClick?: (hour: number, laneId: string) => void;
  onPatternClick?: (pattern: VisitPattern) => void;
  dataMode?: 'actual' | 'pattern';
  selectedDayOfWeek?: number;
  patternVersion?: number; // Increment to trigger pattern reload
}

const START_HOUR = 0;
const END_HOUR = 24;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const DEFAULT_START_HOUR = 9; // デフォルト開始時間 (9:00 AM)

// ズームレベル設定
const ZOOM_LEVELS = {
  '8h': { hours: 8, label: '8h' },
  '24h': { hours: 24, label: '24h' },
} as const;
type ZoomLevel = keyof typeof ZOOM_LEVELS;

// Group-based color mapping for consistent visual hierarchy
const GROUP_COLORS: Record<number, string> = {};
const COLOR_PALETTE = [
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

const getGroupColor = (groupId: number | null | undefined, groups: Group[]): string => {
  if (!groupId) return 'bg-gray-50';
  
  // Return cached color if exists
  if (GROUP_COLORS[groupId]) return GROUP_COLORS[groupId];
  
  // Assign color based on group position
  const groupIndex = groups.findIndex(g => g.id === groupId);
  const color = groupIndex >= 0 ? COLOR_PALETTE[groupIndex % COLOR_PALETTE.length] : 'bg-gray-50';
  GROUP_COLORS[groupId] = color;
  return color;
};

interface Lane extends PlanningLane {
  color: string;
  label: string; // Alias for name
}


const DroppableTimeSlot = ({ 
  hour, 
  laneId, 
  children, 
  onClick, 
  hasConflict 
}: { 
  hour: number, 
  laneId: number, 
  children: React.ReactNode, 
  onClick: () => void, 
  hasConflict: boolean 
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${laneId}-${hour}`,
    data: { hour, laneId },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[80px] border-r border-gray-100 p-1 cursor-pointer transition-colors relative group 
        ${hasConflict ? 'bg-red-50' : ''} 
        ${isOver ? 'bg-indigo-100 ring-2 ring-inset ring-indigo-400' : 'hover:bg-indigo-50/50'}`}
      style={{ minHeight: '70px' }}
      onClick={onClick}
      title={`${String(hour).padStart(2, '0')}:00 - 予定を追加`}
    >
      {children}
    </div>
  );
};


interface CreateLaneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, groupId: number | null) => Promise<void>;
  groups: Group[];
}

const CreateLaneModal: React.FC<CreateLaneModalProps> = ({ isOpen, onClose, onSubmit, groups = [] }) => {
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const labeledGroups = useMemo(() => {
    if (!groups?.length) return [];
    const map = new Map<number, Group>();
    groups.forEach(group => map.set(group.id, group));

    const buildLabel = (group: Group) => {
      const chain: string[] = [];
      let current: Group | undefined = group;
      const seen = new Set<number>();

      while (current) {
        chain.unshift(current.name);
        if (!current.parent_id) break;
        if (seen.has(current.parent_id)) break; // guard against cycles
        seen.add(current.parent_id);
        current = map.get(current.parent_id);
      }

      return chain.join(' > ');
    };

    // Filter to show only teams (child groups with parent_id)
    return groups
      .filter(group => group.parent_id !== null)
      .map(group => ({ ...group, displayName: buildLabel(group) }));
  }, [groups]);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setGroupId('');
      console.log('CreateLaneModal opened. Groups:', groups);
    }
  }, [isOpen, groups]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !groupId) return;
    
    console.log('Submitting lane:', { name, groupId }); // Debug log

    setSubmitting(true);
    try {
      await onSubmit(name, groupId ? Number(groupId) : null);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Mobile Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-[9999] sm:hidden transition-opacity"
        onClick={onClose}
      />
      <div className={`
        fixed z-[10000]
        /* モバイル: 下からスライドアップ */
        inset-x-0 bottom-0 max-h-[85vh]
        /* PC: 右サイドパネル */
        sm:inset-y-0 sm:inset-x-auto sm:right-0 sm:bottom-auto sm:max-h-none
        w-full sm:w-96
        bg-white shadow-2xl
        sm:border-l sm:border-gray-200
        rounded-t-2xl sm:rounded-none
        flex flex-col
      `}>
        {/* Mobile Drag Handle */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold">新規レーン作成</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors -mr-2"
            type="button"
          >
            <span className="text-gray-500 text-xl">✕</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">レーン名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="例: 訪問ルートA"
              required
              autoFocus
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">担当チーム <span className="text-red-500">*</span></label>
            <SearchableSelect
              value={groupId}
              onChange={(value) => {
                console.log('Group selected:', value);
                setGroupId(value === '' ? '' : Number(value));
              }}
              options={labeledGroups.map(g => ({ value: g.id, label: g.displayName }))}
              placeholder="チームを選択"
              searchPlaceholder="チーム名で検索..."
            />
          </div>
        </form>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={submitting}
          >
            キャンセル
          </button>
          <button
            type="submit"
            form="create-lane-form"
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            disabled={submitting}
          >
            作成
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};

interface EditLanePanelProps {
  lane: Lane | null;
  onClose: () => void;
  onSave: (laneId: number, newName: string, newGroupId: number | null) => Promise<void>;
  groups: Group[];
}

const EditLanePanel: React.FC<EditLanePanelProps> = ({ lane, onClose, onSave, groups = [] }) => {
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);

  const labeledGroups = useMemo(() => {
    if (!groups?.length) return [];
    const map = new Map<number, Group>();
    groups.forEach(group => map.set(group.id, group));

    const buildLabel = (group: Group) => {
      const chain: string[] = [];
      let current: Group | undefined = group;
      const seen = new Set<number>();

      while (current) {
        chain.unshift(current.name);
        if (!current.parent_id) break;
        if (seen.has(current.parent_id)) break;
        seen.add(current.parent_id);
        current = map.get(current.parent_id);
      }

      return chain.join(' > ');
    };

    // Filter to show only teams (child groups with parent_id)
    return groups
      .filter(group => group.parent_id !== null)
      .map(group => ({ ...group, displayName: buildLabel(group) }));
  }, [groups]);

  useEffect(() => {
    if (lane) {
      setName(lane.name);
      setGroupId(lane.group_id || '');
    }
  }, [lane]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lane || !name.trim() || !groupId) return;

    setSaving(true);
    try {
      await onSave(lane.id, name, groupId ? Number(groupId) : null);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!lane) return null;

  return createPortal(
    <>
      {/* Mobile Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-[9999] sm:hidden transition-opacity"
        onClick={onClose}
      />
      <div className={`
        fixed z-[10000]
        /* モバイル: 下からスライドアップ */
        inset-x-0 bottom-0 max-h-[85vh]
        /* PC: 右サイドパネル */
        sm:inset-y-0 sm:inset-x-auto sm:right-0 sm:bottom-auto sm:max-h-none
        w-full sm:w-96
        bg-white shadow-2xl
        sm:border-l sm:border-gray-200
        rounded-t-2xl sm:rounded-none
        flex flex-col
      `}>
        {/* Mobile Drag Handle */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold">レーン編集</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors -mr-2"
            type="button"
          >
            <span className="text-gray-500 text-xl">✕</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">レーン名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="例: 訪問ルートA"
              required
              autoFocus
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">担当チーム <span className="text-red-500">*</span></label>
            <SearchableSelect
              value={groupId}
              onChange={(value) => setGroupId(value === '' ? '' : Number(value))}
              options={labeledGroups.map(g => ({ value: g.id, label: g.displayName }))}
              placeholder="チームを選択"
              searchPlaceholder="チーム名で検索..."
            />
          </div>
        </form>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={saving}
          >
            キャンセル
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            disabled={saving}
          >
            保存
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};

interface LaneRowProps {
  lane: Lane;
  visits: Visit[];
  events?: ScheduleEvent[];
  date: Date;
  onVisitClick: (visit: Visit) => void;
  onEventClick?: (event: ScheduleEvent) => void;
  onTimeSlotClick?: (hour: number, laneId: string) => void;
  onRemove: () => void;
  onRename: (newLabel: string) => void;
  onEdit: () => void;
  visibleHours: number[];
  dataMode?: 'actual' | 'pattern';
}

// カードの位置とサイズを計算する関数
const calculateCardPosition = (
  visit: Visit,
  visibleHours: number[]
): { leftPercent: number; widthPercent: number; isVisible: boolean } => {
  const visitDate = new Date(visit.scheduled_at);
  const startHour = visitDate.getHours();
  const startMinute = visitDate.getMinutes();
  const durationMinutes = visit.duration || 60;
  
  const visibleStartHour = visibleHours[0];
  const visibleEndHour = visibleHours[visibleHours.length - 1] + 1; // 次の時間の開始まで
  const totalVisibleHours = visibleEndHour - visibleStartHour;
  
  // 開始位置を時間（小数）で計算
  const startTimeInHours = startHour + startMinute / 60;
  const endTimeInHours = startTimeInHours + durationMinutes / 60;
  
  // 表示範囲外のカードは非表示
  if (endTimeInHours <= visibleStartHour || startTimeInHours >= visibleEndHour) {
    return { leftPercent: 0, widthPercent: 0, isVisible: false };
  }
  
  // 表示範囲内にクリップ
  const clippedStart = Math.max(startTimeInHours, visibleStartHour);
  const clippedEnd = Math.min(endTimeInHours, visibleEndHour);
  
  // パーセント計算
  const leftPercent = ((clippedStart - visibleStartHour) / totalVisibleHours) * 100;
  const widthPercent = ((clippedEnd - clippedStart) / totalVisibleHours) * 100;
  
  return { leftPercent, widthPercent, isVisible: true };
};

const LaneRow: React.FC<LaneRowProps> = ({ 
  lane, 
  visits,
  events = [],
  date, 
  onVisitClick,
  onEventClick,
  onTimeSlotClick,
  onRemove,
  onRename,
  onEdit,
  visibleHours,
  dataMode = 'actual'
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

  const todaysEvents = useMemo(() => {
    return events.filter(e => {
      const eventDate = new Date(e.scheduled_at);
      return eventDate.toDateString() === date.toDateString() && e.planning_lane_id === lane.id;
    });
  }, [events, date, lane.id]);

  const getVisitsForHour = (hour: number) => {
    return todaysVisits.filter(v => {
      const visitDate = new Date(v.scheduled_at);
      const startHour = visitDate.getHours();
      return startHour === hour;
    });
  };

  const getEventsForHour = (hour: number) => {
    return todaysEvents.filter(e => {
      const eventDate = new Date(e.scheduled_at);
      const startHour = eventDate.getHours();
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
    <div className={`flex border-b border-gray-200 min-w-[600px] sm:min-w-0 ${lane.color}`}>
      {/* Lane Label - Mobile Responsive */}
      <div className="w-28 sm:w-40 flex-shrink-0 px-2 py-2 sm:px-3 sm:py-3 border-r border-gray-200 flex items-center gap-1 sm:gap-2 bg-white/60">
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <input
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              className="w-full text-xs sm:text-sm px-1 py-0.5 border rounded"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLabelSave();
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
            <button onClick={handleLabelSave} className="text-green-600 hover:text-green-800 flex-shrink-0">
              <CheckIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <span 
              className="font-semibold text-xs sm:text-sm text-gray-800 cursor-pointer hover:text-indigo-600 truncate flex-1 min-w-0"
              onClick={() => setIsEditing(true)}
              title={lane.name}
            >
              {lane.name}
            </span>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button 
                onClick={onEdit}
                className="p-0.5 text-gray-400 hover:text-blue-600 rounded"
                title="編集"
              >
                <PencilIcon className="w-3 h-3" />
              </button>
              <button 
                onClick={onRemove}
                className="p-0.5 text-gray-400 hover:text-red-600 rounded"
                title="レーンを削除"
              >
                <TrashIcon className="w-3 h-3" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Timeline Grid - Mobile Responsive */}
      <div className="flex-1 flex relative">
        {/* ドロップゾーン（グリッド） */}
        {visibleHours.map(hour => {
          const hourVisits = getVisitsForHour(hour);
          const hourEvents = getEventsForHour(hour);
          const hasConflict = hourVisits.length > 1 || (hourVisits.length + hourEvents.length) > 1;
          
          return (
            <DroppableTimeSlot
              key={hour}
              hour={hour}
              laneId={lane.id}
              hasConflict={hasConflict}
              onClick={() => {
                console.log('Time slot clicked:', hour, lane.id);
                onTimeSlotClick?.(hour, String(lane.id));
              }}
            >
              {/* Hover Plus Icon */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                <PlusIcon className="w-5 h-5 text-indigo-300" />
              </div>

              {hasConflict && (
                <div className="absolute top-0 right-0 p-0.5 text-red-500" title="重複あり">
                  <ExclamationTriangleIcon className="w-3 h-3" />
                </div>
              )}
            </DroppableTimeSlot>
          );
        })}
        
        {/* カードオーバーレイ（絶対位置） */}
        <div className="absolute inset-0 pointer-events-none">
          {(() => {
            // 重複カードをグループ化して縦に並べる
            const cardPositions: { visit: Visit; leftPercent: number; widthPercent: number; verticalIndex: number }[] = [];
            const sortedVisits = [...todaysVisits].sort((a, b) => 
              new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
            );
            
            sortedVisits.forEach(visit => {
              const pos = calculateCardPosition(visit, visibleHours);
              if (!pos.isVisible) return;
              
              // 重複をチェックして縦位置を決定
              let verticalIndex = 0;
              const visitStart = new Date(visit.scheduled_at).getTime();
              const visitEnd = visitStart + (visit.duration || 60) * 60000;
              
              cardPositions.forEach(existing => {
                const existingVisit = existing.visit;
                const existingStart = new Date(existingVisit.scheduled_at).getTime();
                const existingEnd = existingStart + (existingVisit.duration || 60) * 60000;
                
                // 時間が重複している場合
                if (visitStart < existingEnd && visitEnd > existingStart) {
                  if (existing.verticalIndex >= verticalIndex) {
                    verticalIndex = existing.verticalIndex + 1;
                  }
                }
              });
              
              cardPositions.push({ visit, ...pos, verticalIndex });
            });
            
            return cardPositions.map(({ visit, leftPercent, widthPercent, verticalIndex }) => (
              <div
                key={visit.id}
                className="absolute pointer-events-auto"
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  top: `${4 + verticalIndex * 72}px`, // 4px padding + カード高さ約68px
                  minWidth: '60px', // 最小幅を確保
                }}
              >
                <DraggableVisitCard
                  visit={visit}
                  onClick={() => onVisitClick(visit)}
                  disabled={dataMode === 'pattern'}
                  patternFrequency={(visit as PatternVisit).__pattern?.frequency}
                />
              </div>
            ));
          })()}
          
          {/* イベントカード（元の時間スロットベースで配置） */}
          {todaysEvents.map(event => {
            const eventDate = new Date(event.scheduled_at);
            const startHour = eventDate.getHours();
            const startMinute = eventDate.getMinutes();
            const durationMinutes = event.duration || 60;
            
            const visibleStartHour = visibleHours[0];
            const visibleEndHour = visibleHours[visibleHours.length - 1] + 1;
            const totalVisibleHours = visibleEndHour - visibleStartHour;
            
            const startTimeInHours = startHour + startMinute / 60;
            const endTimeInHours = startTimeInHours + durationMinutes / 60;
            
            if (endTimeInHours <= visibleStartHour || startTimeInHours >= visibleEndHour) {
              return null;
            }
            
            const clippedStart = Math.max(startTimeInHours, visibleStartHour);
            const clippedEnd = Math.min(endTimeInHours, visibleEndHour);
            const leftPercent = ((clippedStart - visibleStartHour) / totalVisibleHours) * 100;
            const widthPercent = ((clippedEnd - clippedStart) / totalVisibleHours) * 100;
            
            return (
              <div
                key={`event-${event.id}`}
                className="absolute pointer-events-auto"
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  bottom: '4px',
                  minWidth: '60px',
                }}
              >
                <EventCard
                  event={event}
                  onClick={() => onEventClick?.(event)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default function PatientCalendarView({
  date,
  visits,
  events = [],
  groups,
  selectedGroupIds,
  onVisitClick,
  onEventClick,
  onTimeSlotClick,
  onPatternClick,
  dataMode = 'actual',
  selectedDayOfWeek = 1,
  patternVersion = 0,
}: PatientCalendarViewProps) {
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLane, setEditingLane] = useState<Lane | null>(null);
  const [patterns, setPatterns] = useState<VisitPattern[]>([]);

  // Get active drag item from parent DndContext
  const { active } = useDndContext();
  const activeDragVisit = active?.data.current?.visit as Visit | null;

  const loadLanes = async () => {
    try {
      const data = await fetchPlanningLanes();
      // Sort lanes by group_id for visual grouping
      const sortedData = [...data].sort((a, b) => {
        if (!a.group_id && !b.group_id) return 0;
        if (!a.group_id) return 1;
        if (!b.group_id) return -1;
        return a.group_id - b.group_id;
      });
      const mappedLanes = sortedData.map((l) => ({
        ...l,
        label: l.name,
        color: getGroupColor(l.group_id, groups)
      }));
      setLanes(mappedLanes);
    } catch (err) {
      console.error('Failed to load lanes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groups && groups.length > 0) {
      loadLanes();
    } else {
      // If no groups, still set loading to false to show the UI
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  // Load patterns when in pattern mode
  useEffect(() => {
    if (dataMode === 'pattern') {
      const loadPatterns = async () => {
        try {
          console.log('[PatternCalendarView] Loading patterns for day:', selectedDayOfWeek);
          const data = await fetchVisitPatterns({ day_of_week: selectedDayOfWeek });
          console.log('[PatternCalendarView] Loaded patterns:', data);
          setPatterns(data);
        } catch (err) {
          console.error('Failed to load patterns:', err);
        }
      };
      loadPatterns();
    }
  }, [dataMode, selectedDayOfWeek, patternVersion]);

  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('8h'); // デフォルト8時間表示
  const [scrollOffset, setScrollOffset] = useState(DEFAULT_START_HOUR); // 初期表示は9:00から

  const handleCreateLane = async (name: string, groupId: number | null) => {
    try {
      const newLane = await createPlanningLane(name, lanes.length, groupId);
      const mappedLane = {
        ...newLane,
        label: newLane.name,
        color: getGroupColor(newLane.group_id, groups)
      };
      setLanes([...lanes, mappedLane]);
      setIsCreateModalOpen(false);
    } catch (err: unknown) {
      console.error('Failed to create lane:', err);
      alert('レーンの作成に失敗しました');
      throw err;
    }
  };

  const removeLane = async (laneId: number) => {
    if (!confirm('このレーンを削除しますか？')) return;
    try {
      await deletePlanningLane(laneId);
      setLanes(lanes.filter(l => l.id !== laneId));
    } catch (err) {
      console.error('Failed to remove lane:', err);
      alert('レーンの削除に失敗しました');
    }
  };

  const handleEditLane = async (laneId: number, newName: string, newGroupId: number | null) => {
    try {
      await updatePlanningLane(laneId, newName, newGroupId);
      setLanes(lanes.map(l => 
        l.id === laneId 
          ? { ...l, name: newName, label: newName, group_id: newGroupId, color: getGroupColor(newGroupId, groups) } 
          : l
      ));
    } catch (err) {
      console.error('Failed to update lane:', err);
      alert('レーンの更新に失敗しました');
      throw err;
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

  // Filter lanes by selected groups (from parent)
  const filteredLanes = useMemo(() => {
    if (!selectedGroupIds || selectedGroupIds.length === 0) return lanes;
    return lanes.filter(lane => lane.group_id && selectedGroupIds.includes(lane.group_id));
  }, [lanes, selectedGroupIds]);

  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);
  const currentZoom = ZOOM_LEVELS[zoomLevel];
  const visibleHours = zoomLevel === '24h' 
    ? hours 
    : hours.slice(scrollOffset, scrollOffset + currentZoom.hours);

  // Convert patterns to Visit-like objects for rendering
  const patternsAsVisits = useMemo((): PatternVisit[] => {
    if (dataMode !== 'pattern') return [];
    console.log('[PatternCalendarView] Converting patterns to visits:', patterns.length, 'patterns');
    return patterns.map(p => {
      // Create a fake date for rendering using the current view date
      const [hours, minutes] = p.start_time.split(':').map(Number);
      const fakeDate = new Date(date);
      fakeDate.setHours(hours, minutes, 0, 0);
      
      console.log('[PatternCalendarView] Pattern', p.id, 'lane:', p.planning_lane_id, 'time:', p.start_time);
      
      return {
        id: p.id,
        patient_id: p.patient_id,
        patient: p.patient || { id: p.patient_id, name: '不明' },
        staff_id: p.default_staff_id,
        staff: p.staff || null,
        scheduled_at: fakeDate.toISOString(),
        duration: p.duration,
        status: 'scheduled' as const,
        notes: '',
        created_at: p.created_at,
        updated_at: p.updated_at,
        planning_lane_id: p.planning_lane_id,
        __isPattern: true,
        __pattern: p,
      };
    });
  }, [dataMode, patterns, date]);

  // Handle visit/pattern click
  const handleItemClick = (visit: Visit | PatternVisit) => {
    const patternVisit = visit as PatternVisit;
    if (patternVisit.__isPattern && patternVisit.__pattern && onPatternClick) {
      onPatternClick(patternVisit.__pattern);
    } else {
      onVisitClick(visit);
    }
  };

  const todaysVisits = useMemo(() => {
    if (dataMode === 'pattern') {
      console.log('[PatternCalendarView] todaysVisits (pattern mode):', patternsAsVisits.length);
      return patternsAsVisits;
    }
    return visits.filter(v => {
      const visitDate = new Date(v.scheduled_at);
      return visitDate.toDateString() === date.toDateString();
    });
  }, [dataMode, patternsAsVisits, visits, date]);

  const scrollEarlier = () => {
    setScrollOffset(prev => Math.max(0, prev - 4));
  };

  const scrollLater = () => {
    setScrollOffset(prev => Math.min(TOTAL_HOURS - currentZoom.hours, prev + 4));
  };

  // 24時間表示時はスクロール不要
  const canScrollEarlier = zoomLevel !== '24h' && scrollOffset > 0;
  const canScrollLater = zoomLevel !== '24h' && scrollOffset < TOTAL_HOURS - currentZoom.hours;

  if (loading) {
    return <div className="p-4 text-center">読み込み中...</div>;
  }

  return (
      <div className="h-full flex flex-col bg-white">
        {/* Header - Mobile Responsive */}
        <div className="p-2 sm:p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                console.log('Plus button clicked');
                setIsCreateModalOpen(true);
              }}
              className="p-1.5 sm:p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center"
              title="レーン追加"
            >
              <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* ズームレベル切り替えボタン */}
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              {(Object.keys(ZOOM_LEVELS) as ZoomLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    setZoomLevel(level);
                    // 24h→8hに戻す時、scrollOffsetをリセット
                    if (level === '8h' && scrollOffset > TOTAL_HOURS - ZOOM_LEVELS['8h'].hours) {
                      setScrollOffset(DEFAULT_START_HOUR);
                    }
                  }}
                  className={`px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium transition-colors min-w-[44px] sm:min-w-[52px]
                    ${zoomLevel === level 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  title={ZOOM_LEVELS[level].label}
                >
                  {ZOOM_LEVELS[level].label}
                </button>
              ))}
            </div>

            {/* 時間スクロールコントロール（8時間表示時のみ） */}
            {zoomLevel !== '24h' && (
              <>
                <button
                  onClick={scrollEarlier}
                  disabled={!canScrollEarlier}
                  className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-full transition-colors"
                  title="前の時間帯"
                >
                  <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                <button
                  onClick={scrollLater}
                  disabled={!canScrollLater}
                  className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-full transition-colors"
                  title="次の時間帯"
                >
                  <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Timeline - Mobile Responsive */}
        <div className="flex-1 overflow-y-auto overflow-x-auto">
          {/* Time Header */}
          <div className="flex sticky top-0 bg-white z-10 border-b-2 border-gray-300 min-w-[600px] sm:min-w-0">
            <div className="w-28 sm:w-40 flex-shrink-0 px-2 py-2 border-r border-gray-200 bg-gray-100 font-semibold text-xs text-gray-700 flex items-center gap-1">
              <span className="truncate">計画レーン</span>
              <span className="text-[10px] font-normal text-gray-500 bg-gray-200 px-1 py-0.5 rounded">
                {filteredLanes.length}
              </span>
            </div>
            <div className="flex-1 flex">
              {visibleHours.map(hour => (
                <div
                  key={hour}
                  className="flex-1 min-w-[80px] px-1 py-2 text-center border-r border-gray-200 bg-gray-100 text-[11px] font-medium text-gray-600"
                >
                  {String(hour).padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>

          {/* Lane Rows */}
          {filteredLanes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-gray-400 min-w-[600px] sm:min-w-0">
              <ExclamationTriangleIcon className="w-8 h-8 sm:w-12 sm:h-12 mb-2 opacity-50" />
              <p className="text-xs sm:text-sm">選択されたグループのレーンがありません</p>
              <p className="text-[10px] sm:text-xs mt-1">+ボタンで新規作成</p>
            </div>
          ) : (
            filteredLanes.map(lane => (
              <LaneRow
                key={lane.id}
                lane={lane}
                visits={todaysVisits}
                events={events}
                date={date}
                onVisitClick={handleItemClick}
                onEventClick={onEventClick}
                onTimeSlotClick={onTimeSlotClick}
                onRemove={() => removeLane(lane.id)}
                onRename={(newLabel) => renameLane(lane.id, newLabel)}
                onEdit={() => setEditingLane(lane)}
                visibleHours={visibleHours}
                dataMode={dataMode}
              />
            ))
          )}
        </div>

        <CreateLaneModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateLane}
          groups={groups}
        />

        <EditLanePanel
          lane={editingLane}
          onClose={() => setEditingLane(null)}
          onSave={handleEditLane}
          groups={groups}
        />

        <DragOverlay>
          {activeDragVisit ? (
            <VisitCard visit={activeDragVisit as Visit} onClick={() => {}} isOverlay />
          ) : null}
        </DragOverlay>
      </div>
  );
}
