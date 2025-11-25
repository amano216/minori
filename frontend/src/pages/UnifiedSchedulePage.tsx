import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchWeeklySchedule,
  fetchStaffs,
  fetchGroups,
  fetchPatients,
  cancelVisit,
  completeVisit,
  updateVisit,
  type Staff,
  type Group,
  type Patient,
  type ScheduleVisit,
} from '../api/client';
import { Spinner } from '../components/atoms/Spinner';
import {
  ScheduleFilterSidebar,
  type ScheduleFilters,
} from '../components/organisms/ScheduleFilterSidebar';
import {
  ScheduleHeader,
  type ViewMode,
} from '../components/organisms/ScheduleHeader';
import { QuickActionToolbar } from '../components/organisms/QuickActionToolbar';
import { WeeklyCalendarView } from '../components/organisms/WeeklyCalendarView';
import { DailyCalendarView } from '../components/organisms/DailyCalendarView';
import { MonthlyCalendarView } from '../components/organisms/MonthlyCalendarView';
import { VisitDetailPanel } from '../components/organisms/VisitDetailPanel';

interface Visit {
  id: number;
  patient_id: number;
  patient_name: string;
  staff_id?: number;
  staff_name?: string;
  scheduled_at: string;
  duration: number;
  status: string;
  visit_type?: string;
  notes?: string;
  address?: string;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function convertScheduleVisitToVisit(sv: ScheduleVisit): Visit {
  return {
    id: sv.id,
    patient_id: sv.patient_id,
    patient_name: sv.patient.name,
    staff_id: sv.staff_id ?? undefined,
    staff_name: undefined, // Will be enriched later
    scheduled_at: sv.scheduled_at,
    duration: sv.duration,
    status: sv.status,
    visit_type: undefined,
    notes: sv.notes,
    address: sv.patient.address,
  };
}

export function UnifiedSchedulePage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filters, setFilters] = useState<ScheduleFilters>({
    groupIds: [],
    staffIds: [],
    patientIds: [],
  });
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);

  const [groups, setGroups] = useState<Group[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load master data
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [groupsData, staffsData, patientsData] = await Promise.all([
          fetchGroups({ status: 'active' }),
          fetchStaffs({ status: 'active' }),
          fetchPatients({ status: 'active' }),
        ]);
        setGroups(groupsData);
        setStaffs(staffsData);
        setPatients(patientsData);
      } catch (err) {
        console.error('Failed to load master data:', err);
      }
    };
    loadMasterData();
  }, []);

  // Load schedule data
  const loadScheduleData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      let startDate: string;

      if (viewMode === 'day') {
        const dateStr = currentDate.toISOString().split('T')[0];
        startDate = dateStr;
      } else if (viewMode === 'week') {
        const weekStart = getWeekStart(currentDate);
        startDate = weekStart.toISOString().split('T')[0];
      } else {
        // month
        const monthStart = getMonthStart(currentDate);
        startDate = monthStart.toISOString().split('T')[0];
      }

      const scheduleData = await fetchWeeklySchedule({ start_date: startDate });

      // Convert ScheduleVisit[] to Visit[]
      const allVisits: Visit[] = [];
      Object.values(scheduleData.days).forEach((dayVisits) => {
        dayVisits.forEach((sv) => {
          const visit = convertScheduleVisitToVisit(sv);
          // Enrich with staff name
          if (visit.staff_id) {
            const staff = staffs.find((s) => s.id === visit.staff_id);
            if (staff) {
              visit.staff_name = staff.name;
            }
          }
          allVisits.push(visit);
        });
      });

      // Apply filters
      let filteredVisits = allVisits;
      
      if (filters.staffIds.length > 0) {
        filteredVisits = filteredVisits.filter((v) =>
          v.staff_id ? filters.staffIds.includes(v.staff_id) : false
        );
      }
      
      if (filters.patientIds.length > 0) {
        filteredVisits = filteredVisits.filter((v) =>
          filters.patientIds.includes(v.patient_id)
        );
      }

      setVisits(filteredVisits);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'スケジュールの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode, filters, staffs]);

  useEffect(() => {
    if (staffs.length > 0) {
      loadScheduleData();
    }
  }, [loadScheduleData, staffs]);

  const handlePrevious = () => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, -1));
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(addMonths(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleSuddenLeave = async (staffId: number) => {
    try {
      // Find all scheduled visits for this staff from today onwards
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const affectedVisits = visits.filter(
        (v) =>
          v.staff_id === staffId &&
          v.status === 'scheduled' &&
          new Date(v.scheduled_at) >= today
      );

      // Reassign all to unassigned
      await Promise.all(
        affectedVisits.map((v) =>
          updateVisit(v.id, { staff_id: null, status: 'unassigned' })
        )
      );

      alert(`${affectedVisits.length}件の訪問を未割当にしました`);
      await loadScheduleData();
    } catch (err) {
      console.error('Failed to handle sudden leave:', err);
      throw err;
    }
  };

  const handleVisitCancel = async (visitId: number) => {
    try {
      await cancelVisit(visitId);
      await loadScheduleData();
      setSelectedVisit(null);
    } catch (err) {
      alert('キャンセルに失敗しました');
    }
  };

  const handleVisitComplete = async (visitId: number) => {
    try {
      await completeVisit(visitId);
      await loadScheduleData();
      setSelectedVisit(null);
    } catch (err) {
      alert('完了処理に失敗しました');
    }
  };

  const handleVisitEdit = (visitId: number) => {
    navigate(`/schedule/visits/${visitId}/edit`);
  };

  const handleVisitReassign = (_visitId: number) => {
    // TODO: Open reassign modal
    alert('再割当機能は実装予定です');
  };

  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setViewMode('day');
  };

  if (loading && visits.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Quick Action Toolbar */}
      <QuickActionToolbar
        staffs={staffs}
        onSuddenLeave={handleSuddenLeave}
      />

      {/* Schedule Header */}
      <ScheduleHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currentDate={currentDate}
        onPreviousClick={handlePrevious}
        onNextClick={handleNext}
        onTodayClick={handleToday}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Filter Sidebar */}
        <ScheduleFilterSidebar
          groups={groups}
          staffs={staffs}
          patients={patients}
          filters={filters}
          onFiltersChange={setFilters}
          isCollapsed={isFilterCollapsed}
          onToggleCollapse={() => setIsFilterCollapsed(!isFilterCollapsed)}
        />

        {/* Calendar View */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {error && (
            <div className="bg-red-50 border-b border-red-200 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          {viewMode === 'week' && (
            <WeeklyCalendarView
              visits={visits}
              weekStart={getWeekStart(currentDate)}
              onVisitClick={setSelectedVisit}
            />
          )}

          {viewMode === 'day' && (
            <DailyCalendarView
              visits={visits}
              date={currentDate}
              onVisitClick={setSelectedVisit}
            />
          )}

          {viewMode === 'month' && (
            <MonthlyCalendarView
              visits={visits}
              month={currentDate}
              onVisitClick={setSelectedVisit}
              onDayClick={handleDayClick}
            />
          )}
        </div>
      </div>

      {/* Visit Detail Panel */}
      <VisitDetailPanel
        visit={selectedVisit}
        onClose={() => setSelectedVisit(null)}
        onEdit={handleVisitEdit}
        onCancel={handleVisitCancel}
        onComplete={handleVisitComplete}
        onReassign={handleVisitReassign}
      />
    </div>
  );
}
