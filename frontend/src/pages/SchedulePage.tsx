import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  fetchWeeklySchedule,
  fetchScheduleSummary,
  fetchStaffs,
  type WeeklySchedule,
  type ScheduleSummary,
  type ScheduleVisit,
  type Staff,
} from '../api/client';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { Spinner } from '../components/atoms/Spinner';
import { Card } from '../components/molecules/Card';
import { PageHeader } from '../components/templates/ListLayout';

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-primary-50 border-l-4 border-main text-main',
  in_progress: 'bg-warning-50 border-l-4 border-warning text-warning-600',
  completed: 'bg-success-50 border-l-4 border-success text-success-600',
  cancelled: 'bg-danger-50 border-l-4 border-danger text-danger',
  unassigned: 'bg-secondary-100 border-l-4 border-secondary-400 text-text-grey',
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
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function addDays(dateString: string, days: number): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export function SchedulePage() {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [summary, setSummary] = useState<ScheduleSummary | null>(null);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [selectedStaffId, setSelectedStaffId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
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
  }, [weekStart, selectedStaffId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const goToPreviousWeek = () => {
    setWeekStart(addDays(weekStart, -7));
  };

  const goToNextWeek = () => {
    setWeekStart(addDays(weekStart, 7));
  };

  const goToToday = () => {
    setWeekStart(getWeekStart(new Date()));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="週間スケジュール"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/gantt')}>
              ガントチャート
            </Button>
            <Button variant="primary" onClick={() => navigate('/visits/new')}>
              訪問予定を追加
            </Button>
          </div>
        }
      />

      {error && (
        <div className="bg-danger-100 border border-danger-300 text-danger rounded-md p-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="text-center">
            <div className="text-3xl font-bold text-text-black">{summary.total_visits}</div>
            <div className="text-sm text-text-grey">総訪問数</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-main">{summary.by_status.scheduled}</div>
            <div className="text-sm text-text-grey">予定</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-success">{summary.by_status.completed}</div>
            <div className="text-sm text-text-grey">完了</div>
          </Card>
          <Card className="text-center bg-warning-50">
            <div className="text-3xl font-bold text-warning-600">{summary.unassigned_visits}</div>
            <div className="text-sm text-text-grey">未割当</div>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={goToPreviousWeek}>
            &lt; 前週
          </Button>
          <Button variant="secondary" size="sm" onClick={goToToday}>
            今週
          </Button>
          <Button variant="secondary" size="sm" onClick={goToNextWeek}>
            次週 &gt;
          </Button>
        </div>
        <div className="text-lg font-semibold text-text-black">
          {schedule && (
            <span>
              {formatDate(schedule.start_date)} 〜 {formatDate(schedule.end_date)}
            </span>
          )}
        </div>
        <select
          value={selectedStaffId}
          onChange={(e) => setSelectedStaffId(e.target.value ? Number(e.target.value) : '')}
          className="px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main"
        >
          <option value="">全スタッフ</option>
          {staffs.map((staff) => (
            <option key={staff.id} value={staff.id}>
              {staff.name}
            </option>
          ))}
        </select>
      </div>

      {/* Weekly Calendar */}
      {schedule && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          {Object.entries(schedule.days).map(([date, visits]) => (
            <Card key={date} className="p-0 overflow-hidden">
              <div className="bg-bg-base px-3 py-2 border-b border-border flex justify-between items-center">
                <span className="font-semibold text-text-black">{formatDate(date)}</span>
                <Badge variant={visits.length > 0 ? 'primary' : 'default'}>{visits.length}件</Badge>
              </div>
              <div className="p-2 min-h-[150px] space-y-2">
                {visits.length === 0 ? (
                  <div className="text-center text-text-grey text-sm py-4">予定なし</div>
                ) : (
                  visits.map((visit: ScheduleVisit) => (
                    <Link
                      key={visit.id}
                      to={`/visits/${visit.id}`}
                      className={`block p-2 rounded text-sm ${STATUS_COLORS[visit.status]} hover:opacity-80 transition-opacity`}
                    >
                      <div className="font-semibold">{formatTime(visit.scheduled_at)}</div>
                      <div className="truncate">{visit.patient?.name || '-'}</div>
                      <div className="text-xs opacity-80">
                        {visit.staff?.name || '未割当'} / {visit.duration}分
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Link to="/visits" className="text-main hover:underline text-sm">
          訪問予定一覧へ
        </Link>
      </div>
    </>
  );
}
