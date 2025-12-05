import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  PlusIcon, 
  CalendarDaysIcon,
  ClockIcon,
  CalendarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  fetchWeeklySchedule,
  fetchStaffs,
  fetchGroups,
  fetchPlanningLanes,
  fetchEvents,
  cancelVisit,
  completeVisit,
  updateVisit,
  deleteVisit,
  deleteEvent,
  generateVisitsFromPatterns,
  updateVisitPattern,
  ApiError,
  type Staff,
  type Group,
  type ScheduleVisit,
  type Visit,
  type PlanningLane,
  type VisitPattern,
  type ScheduleEvent,
} from '../api/client';
import { type PatternVisit } from '../components/organisms/PatientCalendarView';
import { Spinner } from '../components/atoms/Spinner';
import { NewPatternPanel } from '../components/organisms/NewPatternPanel';
import { EditPatternPanel } from '../components/organisms/EditPatternPanel';
import { PatternHistoryPanel } from '../components/organisms/PatternHistoryPanel';
import { VisitDetailPanel } from '../components/organisms/VisitDetailPanel';
import { EventDetailPanel } from '../components/organisms/EventDetailPanel';
import { AbsenceDetailPanel } from '../components/organisms/AbsenceDetailPanel';
import { NewSchedulePanel } from '../components/organisms/NewSchedulePanel';
import { TimelineResourceView } from '../components/organisms/TimelineResourceView';
import PatientCalendarView from '../components/organisms/PatientCalendarView';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { MonthlyCalendarView } from '../components/organisms/MonthlyCalendarView';
import { GenerateVisitsPanel } from '../components/organisms/GenerateVisitsPanel';
import { MultiGroupSelector } from '../components/organisms/MultiGroupSelector';
import { useConfirmDialog } from '../contexts/ConfirmDialogContext';

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
    visit_type: sv.visit_type,
    notes: sv.notes,
    created_at: sv.created_at,
    updated_at: sv.updated_at,
    planning_lane_id: sv.planning_lane_id,
  };
}

export function UnifiedSchedulePage() {
  const navigate = useNavigate();
  const { confirm } = useConfirmDialog();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mainTab, setMainTab] = useState<'schedule' | 'pattern'>('schedule');
  const [scheduleViewMode, setScheduleViewMode] = useState<'lane' | 'staff'>('lane');
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(() => {
    // 今日の曜日を初期値にする（日曜=0, 月曜=1, ...）
    return new Date().getDay();
  });
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [, setPlanningLanes] = useState<PlanningLane[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [allWeeklyVisits, setAllWeeklyVisits] = useState<Visit[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // DnD センサー設定：200ms長押しでドラッグ開始（Googleカレンダー風）
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  // New Schedule Panel State (unified for visit/event)
  const [isNewSchedulePanelOpen, setIsNewSchedulePanelOpen] = useState(false);
  const [newScheduleInitialDate, setNewScheduleInitialDate] = useState<Date | undefined>(undefined);
  const [newScheduleInitialStaffId, setNewScheduleInitialStaffId] = useState<number | undefined>(undefined);
  const [newScheduleInitialPlanningLaneId, setNewScheduleInitialPlanningLaneId] = useState<number | undefined>(undefined);
  const [newScheduleInitialTab, setNewScheduleInitialTab] = useState<'visit' | 'event'>('visit');
  
  // New Pattern Panel State
  const [isNewPatternPanelOpen, setIsNewPatternPanelOpen] = useState(false);
  const [newPatternInitialTime, setNewPatternInitialTime] = useState<string>('09:00');
  const [newPatternInitialLaneId, setNewPatternInitialLaneId] = useState<number | undefined>(undefined);
  
  // Edit Pattern Panel State
  const [selectedPattern, setSelectedPattern] = useState<VisitPattern | null>(null);
  const [patternVersion, setPatternVersion] = useState(0); // Increment to trigger reload
  const [isPatternHistoryOpen, setIsPatternHistoryOpen] = useState(false);
  
  const [isMonthlyCalendarOpen, setIsMonthlyCalendarOpen] = useState(false);
  const [isGeneratePanelOpen, setIsGeneratePanelOpen] = useState(false);
  const [masterDataLoaded, setMasterDataLoaded] = useState(false);
  
  // New button dropdown state (for mobile)


  // Load master data
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        console.log('Loading master data...');
        const [groupsData, staffsData, lanesData] = await Promise.all([
          fetchGroups(),
          fetchStaffs({ status: 'active' }),
          fetchPlanningLanes(),
        ]);
        console.log('Master data loaded:', { groups: groupsData.length, staffs: staffsData.length, lanes: lanesData.length });
        setGroups(groupsData);
        setSelectedGroupIds(groupsData.map(g => g.id));
        setStaffs(staffsData);
        setPlanningLanes(lanesData);
        setMasterDataLoaded(true);
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
    if (!masterDataLoaded) {
      console.log('Waiting for master data to load...');
      return;
    }
    
    try {
      console.log('Loading schedule data...', { currentDate });
      setLoading(true);
      setError('');

      // Always fetch weekly data to have context, but we focus on daily view
      // Use currentDate as start date for sliding window
      const startDate = currentDate.toISOString().split('T')[0];
      const endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() + 6);
      const endDateStr = endDate.toISOString().split('T')[0];

      console.log('Fetching weekly schedule for:', startDate);
      const [scheduleData, eventsData] = await Promise.all([
        fetchWeeklySchedule({ start_date: startDate }),
        fetchEvents({ start_date: startDate, end_date: endDateStr }),
      ]);
      
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

      // Filter events for current date
      const todaysEvents = eventsData.filter(e => {
        const eventDate = new Date(e.scheduled_at);
        return eventDate.toDateString() === currentDate.toDateString();
      });

      console.log('Todays visits:', todaysVisits.length, 'Todays events:', todaysEvents.length);
      setVisits(todaysVisits);
      setEvents(todaysEvents);
    } catch (err) {
      console.error('Failed to load schedule:', err);
      setError(err instanceof Error ? err.message : 'スケジュールの取得に失敗しました');
    } finally {
      console.log('Loading complete');
      setLoading(false);
    }
  }, [currentDate, staffs, masterDataLoaded]);

  useEffect(() => {
    if (masterDataLoaded) {
      loadScheduleData();
    }
  }, [loadScheduleData, masterDataLoaded]);

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
    // 月次カレンダーを表示
    setIsMonthlyCalendarOpen(true);
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

  const handleVisitUpdate = async (visitId: number, data: { 
    staff_id?: number | null; 
    scheduled_at?: string; 
    status?: string; 
    lock_version?: number;
    duration?: number;
    notes?: string;
    planning_lane_id?: number | null;
    skip_patient_conflict_check?: boolean;
  }) => {
    try {
      await updateVisit(visitId, data);
      await loadScheduleData();
      setSelectedVisit(null);
    } catch (err: unknown) {
      console.error('Failed to update visit:', err);
      
      // 競合エラーのハンドリング
      if (err instanceof ApiError && err.isConflict()) {
        // 患者重複警告の場合は確認ダイアログを表示
        if (err.isPatientDoubleBookingWarning()) {
          const patientConfirmed = await confirm({
            title: '患者の訪問が重複しています',
            message: `${err.message}\n\n操作に誤りがない場合は「続行」を押してください。`,
            variant: 'warning',
            confirmLabel: '続行',
            cancelLabel: 'キャンセル',
          });
          if (patientConfirmed) {
            // 強制登録を再実行
            await handleVisitUpdate(visitId, { ...data, skip_patient_conflict_check: true });
            return;
          }
        } else if (err.isDoubleBooking()) {
          alert(`予約の競合が発生しました: ${err.message}`);
        } else if (err.isStaleObject()) {
          const reload = await confirm({
            title: 'データが更新されています',
            message: `${err.message}\n\nデータを再読み込みしますか？`,
            variant: 'info',
            confirmLabel: '再読み込み',
            cancelLabel: 'キャンセル',
          });
          if (reload) {
            await loadScheduleData();
          }
        } else {
          alert(err.message);
        }
      } else {
        alert('更新に失敗しました');
      }
      throw err;
    }
  };

  const handleVisitDelete = async (visitId: number) => {
    // 注意: 確認ダイアログはVisitDetailPanel側で表示済み
    try {
      await deleteVisit(visitId);
      await loadScheduleData();
      setSelectedVisit(null);
    } catch (err: unknown) {
      console.error('Failed to delete visit:', err);
      throw err; // エラーを再スローして呼び出し元でハンドリング
    }
  };

  // Event handlers
  const handleEventSelect = (event: ScheduleEvent) => {
    setIsNewSchedulePanelOpen(false);
    setSelectedVisit(null);
    setSelectedEvent(event);
  };

  const handleEventDelete = async (eventId: number) => {
    try {
      await deleteEvent(eventId);
      await loadScheduleData();
      setSelectedEvent(null);
    } catch (err: unknown) {
      console.error('Failed to delete event:', err);
      throw err;
    }
  };

  // Open unified schedule panel with visit tab (from header button)
  const handleNewVisitClick = () => {
    setSelectedVisit(null);
    setSelectedEvent(null);
    setNewScheduleInitialDate(currentDate);
    setNewScheduleInitialStaffId(undefined);
    setNewScheduleInitialPlanningLaneId(undefined);
    setNewScheduleInitialTab('visit');
    setIsNewSchedulePanelOpen(true);
  };

  // Staff view: time slot click -> open panel with staff pre-selected
  const handleTimeSlotClick = (staffId: number, time: Date) => {
    setSelectedVisit(null);
    setSelectedEvent(null);
    setNewScheduleInitialDate(time);
    setNewScheduleInitialStaffId(staffId);
    setNewScheduleInitialPlanningLaneId(undefined);
    setNewScheduleInitialTab('visit');
    setIsNewSchedulePanelOpen(true);
  };

  // Lane view: time slot click -> open panel with lane pre-selected
  const handleLaneTimeSlotClick = (hour: number, laneId: number) => {
    setSelectedVisit(null);
    setSelectedEvent(null);
    const selectedDate = new Date(currentDate);
    selectedDate.setHours(hour, 0, 0, 0);
    setNewScheduleInitialDate(selectedDate);
    setNewScheduleInitialStaffId(undefined);
    setNewScheduleInitialPlanningLaneId(laneId);
    setNewScheduleInitialTab('visit');
    setIsNewSchedulePanelOpen(true);
  };

  const handleVisitSelect = (visit: Visit) => {
    setIsNewSchedulePanelOpen(false);
    setSelectedVisit(visit);
  };

  const handleNewScheduleCreated = async () => {
    await loadScheduleData();
  };

  // パネルから呼び出される生成ハンドラ
  const handleGenerateVisits = async (startDate: string, endDate: string, dayOfWeeks: number[]) => {
    try {
      const result = await generateVisitsFromPatterns(startDate, endDate, dayOfWeeks);
      alert(`${result.count}件の訪問予定を作成しました`);
      
      setMainTab('schedule');
      setCurrentDate(new Date(startDate));
      await loadScheduleData();
    } catch (err) {
      console.error('Failed to generate visits:', err);
      if (err instanceof ApiError) {
        alert(`訪問予定の作成に失敗しました: ${err.message}`);
      } else {
        alert('訪問予定の作成に失敗しました');
      }
      throw err;
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const visit = active.data.current?.visit as Visit;
    
    // Handle drop on Timeline (Staff) or Weekly (Staff + Date)
    const staff = over.data.current?.staff as Staff;
    const date = over.data.current?.date as Date | undefined;

    // Handle drop on Lane (PatientCalendarView)
    const laneId = over.data.current?.laneId as number | undefined;
    const hour = over.data.current?.hour as number | undefined;

    // パターンモードの場合はパターン更新処理
    const patternVisit = visit as PatternVisit;
    if (patternVisit?.__isPattern && patternVisit.__pattern && laneId !== undefined && hour !== undefined) {
      const pattern = patternVisit.__pattern;
      const newStartTime = `${String(hour).padStart(2, '0')}:00`;
      
      // 移動先の情報を組み立て
      let destinationInfo = `時刻: ${hour}:00`;
      if (laneId !== pattern.planning_lane_id) {
        destinationInfo += '\nレーン変更あり';
      }
      
      // 移動前の確認ダイアログを表示
      const moveConfirmed = await confirm({
        title: 'パターンの移動',
        message: `「${patternVisit.patient.name}」のパターンを移動しますか？\n\n${destinationInfo}`,
        variant: 'info',
        confirmLabel: '移動',
        cancelLabel: 'キャンセル',
      });

      if (!moveConfirmed) {
        return;
      }

      try {
        await updateVisitPattern(pattern.id, {
          planning_lane_id: laneId,
          start_time: newStartTime,
        });
        
        // パターンデータを再読み込み
        setPatternVersion(v => v + 1);
      } catch (err: unknown) {
        console.error('Failed to update pattern:', err);
        if (err instanceof ApiError) {
          alert(`パターンの更新に失敗しました: ${err.message}`);
        } else {
          alert('パターンの更新に失敗しました');
        }
      }
      return;
    }

    if (visit) {
      const updateData: {
        lock_version?: number;
        staff_id?: number | null;
        status?: string;
        scheduled_at?: string;
        planning_lane_id?: number;
        skip_patient_conflict_check?: boolean;
      } = {
        lock_version: visit.lock_version,
      };

      // 移動先の情報を組み立て
      let destinationInfo = '';
      
      try {
        if (staff) {
          updateData.staff_id = staff.id;
          updateData.status = 'scheduled';
          destinationInfo = `担当: ${staff.name}`;

          // If dropped on a specific date (Weekly View), update the date
          if (date) {
            const newDate = new Date(date);
            const originalTime = new Date(visit.scheduled_at);
            newDate.setHours(originalTime.getHours(), originalTime.getMinutes());
            updateData.scheduled_at = newDate.toISOString();
            destinationInfo += `\n日付: ${newDate.toLocaleDateString('ja-JP')}`;
          }
        } else if (laneId !== undefined && hour !== undefined) {
          // Lane drop - preserve original time, only change lane
          updateData.planning_lane_id = laneId;
          
          // 元の時刻を保持（レーン移動だけの場合は scheduled_at の更新は不要）
          // ただし、時間帯が大きく異なる場合のみ時刻を変更
          const originalTime = new Date(visit.scheduled_at);
          const originalHour = originalTime.getHours();
          
          // 移動先の時間帯が元の時間帯と異なる場合のみ時刻を更新
          if (Math.abs(originalHour - hour) > 1) {
            const newDate = new Date(currentDate);
            newDate.setHours(hour, originalTime.getMinutes(), 0, 0);
            updateData.scheduled_at = newDate.toISOString();
            destinationInfo = `時刻: ${hour}:${String(originalTime.getMinutes()).padStart(2, '0')}`;
          } else {
            // 同じ時間帯内での移動の場合、レーンのみ変更
            destinationInfo = '（レーンのみ変更）';
          }
        } else {
          return;
        }

        // 移動前の確認ダイアログを表示
        const moveConfirmed = await confirm({
          title: '訪問の移動',
          message: `「${visit.patient.name}」の訪問を移動しますか？\n\n${destinationInfo}`,
          variant: 'info',
          confirmLabel: '移動',
          cancelLabel: 'キャンセル',
        });

        if (!moveConfirmed) {
          return; // キャンセルされた場合は何もしない
        }

        await updateVisit(visit.id, updateData);
        
        // Reload data
        await loadScheduleData();
      } catch (err: unknown) {
        console.error('Failed to assign visit:', err);
        
        // 競合エラーのハンドリング
        if (err instanceof ApiError && err.isConflict()) {
          console.log('Conflict error details:', { errorType: err.errorType, isPatientWarning: err.isPatientDoubleBookingWarning() });
          if (err.isPatientDoubleBookingWarning()) {
            // 患者重複警告の場合は確認ダイアログを表示
            const patientConfirmed = await confirm({
              title: '患者の訪問が重複しています',
              message: `${err.message}\n\n操作に誤りがない場合は「続行」を押してください。`,
              variant: 'warning',
              confirmLabel: '続行',
              cancelLabel: 'キャンセル',
            });
            if (patientConfirmed) {
              try {
                await updateVisit(visit.id, { ...updateData, skip_patient_conflict_check: true });
                await loadScheduleData();
              } catch (retryErr) {
                console.error('Failed to force update visit:', retryErr);
                alert(retryErr instanceof ApiError ? retryErr.message : '訪問の更新に失敗しました');
              }
            }
          } else if (err.isDoubleBooking()) {
            alert(`予約の競合が発生しました: ${err.message}`);
          } else if (err.isStaleObject()) {
            const reload = await confirm({
              title: 'データが更新されています',
              message: `${err.message}\n\nデータを再読み込みしますか？`,
              variant: 'info',
              confirmLabel: '再読み込み',
              cancelLabel: 'キャンセル',
            });
            if (reload) {
              await loadScheduleData();
            }
          } else {
            alert(err.message);
          }
        } else {
          alert('割り当てに失敗しました');
        }
      }
    }
  };

  // Show loading only during initial master data load
  if (!masterDataLoaded && loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // Filter visits
  const baseVisits = scheduleViewMode === 'staff' ? visits : allWeeklyVisits;
  const assignedVisits = baseVisits.filter(v => v.staff_id && v.status !== 'unassigned');

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col overflow-hidden bg-gray-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between shadow-sm z-20 min-h-[56px] sm:h-16">
          {/* Left Section */}
          <div className="flex items-center space-x-1 sm:space-x-4">
            <h1 className="text-lg sm:text-xl font-bold text-gray-800 tracking-tight hidden lg:block">Minori</h1>
            <div className="h-8 w-px bg-gray-200 mx-1 sm:mx-2 hidden sm:block"></div>
            {/* Desktop: full selector, Mobile: compact icon mode */}
            <MultiGroupSelector 
              groups={groups} 
              selectedGroupIds={selectedGroupIds} 
              onChange={setSelectedGroupIds}
              compact
            />
          </div>
          
          {/* Center Section - Main Tab & Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Main Tab: パターン / スケジュール (左から右へ流れる順序) */}
            <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              <button
                onClick={() => setMainTab('pattern')}
                className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-1 ${
                  mainTab === 'pattern' ? 'bg-white shadow text-emerald-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ArrowPathIcon className="w-4 h-4" />
                <span className="hidden sm:inline">パターン</span>
              </button>
              <button
                onClick={() => setMainTab('schedule')}
                className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-1 ${
                  mainTab === 'schedule' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                <span className="hidden sm:inline">スケジュール</span>
              </button>
            </div>

            {/* Date Navigation (schedule) or Day of Week Selector (pattern) */}
            {mainTab === 'schedule' ? (
              <div className="flex items-center bg-gray-100 rounded-lg sm:rounded-xl p-0.5 sm:p-1 border border-gray-200 relative">
                <button onClick={handlePrevious} className="p-1.5 sm:p-2 hover:bg-white hover:shadow-sm rounded-md sm:rounded-lg transition-all text-gray-600">
                  <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              
                <div 
                  className="px-1 sm:px-4 font-bold text-gray-800 text-center text-sm sm:text-lg cursor-pointer hover:bg-gray-200 rounded transition-colors select-none flex items-center justify-center gap-1 whitespace-nowrap"
                  onClick={handleDateClick}
                >
                  <CalendarDaysIcon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span className="sm:hidden">
                    {`${currentDate.getMonth() + 1}/${currentDate.getDate()}(${['日','月','火','水','木','金','土'][currentDate.getDay()]})`}
                  </span>
                  <span className="hidden sm:inline">
                    {currentDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
                  </span>
                </div>

                <button onClick={handleNext} className="p-1.5 sm:p-2 hover:bg-white hover:shadow-sm rounded-md sm:rounded-lg transition-all text-gray-600">
                  <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                {/* Monthly Calendar Popup */}
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
            ) : (
              /* Day of Week Selector for pattern mode */
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="flex items-center bg-emerald-50 rounded-lg p-0.5 border border-emerald-200">
                  {['月', '火', '水', '木', '金', '土', '日'].map((dayName, index) => {
                    // 月=1, 火=2, ..., 土=6, 日=0
                    const dayOfWeek = index < 6 ? index + 1 : 0;
                    return (
                      <button
                        key={dayOfWeek}
                        onClick={() => setSelectedDayOfWeek(dayOfWeek)}
                        className={`px-1.5 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm font-medium transition-all ${
                          selectedDayOfWeek === dayOfWeek
                            ? 'bg-white shadow text-emerald-700'
                            : 'text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {dayName}
                      </button>
                    );
                  })}
                </div>
                {/* Generate Visits Button */}
                <button
                  onClick={() => setIsGeneratePanelOpen(true)}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1"
                  title="パターンをスケジュールに反映"
                >
                  <CalendarDaysIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">反映</span>
                </button>
                {/* Pattern History Button */}
                <button
                  onClick={() => setIsPatternHistoryOpen(true)}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors shadow-sm flex items-center gap-1 border border-gray-300"
                  title="パターン変更履歴"
                >
                  <ClockIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">履歴</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Section - View toggle (schedule mode) & New button */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* View toggle - schedule mode only */}
            {mainTab === 'schedule' && (
              <div className="flex bg-gray-100 p-0.5 sm:p-1 rounded-lg border border-gray-200">
                <button
                  onClick={() => setScheduleViewMode('lane')}
                  className={`p-1.5 sm:p-2 rounded-md transition-all ${scheduleViewMode === 'lane' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  title="レーンビュー"
                >
                  <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => setScheduleViewMode('staff')}
                  className={`p-1.5 sm:p-2 rounded-md transition-all ${scheduleViewMode === 'staff' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  title="スタッフビュー"
                >
                  <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            )}

            {/* Add button - directly opens panel */}
            <button 
              onClick={handleNewVisitClick}
              className="bg-indigo-600 text-white p-2 sm:p-3 rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all flex items-center justify-center"
              title="新規作成"
            >
              <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Main View */}
          <div className="flex-1 overflow-hidden relative bg-white">
            {error && (
              <div className="absolute top-0 left-0 right-0 bg-red-50 border-b border-red-200 px-4 py-2 text-red-700 text-sm z-50">
                {error}
              </div>
            )}
            
            {/* Pattern mode: PatientCalendarView with pattern data */}
            {mainTab === 'pattern' && (
              <PatientCalendarView
                date={currentDate}
                visits={[]}
                groups={groups}
                selectedGroupIds={selectedGroupIds}
                onVisitClick={() => {}}
                onPatternClick={(pattern) => setSelectedPattern(pattern)}
                onTimeSlotClick={(hour, laneId) => {
                  setNewPatternInitialTime(`${String(hour).padStart(2, '0')}:00`);
                  setNewPatternInitialLaneId(Number(laneId));
                  setIsNewPatternPanelOpen(true);
                }}
                dataMode="pattern"
                selectedDayOfWeek={selectedDayOfWeek}
                patternVersion={patternVersion}
              />
            )}

            {/* Schedule mode: Lane view */}
            {mainTab === 'schedule' && scheduleViewMode === 'lane' && (
              <PatientCalendarView
                date={currentDate}
                visits={visits}
                events={events}
                groups={groups}
                selectedGroupIds={selectedGroupIds}
                onVisitClick={handleVisitSelect}
                onEventClick={handleEventSelect}
                onPatternClick={() => {}}
                onTimeSlotClick={(hour, laneId) => handleLaneTimeSlotClick(hour, Number(laneId))}
                dataMode="actual"
                selectedDayOfWeek={selectedDayOfWeek}
                patternVersion={0}
              />
            )}

            {/* Schedule mode: Staff view */}
            {mainTab === 'schedule' && scheduleViewMode === 'staff' && (
              <TimelineResourceView
                date={currentDate}
                staffs={staffs}
                groups={groups}
                selectedGroupIds={selectedGroupIds}
                visits={assignedVisits}
                events={events}
                onVisitClick={handleVisitSelect}
                onEventClick={handleEventSelect}
                onTimeSlotClick={handleTimeSlotClick}
              />
            )}
          </div>

          {/* Right Pane: Detail (Floating) */}
          <VisitDetailPanel
            visit={selectedVisit}
            staffs={staffs}
            groups={groups}
            onClose={() => setSelectedVisit(null)}
            onEdit={handleVisitEdit}
            onCancel={handleVisitCancel}
            onComplete={handleVisitComplete}
            onReassign={handleVisitReassign}
            onUpdate={handleVisitUpdate}
            onDelete={handleVisitDelete}
          />

          {/* New Pattern Panel */}
          <NewPatternPanel
            isOpen={isNewPatternPanelOpen}
            onClose={() => setIsNewPatternPanelOpen(false)}
            onCreated={() => {
              // Trigger pattern reload
              setPatternVersion(v => v + 1);
            }}
            initialDayOfWeek={selectedDayOfWeek}
            initialTime={newPatternInitialTime}
            initialPlanningLaneId={newPatternInitialLaneId}
            groups={groups}
          />

          {/* Edit Pattern Panel */}
          <EditPatternPanel
            isOpen={!!selectedPattern}
            pattern={selectedPattern}
            onClose={() => setSelectedPattern(null)}
            onUpdated={() => {
              setPatternVersion(v => v + 1);
            }}
            onDeleted={() => {
              setPatternVersion(v => v + 1);
            }}
            groups={groups}
          />

          {/* Generate Visits Panel */}
          <GenerateVisitsPanel
            isOpen={isGeneratePanelOpen}
            onClose={() => setIsGeneratePanelOpen(false)}
            onGenerate={handleGenerateVisits}
          />

          {/* Pattern History Panel */}
          <PatternHistoryPanel
            isOpen={isPatternHistoryOpen}
            onClose={() => setIsPatternHistoryOpen(false)}
          />

          {/* Event Detail Panel */}
          {selectedEvent && selectedEvent.event_type !== 'absence' && (
            <EventDetailPanel
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
              onUpdate={loadScheduleData}
              onDelete={handleEventDelete}
            />
          )}

          {/* Absence Detail Panel */}
          {selectedEvent && selectedEvent.event_type === 'absence' && (
            <AbsenceDetailPanel
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
              onUpdate={loadScheduleData}
              onDelete={handleEventDelete}
            />
          )}

          {/* Unified New Schedule Panel (Visit/Event tabs) */}
          <NewSchedulePanel
            isOpen={isNewSchedulePanelOpen}
            onClose={() => setIsNewSchedulePanelOpen(false)}
            onCreated={handleNewScheduleCreated}
            initialDate={newScheduleInitialDate}
            initialStaffId={newScheduleInitialStaffId}
            initialPlanningLaneId={newScheduleInitialPlanningLaneId}
            initialTab={newScheduleInitialTab}
          />

          {/* Monthly Calendar Modal - Removed as it is now a popover */}
        </div>
      </div>
    </DndContext>
  );
}



