import { useMemo, useState } from 'react';
import { useDroppable, useDndContext, DragOverlay } from '@dnd-kit/core';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { Staff, Group, Visit } from '../../api/client';
import { DraggableVisitCard, VisitCard } from '../molecules/VisitCard';

interface TimelineResourceViewProps {
  date: Date;
  staffs: Staff[];
  groups: Group[];
  selectedGroupIds?: number[];
  visits: Visit[];
  onVisitClick: (visit: Visit) => void;
  onTimeSlotClick?: (staffId: number, time: Date) => void;
}

const START_HOUR = 8;
const END_HOUR = 20;


interface TimelineStaffRowProps {
  staff: Staff;
  groupName?: string;
  visits: Visit[];
  visibleHours: number[];
  date: Date;
  onVisitClick: (visit: Visit) => void;
  onTimeSlotClick?: (staffId: number, time: Date) => void;
}

interface DroppableTimeSlotProps {
  hour: number;
  staff: Staff;
  date: Date;
  children: React.ReactNode;
  onClick: () => void;
}

const DroppableTimeSlot = ({ hour, staff, date, children, onClick }: DroppableTimeSlotProps) => {
  const slotDate = new Date(date);
  slotDate.setHours(hour, 0, 0, 0);

  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${staff.id}-${hour}`,
    data: { 
      staff,
      date: slotDate
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[60px] sm:min-w-[100px] border-r border-gray-100 p-1 sm:p-2 cursor-pointer transition-colors ${isOver ? 'bg-indigo-100 ring-2 ring-inset ring-indigo-400' : 'hover:bg-indigo-50/50'}`}
      style={{ minHeight: '60px' }}
      onClick={onClick}
      title={`${String(hour).padStart(2, '0')}:00 - 予定を追加`}
    >
      {children}
    </div>
  );
};

function TimelineStaffRow({ staff, groupName, visits, visibleHours, date, onVisitClick, onTimeSlotClick }: TimelineStaffRowProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `staff-${staff.id}`,
    data: { staff },
  });

  const getVisitsForHour = (hour: number) => {
    return visits.filter(v => {
      const visitDate = new Date(v.scheduled_at);
      const startHour = visitDate.getHours();
      return startHour === hour;
    });
  };

  const handleHourClick = (hour: number) => {
    if (!onTimeSlotClick) return;
    const clickedTime = new Date(date);
    clickedTime.setHours(hour, 0, 0, 0);
    onTimeSlotClick(staff.id, clickedTime);
  };

  return (
    <div 
      ref={setNodeRef}
      className={`flex border-b border-gray-200 min-w-max ${isOver ? 'bg-indigo-50 ring-2 ring-inset ring-indigo-300' : ''}`}
    >
      {/* Staff Label - Sticky Left */}
      <div className="sticky left-0 z-10 w-24 sm:w-48 flex-shrink-0 p-2 sm:p-3 border-r border-gray-200 flex items-center bg-white shadow-[1px_0_3px_rgba(0,0,0,0.05)]">
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mr-2 sm:mr-3 flex-shrink-0">
          {staff.name.slice(0, 1)}
        </div>
        <div className="min-w-0">
          <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{staff.name}</div>
          {groupName && (
            <div className="text-[10px] text-gray-500 truncate">
              {groupName}
            </div>
          )}
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="flex">
        {visibleHours.map(hour => {
          const hourVisits = getVisitsForHour(hour);
          
          return (
            <DroppableTimeSlot
              key={hour}
              hour={hour}
              staff={staff}
              date={date}
              onClick={() => handleHourClick(hour)}
            >
              {hourVisits.map(visit => (
                <DraggableVisitCard
                  key={visit.id}
                  visit={visit}
                  onClick={() => onVisitClick(visit)}
                />
              ))}
            </DroppableTimeSlot>
          );
        })}
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
  onVisitClick,
  onTimeSlotClick,
}: TimelineResourceViewProps) {
  // 表示する時間範囲の状態管理
  const [startHour, setStartHour] = useState(START_HOUR);
  const [endHour, setEndHour] = useState(END_HOUR);
  
  const visibleHours = useMemo(() => 
    Array.from({ length: endHour - startHour }, (_, i) => startHour + i),
    [startHour, endHour]
  );

  const canGoEarlier = startHour > 0;
  const canGoLater = endHour < 24;

  const handleEarlier = () => {
    if (canGoEarlier) {
      setStartHour(prev => Math.max(0, prev - 2));
      setEndHour(prev => Math.max(2, prev - 2));
    }
  };

  const handleLater = () => {
    if (canGoLater) {
      setStartHour(prev => Math.min(22, prev + 2));
      setEndHour(prev => Math.min(24, prev + 2));
    }
  };

  const hierarchy = useMemo(() => {
    // 1. Identify Offices (Roots) - those without parent_id
    const offices = groups.filter(g => !g.parent_id);
    
    // 2. Identify Teams (Children) - those with parent_id
    const teams = groups.filter(g => g.parent_id);
    
    // 3. Map Teams to Offices
    const officeTeams = new Map<number, Group[]>();
    teams.forEach(team => {
      if (team.parent_id) {
        const list = officeTeams.get(team.parent_id) || [];
        list.push(team);
        officeTeams.set(team.parent_id, list);
      }
    });

    // 4. Map Staffs to Groups (Office or Team)
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
      return (
        <TimelineStaffRow
          key={staff.id}
          staff={staff}
          groupName={groupName}
          visits={staffVisits}
          visibleHours={visibleHours}
          date={date}
          onVisitClick={onVisitClick}
          onTimeSlotClick={onTimeSlotClick}
        />
      );
    });
  };

  const { active } = useDndContext();
  const activeDragVisit = active?.data.current?.visit as Visit | undefined;

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Time Range Control */}
      <div className="flex items-center justify-center gap-2 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <button
          onClick={handleEarlier}
          disabled={!canGoEarlier}
          className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
          title="前の時間帯"
        >
          <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <span className="text-sm text-gray-600 min-w-[100px] text-center">
          {startHour}:00 - {endHour - 1}:59
        </span>
        <button
          onClick={handleLater}
          disabled={!canGoLater}
          className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
          title="後の時間帯"
        >
          <ChevronRightIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Unified Scroll Container */}
      <div className="flex-1 overflow-auto relative">
        {/* Header: Time Scale (Sticky Top) */}
        <div className="sticky top-0 z-20 flex min-w-max border-b border-gray-200 bg-gray-50 shadow-sm">
          <div className="sticky left-0 z-30 w-24 sm:w-48 flex-shrink-0 border-r border-gray-200 p-2 font-semibold text-gray-600 text-xs sm:text-sm flex items-center pl-2 sm:pl-4 bg-gray-50 shadow-[1px_0_3px_rgba(0,0,0,0.05)]">
            スタッフ
          </div>
          <div className="flex">
            {visibleHours.map((hour) => (
              <div
                key={hour}
                className="flex-1 min-w-[60px] sm:min-w-[100px] border-r border-gray-100 text-xs text-gray-500 px-1 sm:px-2 py-2 text-center bg-gray-50"
              >
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>
        </div>

        {/* Body: Staff Rows */}
        <div className="min-w-max">
          {hierarchy.offices.map((office) => {
            const isOfficeSelected = !selectedGroupIds || selectedGroupIds.includes(office.id);
            const teams = hierarchy.officeTeams.get(office.id) || [];
            const visibleTeams = teams.filter(t => !selectedGroupIds || selectedGroupIds.includes(t.id));
            
            if (!isOfficeSelected && visibleTeams.length === 0) return null;

            const directStaffs = hierarchy.groupStaffs.get(office.id) || [];
            
            // Calculate total staff in this office (direct + teams)
            const visibleDirectStaffs = isOfficeSelected ? directStaffs : [];
            const totalStaffCount = visibleDirectStaffs.length + visibleTeams.reduce((acc, team) => acc + (hierarchy.groupStaffs.get(team.id)?.length || 0), 0);

            if (totalStaffCount === 0 && visibleTeams.length === 0) return null;

            return (
              <div key={office.id}>
                {/* Direct Staffs */}
                {isOfficeSelected && renderStaffRows(directStaffs, office.name)}

                {/* Teams */}
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

          {/* Unassigned Staffs */}
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
