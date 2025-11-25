import { useMemo } from 'react';

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

interface MonthlyCalendarViewProps {
  visits: Visit[];
  month: Date;
  onVisitClick: (visit: Visit) => void;
  onDayClick?: (date: Date) => void;
}

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100',
  in_progress: 'bg-yellow-100',
  completed: 'bg-green-100',
  cancelled: 'bg-red-100',
  unassigned: 'bg-gray-100',
};

function getMonthCalendar(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  // Fill in days before month starts
  const startDayOfWeek = firstDay.getDay();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    currentWeek.push(date);
  }
  
  // Fill in days of the month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(new Date(year, month, day));
  }
  
  // Fill in days after month ends
  while (currentWeek.length < 7) {
    const nextDay = currentWeek.length - startDayOfWeek + 1;
    currentWeek.push(new Date(year, month + 1, nextDay));
  }
  weeks.push(currentWeek);
  
  return weeks;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function MonthlyCalendarView({
  visits,
  month,
  onVisitClick,
  onDayClick,
}: MonthlyCalendarViewProps) {
  const calendar = useMemo(
    () => getMonthCalendar(month.getFullYear(), month.getMonth()),
    [month]
  );

  const visitsByDay = useMemo(() => {
    const grouped = new Map<string, Visit[]>();
    
    visits.forEach((visit) => {
      const visitDate = new Date(visit.scheduled_at);
      const key = `${visitDate.getFullYear()}-${visitDate.getMonth()}-${visitDate.getDate()}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(visit);
    });

    return grouped;
  }, [visits]);

  const today = new Date();
  const currentMonth = month.getMonth();

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="p-4">
        {/* Day Names Header */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 mb-px">
          {DAY_NAMES.map((dayName, index) => (
            <div
              key={index}
              className="bg-gray-50 py-2 text-center text-sm font-semibold text-gray-700"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {calendar.map((week, weekIndex) =>
            week.map((day, dayIndex) => {
              const isCurrentMonth = day.getMonth() === currentMonth;
              const isToday = isSameDay(day, today);
              const dateKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
              const dayVisits = visitsByDay.get(dateKey) || [];
              
              // Count visits by status
              const statusCounts = dayVisits.reduce((acc, visit) => {
                acc[visit.status] = (acc[visit.status] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);

              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`bg-white min-h-[120px] p-2 ${
                    !isCurrentMonth ? 'opacity-40' : ''
                  } ${isToday ? 'ring-2 ring-inset ring-blue-500' : ''}`}
                >
                  {/* Day Number */}
                  <button
                    onClick={() => onDayClick?.(day)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold mb-1 ${
                      isToday
                        ? 'bg-blue-500 text-white'
                        : isCurrentMonth
                        ? 'text-gray-900 hover:bg-gray-100'
                        : 'text-gray-400'
                    }`}
                  >
                    {day.getDate()}
                  </button>

                  {/* Visit Indicators */}
                  <div className="space-y-1">
                    {dayVisits.slice(0, 3).map((visit) => (
                      <button
                        key={visit.id}
                        onClick={() => onVisitClick(visit)}
                        className={`w-full text-left px-2 py-1 rounded text-xs truncate hover:shadow-sm transition-shadow ${
                          STATUS_COLORS[visit.status] || STATUS_COLORS.scheduled
                        }`}
                      >
                        <div className="font-medium truncate">
                          {new Date(visit.scheduled_at).toLocaleTimeString('ja-JP', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="truncate text-gray-700">
                          {visit.patient_name}
                        </div>
                      </button>
                    ))}
                    
                    {/* Show "more" indicator */}
                    {dayVisits.length > 3 && (
                      <button
                        onClick={() => onDayClick?.(day)}
                        className="w-full text-left px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                      >
                        +{dayVisits.length - 3} 件
                      </button>
                    )}

                    {/* Status summary for days with visits */}
                    {dayVisits.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {Object.entries(statusCounts).map(([status, count]) => (
                          <div
                            key={status}
                            className={`px-1.5 py-0.5 rounded text-xs ${
                              STATUS_COLORS[status] || STATUS_COLORS.scheduled
                            }`}
                          >
                            {count}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
