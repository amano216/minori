// Force sync: 2025-11-26
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
  type PlanningLane,
  type Visit,
  type Group
} from '../../api/client';

interface PatientCalendarViewProps {
  date: Date;
  visits: Visit[];
  groups: Group[];
  onVisitClick: (visit: Visit) => void;
  onTimeSlotClick?: (hour: number, laneId: string) => void;
}

const START_HOUR = 0;
const END_HOUR = 24;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const VISIBLE_HOURS = 12; // 一度に表示する時間数

// TODO: Future improvement - Sync lane colors with Group colors to improve visibility
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

  // Build hierarchical labels for groups (e.g., "流山 > リハビリ")
  const labeledGroups = useMemo(() => {
    if (!groups?.length) return [];
    const map = new Map<number, Group>();
    groups.forEach(group => map.set(group.id, group));

    const buildLabel = (group: Group): string => {
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

    return groups.filter(group => group.parent_id).map(group => ({ ...group, displayName: buildLabel(group) }));
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
    if (!name.trim()) return;
    
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
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-[9999] transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      {/* Right Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-[10000] transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 p-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">新規レーン作成</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              type="button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">レーン名 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="例: 訪問ルートA"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">担当チーム <span className="text-red-500">*</span></label>
                <select
                  value={groupId}
                  onChange={(e) => {
                    setGroupId(e.target.value ? Number(e.target.value) : '');
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">選択してください</option>
                  {labeledGroups.map(g => (
                     <option key={g.id} value={g.id}>{g.displayName}</option>
                  ))}
                </select>
              </div>
              
              {/* Footer Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  disabled={submitting}
                >
                  {submitting ? '作成中...' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>,
    document.body
  );

};


interface EditLanePanelProps {
  lane: Lane | null;
  groups: Group[];
  onClose: () => void;
  onSubmit: (laneId: number, name: string, groupId: number | null) => Promise<void>;
}

const EditLanePanel: React.FC<EditLanePanelProps> = ({ lane, groups, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  
  const labeledGroups = useMemo(() => {
    if (!groups?.length) return [];
    const map = new Map<number, Group>();
    groups.forEach(group => map.set(group.id, group));

    const buildLabel = (group: Group): string => {
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

    return groups.filter(group => group.parent_id).map(group => ({ ...group, displayName: buildLabel(group) }));
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
    
    setSubmitting(true);
    try {
      await onSubmit(lane.id, name, groupId ? Number(groupId) : null);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const isOpen = !!lane;

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-[9999] transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      {/* Right Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-[10000] transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 p-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">レーン編集</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              type="button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">レーン名 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="例: 訪問ルートA"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">担当チーム <span className="text-red-500">*</span></label>
                <select
                  value={groupId}
                  onChange={(e) => {
                    setGroupId(e.target.value ? Number(e.target.value) : '');
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">選択してください</option>
                  {labeledGroups.map(g => (
                     <option key={g.id} value={g.id}>{g.displayName}</option>
                  ))}
                </select>
              </div>
              
              {/* Footer Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  disabled={submitting}
                >
                  {submitting ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

interface LaneRowProps {
  lane: Lane;
  visits: Visit[];
  date: Date;
  onVisitClick: (visit: Visit) => void;
  onTimeSlotClick?: (hour: number, laneId: string) => void;
  onRemove: () => void;
  onEdit: () => void;
  visibleHours: number[];
}

const LaneRow: React.FC<LaneRowProps> = ({ 
  lane, 
  visits, 
  date, 
  onVisitClick, 
  onTimeSlotClick,
  onRemove,
  onEdit,
  visibleHours
}) => {

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


  return (
    <div className={`flex border-b border-gray-200 ${lane.color}`}>
      {/* Lane Label */}
      <div className="w-48 flex-shrink-0 p-3 border-r border-gray-200 flex items-center justify-between gap-2">
        <span className="font-medium text-sm flex-1 text-indigo-700">
          {lane.name}
        </span>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-indigo-600 rounded"
            title="名称変更"
          >
            <PencilIcon className="w-3 h-3" />
          </button>
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
              className={`flex-1 min-w-[100px] border-r border-gray-100 p-2 cursor-pointer hover:bg-indigo-50/50 transition-colors relative group ${hasConflict ? 'bg-red-50' : ''}`}
              style={{ minHeight: '80px' }}
              onClick={() => {
                console.log('Time slot clicked:', hour, lane.id);
                onTimeSlotClick?.(hour, String(lane.id));
              }}
              title={`${String(hour).padStart(2, '0')}:00 - 予定を追加`}
            >
              {/* Hover Plus Icon */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                <PlusIcon className="w-6 h-6 text-indigo-300" />
              </div>

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
  groups,
  onVisitClick,
  onTimeSlotClick,
}: PatientCalendarViewProps) {
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLane, setEditingLane] = useState<Lane | null>(null);

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

  const handleCreateLane = async (name: string, groupId: number | null) => {
    try {
      const newLane = await createPlanningLane(name, lanes.length, groupId);
      const mappedLane = {
        ...newLane,
        label: newLane.name,
        color: LANE_COLORS[lanes.length % LANE_COLORS.length]
      };
      setLanes([...lanes, mappedLane]);
      setIsCreateModalOpen(false);
    } catch (err: unknown) {
      console.error('Failed to create lane:', err);
      alert('レーンの作成に失敗しました');
      throw err;
    }
  };

  const handleEditLane = async (laneId: number, name: string, groupId: number | null) => {
    try {
      const updated = await updatePlanningLane(laneId, name);
      setLanes(lanes.map(l => l.id === laneId ? { ...l, name: updated.name, label: updated.name, group_id: groupId } : l));
      setEditingLane(null);
    } catch (err: unknown) {
      console.error('Failed to update lane:', err);
      alert('レーンの更新に失敗しました');
      throw err;
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
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              console.log('Plus button clicked');
              setIsCreateModalOpen(true);
            }}
            className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center"
            title="レーン追加"
          >
            <PlusIcon className="w-6 h-6" />
          </button>
          <span className="text-xs text-gray-400">v3</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={scrollEarlier}
            disabled={!canScrollEarlier}
            className="p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-full transition-colors"
            title="前の時間帯"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          
          <span className="text-sm font-medium text-gray-600 min-w-[100px] text-center">
            {visibleHours[0]}:00 - {visibleHours[visibleHours.length - 1]}:59
          </span>

          <button
            onClick={scrollLater}
            disabled={!canScrollLater}
            className="p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-full transition-colors"
            title="次の時間帯"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto">
        {/* Time Header */}
        <div className="flex sticky top-0 bg-white z-10 border-b-2 border-gray-300">
          <div className="w-48 flex-shrink-0 p-3 border-r border-gray-200 bg-gray-100 font-semibold text-sm text-gray-700 flex items-center gap-2">
            <span>計画レーン</span>
            <span className="text-xs font-normal text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
              {lanes.length}
            </span>
          </div>
          <div className="flex-1 flex">
            {visibleHours.map(hour => (
              <div
                key={hour}
                className="flex-1 min-w-[100px] p-2 text-center border-r border-gray-200 bg-gray-100 text-xs font-medium text-gray-600"
              >
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>
        </div>

        {/* Lane Rows */}
        {lanes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <ExclamationTriangleIcon className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">レーンがありません</p>
            <p className="text-xs mt-1">左上の「＋」ボタンから追加してください</p>
          </div>
        ) : (
          lanes.map(lane => (
            <LaneRow
              key={lane.id}
              lane={lane}
              visits={todaysVisits}
              date={date}
              onVisitClick={onVisitClick}
              onTimeSlotClick={onTimeSlotClick}
              onRemove={() => removeLane(lane.id)}
              onEdit={() => setEditingLane(lane)}
              visibleHours={visibleHours}
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
        groups={groups}
        onClose={() => setEditingLane(null)}
        onSubmit={handleEditLane}
      />
    </div>
  );
}
