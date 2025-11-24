import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchWeeklySchedule,
  fetchScheduleSummary,
  fetchStaffs,
  type WeeklySchedule,
  type ScheduleSummary,
  type ScheduleVisit,
  type Staff,
} from '../api/client';

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'status-scheduled',
  in_progress: 'status-in-progress',
  completed: 'status-completed',
  cancelled: 'status-cancelled',
  unassigned: 'status-unassigned',
};

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}(${DAY_NAMES[date.getDay()]})`;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function addDays(dateString: string, days: number): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export function SchedulePage() {
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [summary, setSummary] = useState<ScheduleSummary | null>(null);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [selectedStaffId, setSelectedStaffId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const params: { start_date?: string; staff_id?: number } = { start_date: weekStart };
      if (selectedStaffId) params.staff_id = selectedStaffId;

      const [scheduleData, summaryData, staffsData] = await Promise.all([
        fetchWeeklySchedule(params),
        fetchScheduleSummary({ start_date: weekStart, end_date: addDays(weekStart, 6) }),
        fetchStaffs({ status: 'active' }),
      ]);
      setSchedule(scheduleData);
      setSummary(summaryData);
      setStaffs(staffsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'スケジュールの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [weekStart, selectedStaffId]);

  const goToPreviousWeek = () => {
    setWeekStart(addDays(weekStart, -7));
  };

  const goToNextWeek = () => {
    setWeekStart(addDays(weekStart, 7));
  };

  const goToToday = () => {
    setWeekStart(getWeekStart(new Date()));
  };

  if (loading) return <div className="loading">読み込み中...</div>;

  return (
    <div className="schedule-page">
      <div className="page-header">
        <h1>週間スケジュール</h1>
        <div className="header-actions">
          <Link to="/schedule" className="btn">
            日別表示
          </Link>
          <Link to="/visits/new" className="btn btn-primary">
            訪問予定を追加
          </Link>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Summary Cards */}
      {summary && (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-value">{summary.total_visits}</div>
            <div className="summary-label">総訪問数</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{summary.by_status.scheduled}</div>
            <div className="summary-label">予定</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{summary.by_status.completed}</div>
            <div className="summary-label">完了</div>
          </div>
          <div className="summary-card warning">
            <div className="summary-value">{summary.unassigned_visits}</div>
            <div className="summary-label">未割当</div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="schedule-controls">
        <div className="week-nav">
          <button onClick={goToPreviousWeek} className="btn btn-small">
            &lt; 前週
          </button>
          <button onClick={goToToday} className="btn btn-small">
            今週
          </button>
          <button onClick={goToNextWeek} className="btn btn-small">
            次週 &gt;
          </button>
        </div>
        <div className="week-display">
          {schedule && (
            <span>
              {formatDate(schedule.start_date)} 〜 {formatDate(schedule.end_date)}
            </span>
          )}
        </div>
        <div className="staff-filter">
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value ? Number(e.target.value) : '')}
            className="filter-select"
          >
            <option value="">全スタッフ</option>
            {staffs.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Weekly Calendar */}
      {schedule && (
        <div className="weekly-calendar">
          {Object.entries(schedule.days).map(([date, visits]) => (
            <div key={date} className="day-column">
              <div className="day-header">
                <span className="day-name">{formatDate(date)}</span>
                <span className="visit-count">{visits.length}件</span>
              </div>
              <div className="day-visits">
                {visits.length === 0 ? (
                  <div className="no-visits">予定なし</div>
                ) : (
                  visits.map((visit: ScheduleVisit) => (
                    <Link
                      key={visit.id}
                      to={`/visits/${visit.id}`}
                      className={`visit-card ${STATUS_COLORS[visit.status]}`}
                    >
                      <div className="visit-time">{formatTime(visit.scheduled_at)}</div>
                      <div className="visit-patient">{visit.patient?.name || '-'}</div>
                      <div className="visit-staff">{visit.staff?.name || '未割当'}</div>
                      <div className="visit-duration">{visit.duration}分</div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="back-link">
        <Link to="/visits">訪問予定一覧へ</Link>
      </div>
    </div>
  );
}
