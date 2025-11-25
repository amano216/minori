import { useMemo } from 'react';
import { Badge } from '../atoms/Badge';

interface Visit {
  id: number;
  patient_id: number;
  patient_name: string;
  staff_id?: number;
  staff_name?: string;
  scheduled_at: string;
  duration: number;
  status: string;
}

interface WeeklyCalendarViewProps {
  visits: Visit[];
  weekStart: Date;
  onVisitClick: (visit: Visit) => void;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-primary-50 border-l-4 border-main text-main',
  in_progress: 'bg-warning-50 border-l-4 border-warning text-warning-600',
  completed: 'bg-success-50 border-l-4 border-success text-success-600',
  cancelled: 'bg-danger-50 border-l-4 border-danger text-danger',
  unassigned: 'bg-secondary-100 border-l-4 border-secondary-400 text-text-grey',
};

const DAY_NAMES = ['月', '火', '水', '木', '金', '土', '日'];

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

function getWeekDays(weekStart: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    days.push(day);
  }
  return days;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function WeeklyCalendarView({
  visits,
  weekStart,
  onVisitClick,
}: WeeklyCalendarViewProps) {
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  
  const visitsByDay = useMemo(() => {
    const grouped = new Map<string, Visit[]>();
    weekDays.forEach((day) => {
      const key = day.toISOString().split('T')[0];
      grouped.set(key, []);
    });

    visits.forEach((visit) => {
      const visitDate = new Date(visit.scheduled_at);
      const key = visitDate.toISOString().split('T')[0];
      const dayVisits = grouped.get(key);
      if (dayVisits) {
        dayVisits.push(visit);
      }
    });

    // Sort visits by time
    grouped.forEach((dayVisits) => {
      dayVisits.sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      );
    });

    return grouped;
  }, [visits, weekDays]);

  const today = new Date();

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {/* Day Headers */}
        {weekDays.map((day, index) => {
          const isToday = isSameDay(day, today);
          return (
            <div
              key={index}
              className={`bg-white p-3 text-center border-b-2 ${
                isToday ? 'border-blue-500' : 'border-transparent'
              }`}
            >
              <div className="text-xs text-gray-500 font-medium">
                {DAY_NAMES[index]}
              </div>
              <div
                className={`text-2xl font-semibold mt-1 ${
                  isToday
                    ? 'bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto'
                    : 'text-gray-900'
                }`}
              >
                {day.getDate()}
              </div>
            </div>
          );
        })}

        {/* Day Cells */}
        {weekDays.map((day, index) => {
          const key = day.toISOString().split('T')[0];
          const dayVisits = visitsByDay.get(key) || [];
          const isToday = isSameDay(day, today);

          return (
            <div
              key={index}
              className={`bg-white min-h-[500px] p-2 ${
                isToday ? 'ring-2 ring-blue-500 ring-inset' : ''
              }`}
            >
              <div className="space-y-1">
                {dayVisits.map((visit) => (
                  <button
                    key={visit.id}
                    onClick={() => onVisitClick(visit)}
                    className={`w-full text-left p-2 rounded text-xs transition-all hover:shadow-md ${
                      STATUS_COLORS[visit.status] || STATUS_COLORS.scheduled
                    }`}
                  >
                    <div className="font-semibold truncate">
                      {formatTime(visit.scheduled_at)}
                    </div>
                    <div className="truncate mt-0.5">{visit.patient_name}</div>
                    {visit.staff_name && (
                      <div className="truncate text-gray-600 mt-0.5">
                        {visit.staff_name}
                      </div>
                    )}
                    <div className="mt-1">
                      <Badge
                        variant={
                          visit.status === 'completed'
                            ? 'success'
                            : visit.status === 'cancelled'
                            ? 'danger'
                            : 'default'
                        }
                        size="sm"
                      >
                        {visit.duration}分
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
