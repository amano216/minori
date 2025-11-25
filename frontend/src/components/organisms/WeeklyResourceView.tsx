import { useState, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { Staff, Group, Visit } from '../../api/client';

interface WeeklyResourceViewProps {
  startDate: Date;
  staffs: Staff[];
  groups: Group[];
  visits: Visit[];
  onVisitClick: (visit: Visit) => void;
  onCellClick?: (staffId: number, date: Date) => void;
}

interface WeeklyStaffRowProps {
  staff: Staff;
  visits: Visit[];
  days: Date[];
  onVisitClick: (visit: Visit) => void;
  onCellClick?: (staffId: number, date: Date) => void;
}

function WeeklyStaffRow({ staff, visits, days, onVisitClick, onCellClick }: WeeklyStaffRowProps) {
  return (
    <div className="flex border-b border-gray-100 transition-colors min-h-[80px]">
      {/* Staff Header */}
      <div className="w-48 flex-shrink-0 border-r border-gray-200 p-3 flex items-center bg-white sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mr-3">
          {staff.name.slice(0, 1)}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">{staff.name}</div>
          <div className="text-xs text-gray-500">スタッフ</div>
        </div>
      </div>

      {/* Days Grid */}
      {days.map((day) => {
        const dayStr = day.toISOString().split('T')[0];
        const dayVisits = visits.filter(v => v.scheduled_at.startsWith(dayStr));
        
        // Sort visits by time
        dayVisits.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

        const { setNodeRef, isOver } = useDroppable({
          id: `staff-${staff.id}-date-${dayStr}`,
          data: { staff, date: day },
        });

        return (
          <div
            key={dayStr}
            ref={setNodeRef}
            className={`flex-1 border-r border-gray-100 p-1 min-w-[120px] relative transition-colors ${
              isOver ? 'bg-indigo-50 ring-2 ring-inset ring-indigo-300' : 'hover:bg-gray-50'
            }`}
            onClick={() => onCellClick?.(staff.id, day)}
          >
            <div className="flex flex-col gap-1 h-full">
              {dayVisits.map((visit) => (
                <div
                  key={visit.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onVisitClick(visit);
                  }}
                  className="bg-white border border-indigo-200 rounded px-1.5 py-1 shadow-sm cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1 rounded">
                      {new Date(visit.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {visit.duration}分
                    </span>
                  </div>
                  <div className="text-xs font-medium text-gray-900 truncate mt-0.5">
                    {visit.patient.name}
                  </div>
                </div>
              ))}
              {dayVisits.length === 0 && (
                <div className="h-full flex items-center justify-center text-gray-300 text-xs opacity-0 hover:opacity-100 select-none pointer-events-none">
                  空き
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function WeeklyResourceView({
  startDate,
  staffs,
  groups,
  visits,
  onVisitClick,
  onCellClick,
}: WeeklyResourceViewProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set());

  // Generate 7 days from startDate
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [startDate]);

  const toggleGroup = (groupId: number) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupId)) {
      newCollapsed.delete(groupId);
    } else {
      newCollapsed.add(groupId);
    }
    setCollapsedGroups(newCollapsed);
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

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header: Days */}
      <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-30">
        <div className="w-48 flex-shrink-0 border-r border-gray-200 p-2 font-semibold text-gray-600 text-sm flex items-center pl-4 bg-gray-50 sticky left-0 z-40">
          スタッフ
        </div>
        {days.map((day) => {
          const isToday = new Date().toDateString() === day.toDateString();
          return (
            <div
              key={day.toISOString()}
              className={`flex-1 border-r border-gray-200 p-2 text-center min-w-[120px] ${isToday ? 'bg-indigo-50' : ''}`}
            >
              <div className={`text-xs font-bold ${isToday ? 'text-indigo-700' : 'text-gray-700'}`}>
                {day.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
              </div>
              <div className={`text-[10px] ${isToday ? 'text-indigo-500' : 'text-gray-500'}`}>
                {day.toLocaleDateString('ja-JP', { weekday: 'short' })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Body: Staff Rows */}
      <div className="flex-1 overflow-y-auto overflow-x-auto">
        {hierarchy.offices.map((office) => {
          const isCollapsed = collapsedGroups.has(office.id);
          const teams = hierarchy.officeTeams.get(office.id) || [];
          const directStaffs = hierarchy.groupStaffs.get(office.id) || [];
          const totalStaffCount = directStaffs.length + teams.reduce((acc, team) => acc + (hierarchy.groupStaffs.get(team.id)?.length || 0), 0);

          if (totalStaffCount === 0 && teams.length === 0) return null;

          return (
            <div key={office.id} className="min-w-fit">
              {/* Office Header */}
              <div 
                className="flex items-center bg-gray-100 border-b border-gray-200 px-2 py-1 cursor-pointer hover:bg-gray-200 transition-colors sticky left-0 z-20"
                onClick={() => toggleGroup(office.id)}
              >
                <div className="w-48 flex-shrink-0 flex items-center">
                  {isCollapsed ? <ChevronRightIcon className="w-4 h-4 text-gray-500 mr-2" /> : <ChevronDownIcon className="w-4 h-4 text-gray-500 mr-2" />}
                  <span className="text-sm font-bold text-gray-800">{office.name}</span>
                  <span className="ml-2 text-xs text-gray-500 bg-white px-1.5 rounded-full border border-gray-200">
                    {totalStaffCount}
                  </span>
                </div>
                <div className="flex-1"></div>
              </div>

              {!isCollapsed && (
                <>
                  {/* Direct Staffs */}
                  {directStaffs.map(staff => {
                    const staffVisits = visits.filter(v => v.staff_id === staff.id);
                    return (
                      <WeeklyStaffRow
                        key={staff.id}
                        staff={staff}
                        visits={staffVisits}
                        days={days}
                        onVisitClick={onVisitClick}
                        onCellClick={onCellClick}
                      />
                    );
                  })}

                  {/* Teams */}
                  {teams.map(team => {
                    const teamStaffs = hierarchy.groupStaffs.get(team.id) || [];
                    if (teamStaffs.length === 0) return null;
                    
                    return (
                      <div key={team.id}>
                         {/* Team Header */}
                         <div className="flex items-center bg-gray-50 border-b border-gray-100 px-2 py-1 sticky left-0 z-20">
                            <div className="w-48 flex-shrink-0 flex items-center pl-6">
                              <span className="text-xs font-semibold text-gray-600">{team.name}</span>
                              <span className="ml-2 text-[10px] text-gray-400 bg-white px-1.5 rounded-full border border-gray-200">
                                {teamStaffs.length}
                              </span>
                            </div>
                            <div className="flex-1"></div>
                         </div>
                         {teamStaffs.map(staff => {
                            const staffVisits = visits.filter(v => v.staff_id === staff.id);
                            return (
                              <WeeklyStaffRow
                                key={staff.id}
                                staff={staff}
                                visits={staffVisits}
                                days={days}
                                onVisitClick={onVisitClick}
                                onCellClick={onCellClick}
                              />
                            );
                         })}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          );
        })}
        
        {/* Unassigned */}
        {hierarchy.unassignedStaffs.length > 0 && (
          <div className="min-w-fit">
            <div className="flex items-center bg-gray-100 border-b border-gray-200 px-2 py-1 sticky left-0 z-20">
              <div className="w-48 flex-shrink-0 flex items-center pl-2">
                <span className="text-sm font-bold text-gray-700">未所属</span>
                <span className="ml-2 text-xs text-gray-500 bg-white px-1.5 rounded-full border border-gray-200">
                  {hierarchy.unassignedStaffs.length}
                </span>
              </div>
              <div className="flex-1"></div>
            </div>
            {hierarchy.unassignedStaffs.map(staff => {
              const staffVisits = visits.filter(v => v.staff_id === staff.id);
              return (
                <WeeklyStaffRow
                  key={staff.id}
                  staff={staff}
                  visits={staffVisits}
                  days={days}
                  onVisitClick={onVisitClick}
                  onCellClick={onCellClick}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
