import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Staff, Group, Visit } from '../../api/client';

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
const TOTAL_HOURS = END_HOUR - START_HOUR;

interface TimelineStaffRowProps {
  staff: Staff;
  groupName?: string;
  visits: Visit[];
  hours: number[];
  date: Date;
  onVisitClick: (visit: Visit) => void;
  onTimeSlotClick?: (staffId: number, time: Date) => void;
}

function TimelineStaffRow({ staff, groupName, visits, hours, date, onVisitClick, onTimeSlotClick }: TimelineStaffRowProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `staff-${staff.id}`,
    data: { staff },
  });

  const handleTimeSlotClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onTimeSlotClick) return;
    
    // Prevent triggering when clicking on a visit
    if ((e.target as HTMLElement).closest('.visit-card')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = x / width;
    
    const totalMinutes = TOTAL_HOURS * 60;
    const clickMinutes = percentage * totalMinutes;
    
    const hour = START_HOUR + Math.floor(clickMinutes / 60);
    const minute = Math.floor(clickMinutes % 60);
    
    // Round to nearest 15 minutes
    const roundedMinute = Math.round(minute / 15) * 15;
    
    const clickedTime = new Date(date);
    clickedTime.setHours(hour, roundedMinute, 0, 0);
    
    onTimeSlotClick(staff.id, clickedTime);
  };

  const getPositionStyle = (visit: Visit) => {
    const visitDate = new Date(visit.scheduled_at);
    const startMinutes = (visitDate.getHours() - START_HOUR) * 60 + visitDate.getMinutes();
    const durationMinutes = visit.duration;
    
    const leftPercent = (startMinutes / (TOTAL_HOURS * 60)) * 100;
    const widthPercent = (durationMinutes / (TOTAL_HOURS * 60)) * 100;
    
    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
    };
  };

  return (
    <div 
      ref={setNodeRef}
      className={`flex border-b border-gray-100 transition-colors h-16 ${isOver ? 'bg-indigo-50 ring-2 ring-inset ring-indigo-300' : 'hover:bg-gray-50'}`}
    >
      <div className="w-48 flex-shrink-0 border-r border-gray-200 p-3 flex items-center bg-white z-10">
        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mr-3">
          {staff.name.slice(0, 1)}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">{staff.name}</div>
          {groupName && (
            <div className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded inline-block mt-0.5">
              {groupName}
            </div>
          )}
        </div>
      </div>
      <div 
        className="flex-1 relative cursor-crosshair"
        onClick={handleTimeSlotClick}
      >
        {/* Grid Lines */}
        {hours.map((hour) => (
          <div
            key={hour}
            className="absolute top-0 bottom-0 border-l border-gray-100 pointer-events-none"
            style={{ left: `${((hour - START_HOUR) / TOTAL_HOURS) * 100}%` }}
          />
        ))}
        
        {/* Visits */}
        {visits.map((visit) => (
          <div
            key={visit.id}
            onClick={(e) => {
              e.stopPropagation();
              onVisitClick(visit);
            }}
            className="visit-card absolute top-2 bottom-2 bg-indigo-500 rounded-md shadow-sm border border-indigo-600 cursor-pointer hover:bg-indigo-600 transition-colors z-10 overflow-hidden px-2 py-1"
            style={getPositionStyle(visit)}
          >
            <div className="text-xs font-bold text-white truncate">
              {visit.patient.name}
            </div>
            <div className="text-[10px] text-indigo-100 truncate">
              {new Date(visit.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
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
  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

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
          hours={hours}
          date={date}
          onVisitClick={onVisitClick}
          onTimeSlotClick={onTimeSlotClick}
        />
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header: Time Scale */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <div className="w-48 flex-shrink-0 border-r border-gray-200 p-2 font-semibold text-gray-600 text-sm flex items-center pl-4">
          スタッフ
        </div>
        <div className="flex-1 relative h-10">
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute top-0 bottom-0 border-l border-gray-200 text-xs text-gray-400 pl-1 pt-1"
              style={{ left: `${((hour - START_HOUR) / TOTAL_HOURS) * 100}%` }}
            >
              {hour}:00
            </div>
          ))}
        </div>
      </div>

      {/* Body: Staff Rows */}
      <div className="flex-1 overflow-y-auto">
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
  );
}
