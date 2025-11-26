import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  PlusIcon, 
  InboxIcon,
  ChevronDoubleLeftIcon,
  CalendarDaysIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import {
  fetchWeeklySchedule,
  fetchStaffs,
  fetchGroups,
  cancelVisit,
  completeVisit,
  updateVisit,
  deleteVisit,
  type Staff,
  type Group,
  type ScheduleVisit,
  type Visit,
} from '../api/client';
import { Spinner } from '../components/atoms/Spinner';
import { NewVisitPanel } from '../components/organisms/NewVisitPanel';
import { VisitDetailPanel } from '../components/organisms/VisitDetailPanel';
import { TimelineResourceView } from '../components/organisms/TimelineResourceView';
import PatientCalendarView from '../components/organisms/PatientCalendarView';
import { UnassignedVisitInbox } from '../components/organisms/UnassignedVisitInbox';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { MonthlyCalendarView } from '../components/organisms/MonthlyCalendarView';
import { MultiGroupSelector } from '../components/organisms/MultiGroupSelector';

function convertScheduleVisitToVisit(sv: ScheduleVisit): Visit {
  return {
    id: sv.id,
    patient_id: sv.patient_id,
    patient: sv.patient,
    staff_id: sv.staff_id ?? null,
    staff: sv.staff ?? null,
    scheduled_at: sv.scheduled_at,
    duration: sv.duration,
    status: sv.status,
    notes: sv.notes,
    created_at: sv.created_at,
    updated_at: sv.updated_at,
    planning_lane_id: sv.planning_lane_id,
  };
}

export function UnifiedSchedulePage() {
  const navigate = useNavigate();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'patient'>('patient');
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [allWeeklyVisits, setAllWeeklyVisits] = useState<Visit[]>([]);
  
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New Visit Panel State
  const [isNewVisitPanelOpen, setIsNewVisitPanelOpen] = useState(false);
  const [newVisitInitialDate, setNewVisitInitialDate] = useState<Date | undefined>(undefined);
  const [newVisitInitialStaffId, setNewVisitInitialStaffId] = useState<number | undefined>(undefined);
  const [newVisitInitialPlanningLaneId, setNewVisitInitialPlanningLaneId] = useState<number | undefined>(undefined);
  
  const [isInboxOpen, setIsInboxOpen] = useState(true);
  const [isMonthlyCalendarOpen, setIsMonthlyCalendarOpen] = useState(false);

  // Load master data
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        console.log('Loading master data...');
        const [groupsData, staffsData] = await Promise.all([
          fetchGroups(),
          fetchStaffs({ status: 'active' }),
        ]);
        console.log('Master data loaded:', { groups: groupsData.length, staffs: staffsData.length });
        setGroups(groupsData);
        setSelectedGroupIds(groupsData.map(g => g.id));
        setStaffs(staffsData);
      } catch (err) {
        console.error('Failed to load master data:', err);
        setError('マスターデータの取得に失敗しました');
        setLoading(false);
      }
    };
    loadMasterData();
  }, []);

  // Load schedule data
  const loadScheduleData = useCallback(async () => {
    try {
      console.log('Loading schedule data...', { currentDate });
      setLoading(true);
      setError('');

      // Always fetch weekly data to have context, but we focus on daily view
      // Use currentDate as start date for sliding window
      const startDate = currentDate.toISOString().split('T')[0];

      console.log('Fetching weekly schedule for:', startDate);
      const scheduleData = await fetchWeeklySchedule({ start_date: startDate });
      
      // Convert ScheduleVisit[] to Visit[]
      const allVisits: Visit[] = [];
      Object.values(scheduleData.days).forEach((dayVisits) => {
        dayVisits.forEach((sv) => {
          const visit = convertScheduleVisitToVisit(sv);
          // Enrich with staff name (if staffs are loaded)
          if (visit.staff_id && staffs.length > 0) {
            const staff = staffs.find((s) => s.id === visit.staff_id);
            if (staff) {
              visit.staff = { id: staff.id, name: staff.name };
            }
          }
          allVisits.push(visit);
        });
      });

      setAllWeeklyVisits(allVisits);

      // Filter for current date for the timeline view (except unassigned which we might want to see all)
      // Use toDateString() to compare in local timezone, avoiding UTC mismatch issues
      const todaysVisits = allVisits.filter(v => {
        const visitDate = new Date(v.scheduled_at);
        return visitDate.toDateString() === currentDate.toDateString();
      });

      console.log('Todays visits:', todaysVisits.length);
      setVisits(todaysVisits);
    } catch (err) {
      console.error('Failed to load schedule:', err);
      setError(err instanceof Error ? err.message : 'スケジュールの取得に失敗しました');
    } finally {
      console.log('Loading complete');
      setLoading(false);
    }
  }, [currentDate, staffs]);

  useEffect(() => {
    loadScheduleData();
  }, [loadScheduleData]); // Reload when loadScheduleData callback changes (depends on currentDate and staffs)

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const handleDateClick = () => {
    if (dateInputRef.current) {
      try {
        dateInputRef.current.showPicker();
      } catch {
        // Fallback for browsers that don't support showPicker
        dateInputRef.current.click(); 
      }
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setCurrentDate(new Date(e.target.value));
    }
  };

  const handleVisitCancel = async (visitId: number) => {
    try {
      await cancelVisit(visitId);
      await loadScheduleData();
      setSelectedVisit(null);
    } catch {
      alert('キャンセルに失敗しました');
    }
  };

  const handleVisitComplete = async (visitId: number) => {
    try {
      await completeVisit(visitId);
      await loadScheduleData();
      setSelectedVisit(null);
    } catch {
      alert('完了処理に失敗しました');
    }
  };

  const handleVisitEdit = (visitId: number) => {
    navigate(`/schedule/visits/${visitId}/edit`);
  };

  // Note: handleVisitReassign is kept for backward compatibility with VisitDetailPanel's onReassign prop
  // The actual reassignment logic is handled through onUpdate callback
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleVisitReassign = (_visitId: number) => {
    // This function is intentionally empty - reassignment is handled via onUpdate
  };

  const handleVisitUpdate = async (visitId: number, data: { staff_id: number | null; scheduled_at?: string; status?: string }) => {
    try {
      await updateVisit(visitId, data);
      await loadScheduleData();
      setSelectedVisit(null);
    } catch (err: unknown) {
      console.error('Failed to update visit:', err);
      alert('更新に失敗しました');
      throw err;
    }
  };

  const handleVisitDelete = async (visitId: number) => {
    if (!confirm('本当にこの予定を削除しますか？\nこの操作は取り消せません。')) {
      return;
    }
    try {
      await deleteVisit(visitId);
      await loadScheduleData();
      setSelectedVisit(null);
    } catch (err: unknown) {
      console.error('Failed to delete visit:', err);
      alert('削除に失敗しました');
    }
  };

  const handleTimeSlotClick = (staffId: number, time: Date) => {
    setSelectedVisit(null); // Close detail panel
    setNewVisitInitialStaffId(staffId);
    setNewVisitInitialDate(time);
    setNewVisitInitialPlanningLaneId(undefined);
    setIsNewVisitPanelOpen(true);
  };

  const handleNewVisitClick = () => {
    setSelectedVisit(null); // Close detail panel
    setNewVisitInitialStaffId(undefined);
    setNewVisitInitialDate(currentDate);
    setNewVisitInitialPlanningLaneId(undefined);
    setIsNewVisitPanelOpen(true);
  };

  const handleVisitSelect = (visit: Visit) => {
    setIsNewVisitPanelOpen(false); // Close new visit panel
    setSelectedVisit(visit);
  };

  const handleNewVisitCreated = async () => {
    await loadScheduleData();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const visit = active.data.current?.visit as Visit;
    
    // Handle drop on Timeline (Staff) or Weekly (Staff + Date)
    const staff = over.data.current?.staff as Staff;
    const date = over.data.current?.date as Date | undefined;

    if (visit && staff) {
      try {
        const updateData: { staff_id: number; status: string; scheduled_at?: string } = {
          staff_id: staff.id,
          status: 'scheduled'
        };

        // If dropped on a specific date (Weekly View), update the date
        if (date) {
          const newDate = new Date(date);
          const originalTime = new Date(visit.scheduled_at);
          newDate.setHours(originalTime.getHours(), originalTime.getMinutes());
          updateData.scheduled_at = newDate.toISOString();
        }

        await updateVisit(visit.id, updateData);
        
        // Reload data
        await loadScheduleData();
      } catch (err: unknown) {
        console.error('Failed to assign visit:', err);
        alert('割り当てに失敗しました');
      }
    }
  };

  if (loading && visits.length === 0 && staffs.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // Split visits
  const assignedVisits = (viewMode === 'day' ? visits : allWeeklyVisits).filter(v => v.staff_id && v.status !== 'unassigned');
  const unassignedVisits = (viewMode === 'day' ? visits : allWeeklyVisits).filter(v => !v.staff_id || v.status === 'unassigned');

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col overflow-hidden bg-gray-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-20 h-16">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsInboxOpen(!isInboxOpen)}
              className={`p-2 rounded-lg transition-colors ${isInboxOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
              title={isInboxOpen ? "未割当リストを閉じる" : "未割当リストを開く"}
            >
              {isInboxOpen ? <ChevronDoubleLeftIcon className="w-6 h-6" /> : <InboxIcon className="w-6 h-6" />}
            </button>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight hidden md:block">Minori</h1>
            <div className="h-8 w-px bg-gray-200 mx-2"></div>
            <MultiGroupSelector 
              groups={groups} 
              selectedGroupIds={selectedGroupIds} 
              onChange={setSelectedGroupIds} 
            />
          </div>
          
                    <div className="flex items-center space-x-4">
             <div className="flex items-center bg-gray-100 rounded-xl p-1 border border-gray-200 relative">
               <button onClick={handlePrevious} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600">
                 <ChevronLeftIcon className="w-6 h-6" />
               </button>
               
               <div 
                 className="px-4 font-bold text-gray-800 min-w-[160px] text-center text-lg cursor-pointer hover:bg-gray-200 rounded transition-colors select-none flex items-center justify-center"
                 onClick={handleDateClick}
               >
                 {currentDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
               </div>
               
               <input
                 type="date"
                 ref={dateInputRef}
                 className="absolute top-10 left-1/2 transform -translate-x-1/2 opacity-0 w-0 h-0 pointer-events-none"
                 value={currentDate.toISOString().split('T')[0]}
                 onChange={handleDateChange}
               />

               <button onClick={handleNext} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600">
                 <ChevronRightIcon className="w-6 h-6" />
               </button>
             </div>
             <div className="relative">
               <button 
                 onClick={() => setIsMonthlyCalendarOpen(!isMonthlyCalendarOpen)} 
                 className={`p-2 rounded-lg transition-colors ${isMonthlyCalendarOpen ? 'bg-indigo-50 text-indigo-800' : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50'}`}
                 title="月次カレンダー"
               >
                 <CalendarDaysIcon className="w-6 h-6" />
               </button>
               {isMonthlyCalendarOpen && (
                 <MonthlyCalendarView
                   currentDate={currentDate}
                   visits={allWeeklyVisits}
                   onDateClick={(date) => {
                     setCurrentDate(date);
                     setIsMonthlyCalendarOpen(false);
                   }}
                   onClose={() => setIsMonthlyCalendarOpen(false)}
                 />
               )}
             </div>
          </div>

          <div className="flex items-center gap-2">
             <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
               <button
                 onClick={() => setViewMode('patient')}
                 className={`p-2 rounded-md transition-all ${viewMode === 'patient' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                 title="患者カレンダー"
               >
                 <UserGroupIcon className="w-5 h-5" />
               </button>
               <button
                 onClick={() => setViewMode('day')}
                 className={`p-2 rounded-md transition-all ${viewMode === 'day' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                 title="日次タイムライン"
               >
                 <ClockIcon className="w-5 h-5" />
               </button>
             </div>

             <button 
               onClick={handleNewVisitClick}
               className="bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all flex items-center justify-center"
               title="新規訪問"
             >
               <PlusIcon className="w-6 h-6" />
             </button>
          </div>
        </div>

        {/* Main Content (3-pane) */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Pane: Inbox */}
          <div 
            className={`
              flex-shrink-0 bg-white border-r border-gray-200 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out overflow-hidden
              ${isInboxOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 border-none'}
            `}
          >
            <div className="w-80 h-full">
              <UnassignedVisitInbox 
                visits={unassignedVisits} 
                onVisitClick={handleVisitSelect} 
              />
            </div>
          </div>

          {/* Center Pane: Timeline or Weekly View */}
          <div className="flex-1 overflow-hidden relative bg-white">
            {error && (
              <div className="absolute top-0 left-0 right-0 bg-red-50 border-b border-red-200 px-4 py-2 text-red-700 text-sm z-50">
                {error}
              </div>
            )}
            {viewMode === 'patient' ? (
              <PatientCalendarView
                date={currentDate}
                visits={visits}
                groups={groups}
                selectedGroupIds={selectedGroupIds}
                onVisitClick={handleVisitSelect}
                onTimeSlotClick={(hour, laneId) => {
                  const selectedDate = new Date(currentDate);
                  selectedDate.setHours(hour, 0, 0, 0);
                  setNewVisitInitialDate(selectedDate);
                  setNewVisitInitialStaffId(undefined); // Virtual lanes don't map to staff
                  setNewVisitInitialPlanningLaneId(Number(laneId));
                  setIsNewVisitPanelOpen(true);
                  setSelectedVisit(null);
                }}
              />
            ) : (
              <TimelineResourceView
                date={currentDate}
                staffs={staffs}
                groups={groups}
                selectedGroupIds={selectedGroupIds}
                visits={assignedVisits}
                onVisitClick={handleVisitSelect}
                onTimeSlotClick={handleTimeSlotClick}
              />
            )}
          </div>

          {/* Right Pane: Detail (Floating) */}
          <VisitDetailPanel
            visit={selectedVisit}
            staffs={staffs}
            onClose={() => setSelectedVisit(null)}
            onEdit={handleVisitEdit}
            onCancel={handleVisitCancel}
            onComplete={handleVisitComplete}
            onReassign={handleVisitReassign}
            onUpdate={handleVisitUpdate}
            onDelete={handleVisitDelete}
          />

          {/* New Visit Panel */}
          <NewVisitPanel
            isOpen={isNewVisitPanelOpen}
            onClose={() => setIsNewVisitPanelOpen(false)}
            onCreated={handleNewVisitCreated}
            initialDate={newVisitInitialDate}
            initialStaffId={newVisitInitialStaffId}
            initialPlanningLaneId={newVisitInitialPlanningLaneId}
          />

          {/* Monthly Calendar Modal - Removed as it is now a popover */}
        </div>
      </div>
    </DndContext>
  );
}


