import { useMemo, useState } from 'react';
import { useDroppable, useDndContext, DragOverlay } from '@dnd-kit/core';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { Staff, Group, Visit, ScheduleEvent } from '../../api/client';
import { DraggableVisitCard, VisitCard } from '../molecules/VisitCard';
import { EventCard } from '../molecules/EventCard';

interface TimelineResourceViewProps {
  date: Date;
  staffs: Staff[];
  groups: Group[];
  selectedGroupIds?: number[];
  visits: Visit[];
  events?: ScheduleEvent[];
  onVisitClick: (visit: Visit) => void;
  onEventClick?: (event: ScheduleEvent) => void;
  onTimeSlotClick?: (staffId: number, time: Date) => void;
}

const START_HOUR = 0;
const END_HOUR = 24;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const DEFAULT_START_HOUR = 9;

// ズームレベル設定
const ZOOM_LEVELS = {
  '8h': { hours: 8, label: '8h' },
  '24h': { hours: 24, label: '24h' },
} as const;
type ZoomLevel = keyof typeof ZOOM_LEVELS;

interface TimelineStaffRowProps {
  staff: Staff;
  groupName?: string;
  visits: Visit[];
  events?: ScheduleEvent[];
  visibleHours: number[];
  date: Date;
  onVisitClick: (visit: Visit) => void;
  onEventClick?: (event: ScheduleEvent) => void;
  onTimeSlotClick?: (staffId: number, time: Date) => void;
}

interface DroppableTimeSlotProps {
  hour: number;
  staffId: number;
  date: Date;
  onClick: () => void;
}

const DroppableTimeSlot = ({ hour, staffId, date, onClick }: DroppableTimeSlotProps) => {
  const slotDate = new Date(date);
  slotDate.setHours(hour, 0, 0, 0);

  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${staffId}-${hour}`,
    data: { 
      staffId,
      date: slotDate
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[80px] border-r border-gray-100 cursor-pointer transition-colors group relative ${isOver ? 'bg-indigo-100 ring-2 ring-inset ring-indigo-400' : 'hover:bg-indigo-50/50'}`}
      style={{ minHeight: '80px' }}
      onClick={onClick}
      title={`${String(hour).padStart(2, '0')}:00 - 予定を追加`}
    >
      {/* Hover Plus Icon */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
        <PlusIcon className="w-5 h-5 text-indigo-300" />
      </div>
    </div>
  );
};

// カードの位置とサイズを計算する関数
const calculateCardPosition = (
  scheduledAt: string,
  duration: number,
  visibleHours: number[]
): { leftPercent: number; widthPercent: number; isVisible: boolean } => {
  const itemDate = new Date(scheduledAt);
  const startHour = itemDate.getHours();
  const startMinute = itemDate.getMinutes();
  const durationMinutes = duration || 60;
  
  const visibleStartHour = visibleHours[0];
  const visibleEndHour = visibleHours[visibleHours.length - 1] + 1;
  const totalVisibleHours = visibleEndHour - visibleStartHour;
  
  const startTimeInHours = startHour + startMinute / 60;
  const endTimeInHours = startTimeInHours + durationMinutes / 60;
  
  if (endTimeInHours <= visibleStartHour || startTimeInHours >= visibleEndHour) {
    return { leftPercent: 0, widthPercent: 0, isVisible: false };
  }
  
  const clippedStart = Math.max(startTimeInHours, visibleStartHour);
  const clippedEnd = Math.min(endTimeInHours, visibleEndHour);
  
  const leftPercent = ((clippedStart - visibleStartHour) / totalVisibleHours) * 100;
  const widthPercent = ((clippedEnd - clippedStart) / totalVisibleHours) * 100;
  
  return { leftPercent, widthPercent, isVisible: true };
};

function TimelineStaffRow({ staff, groupName, visits, events = [], visibleHours, date, onVisitClick, onEventClick, onTimeSlotClick }: TimelineStaffRowProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `staff-${staff.id}`,
    data: { staff },
  });

  const handleHourClick = (hour: number) => {
    if (!onTimeSlotClick) return;
    const clickedTime = new Date(date);
    clickedTime.setHours(hour, 0, 0, 0);
    onTimeSlotClick(staff.id, clickedTime);
  };

  // 訪問カードの位置計算（重複対応）
  const visitPositions = useMemo(() => {
    const positions: { visit: Visit; leftPercent: number; widthPercent: number; verticalIndex: number }[] = [];
    const sortedVisits = [...visits].sort((a, b) => 
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );
    
    sortedVisits.forEach(visit => {
      const pos = calculateCardPosition(visit.scheduled_at, visit.duration || 60, visibleHours);
      if (!pos.isVisible) return;
      
      let verticalIndex = 0;
      const visitStart = new Date(visit.scheduled_at).getTime();
      const visitEnd = visitStart + (visit.duration || 60) * 60000;
      
      positions.forEach(existing => {
        const existingVisit = existing.visit;
        const existingStart = new Date(existingVisit.scheduled_at).getTime();
        const existingEnd = existingStart + (existingVisit.duration || 60) * 60000;
        
        if (visitStart < existingEnd && visitEnd > existingStart) {
          if (existing.verticalIndex >= verticalIndex) {
            verticalIndex = existing.verticalIndex + 1;
          }
        }
      });
      
      positions.push({ visit, ...pos, verticalIndex });
    });
    
    return positions;
  }, [visits, visibleHours]);

  return (
    <div 
      ref={setNodeRef}
      className={`flex border-b border-gray-200 min-w-[600px] sm:min-w-0 ${isOver ? 'bg-indigo-50 ring-2 ring-inset ring-indigo-300' : ''}`}
    >
      {/* Staff Label */}
      <div className="w-28 sm:w-40 flex-shrink-0 px-2 py-2 sm:px-3 sm:py-3 border-r border-gray-200 flex items-center gap-2 bg-white">
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
          {staff.name.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{staff.name}</div>
          {groupName && (
            <div className="text-[10px] text-gray-500 truncate">
              {groupName}
            </div>
          )}
        </div>
      </div>

      {/* Timeline Grid with absolute positioning */}
      <div className="flex-1 flex relative">
        {/* ドロップゾーン（グリッド） */}
        {visibleHours.map(hour => (
          <DroppableTimeSlot
            key={hour}
            hour={hour}
            staffId={staff.id}
            date={date}
            onClick={() => handleHourClick(hour)}
          />
        ))}
        
        {/* 訪問カードオーバーレイ（絶対位置） */}
        <div className="absolute inset-0 pointer-events-none">
          {visitPositions.map(({ visit, leftPercent, widthPercent, verticalIndex }) => (
            <div
              key={visit.id}
              className="absolute pointer-events-auto"
              style={{
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
                top: `${4 + verticalIndex * 40}px`,
                minWidth: '60px',
              }}
            >
              <DraggableVisitCard
                visit={visit}
                onClick={() => onVisitClick(visit)}
              />
            </div>
          ))}
          
          {/* イベントカード（絶対位置） */}
          {events.map(event => {
            const pos = calculateCardPosition(event.scheduled_at, event.duration || 60, visibleHours);
            if (!pos.isVisible) return null;
            
            return (
              <div
                key={`event-${event.id}`}
                className="absolute pointer-events-auto"
                style={{
                  left: `${pos.leftPercent}%`,
                  width: `${pos.widthPercent}%`,
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
}

export function TimelineResourceView({
  date,
  staffs,
  groups,
  selectedGroupIds,
  visits,
  events = [],
  onVisitClick,
  onEventClick,
  onTimeSlotClick,
}: TimelineResourceViewProps) {
  // ズームレベルとスクロール位置の状態管理
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('8h');
  const [scrollOffset, setScrollOffset] = useState(DEFAULT_START_HOUR);
  
  const visibleHours = useMemo(() => {
    const hours = ZOOM_LEVELS[zoomLevel].hours;
    if (zoomLevel === '24h') {
      return Array.from({ length: TOTAL_HOURS }, (_, i) => i);
    }
    return Array.from({ length: hours }, (_, i) => scrollOffset + i);
  }, [zoomLevel, scrollOffset]);

  const canScrollEarlier = zoomLevel !== '24h' && scrollOffset > 0;
  const canScrollLater = zoomLevel !== '24h' && scrollOffset + ZOOM_LEVELS[zoomLevel].hours < TOTAL_HOURS;

  const scrollEarlier = () => {
    if (canScrollEarlier) {
      setScrollOffset(prev => Math.max(0, prev - 2));
    }
  };

  const scrollLater = () => {
    if (canScrollLater) {
      setScrollOffset(prev => Math.min(TOTAL_HOURS - ZOOM_LEVELS[zoomLevel].hours, prev + 2));
    }
  };

  // Get events for a specific staff member
  const getEventsForStaff = (staffId: number) => {
    return events.filter(e => e.participant_ids.includes(staffId));
  };

  const hierarchy = useMemo(() => {
    const offices = groups.filter(g => !g.parent_id);
    const teams = groups.filter(g => g.parent_id);
    
    const officeTeams = new Map<number, Group[]>();
    teams.forEach(team => {
      if (team.parent_id) {
        const list = officeTeams.get(team.parent_id) || [];
        list.push(team);
        officeTeams.set(team.parent_id, list);
      }
    });

    const groupStaffs = new Map<number, Staff[]>();
    const unassignedStaffs: Staff[] = [];

    staffs.forEach(staff => {
      if (staff.group_id) {
        const list = groupStaffs.get(staff.group_id) || [];
        list.push(staff);
        groupStaffs.set(staff.group_id, list);
      } else {
        unassignedStaffs.push(staff);
      }
    });

    return { offices, officeTeams, groupStaffs, unassignedStaffs };
  }, [staffs, groups]);

  const renderStaffRows = (staffList: Staff[], groupName?: string) => {
    return staffList.map(staff => {
      const staffVisits = visits.filter(v => v.staff_id === staff.id);
      const staffEvents = getEventsForStaff(staff.id);
      return (
        <TimelineStaffRow
          key={staff.id}
          staff={staff}
          groupName={groupName}
          visits={staffVisits}
          events={staffEvents}
          visibleHours={visibleHours}
          date={date}
          onVisitClick={onVisitClick}
          onEventClick={onEventClick}
          onTimeSlotClick={onTimeSlotClick}
        />
      );
    });
  };

  const { active } = useDndContext();
  const activeDragVisit = active?.data.current?.visit as Visit | undefined;

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Toolbar - 計画レーンビューと統一 */}
      <div className="flex-none px-3 py-2 sm:px-4 sm:py-3 border-b border-gray-200 flex items-center justify-end gap-2 sm:gap-3 bg-white">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* ズームレベル切り替えボタン */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {(Object.keys(ZOOM_LEVELS) as ZoomLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => {
                  setZoomLevel(level);
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

      {/* Timeline Content */}
      <div className="flex-1 overflow-y-auto overflow-x-auto">
        {/* Time Header */}
        <div className="flex sticky top-0 bg-white z-10 border-b-2 border-gray-300 min-w-[600px] sm:min-w-0">
          <div className="w-28 sm:w-40 flex-shrink-0 px-2 py-2 border-r border-gray-200 bg-gray-100 font-semibold text-xs text-gray-700 flex items-center gap-1">
            <span className="truncate">スタッフ</span>
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

        {/* Staff Rows */}
        <div className="min-w-[600px] sm:min-w-0">
          {hierarchy.offices.map((office) => {
            const isOfficeSelected = !selectedGroupIds || selectedGroupIds.includes(office.id);
            const teams = hierarchy.officeTeams.get(office.id) || [];
            const visibleTeams = teams.filter(t => !selectedGroupIds || selectedGroupIds.includes(t.id));
            
            if (!isOfficeSelected && visibleTeams.length === 0) return null;

            const directStaffs = hierarchy.groupStaffs.get(office.id) || [];
            const visibleDirectStaffs = isOfficeSelected ? directStaffs : [];
            const totalStaffCount = visibleDirectStaffs.length + visibleTeams.reduce((acc, team) => acc + (hierarchy.groupStaffs.get(team.id)?.length || 0), 0);

            if (totalStaffCount === 0 && visibleTeams.length === 0) return null;

            return (
              <div key={office.id}>
                {isOfficeSelected && renderStaffRows(directStaffs, office.name)}
                {visibleTeams.map(team => {
                  const teamStaffs = hierarchy.groupStaffs.get(team.id) || [];
                  if (teamStaffs.length === 0) return null;
                  return (
                    <div key={team.id}>
                      {renderStaffRows(teamStaffs, team.name)}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {hierarchy.unassignedStaffs.length > 0 && (
            <div>
              {renderStaffRows(hierarchy.unassignedStaffs, '未所属')}
            </div>
          )}
          
          {staffs.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              スタッフが表示されていません
            </div>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeDragVisit ? (
          <VisitCard visit={activeDragVisit} onClick={() => {}} isOverlay />
        ) : null}
      </DragOverlay>
    </div>
  );
}
