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

interface DailyCalendarViewProps {
  visits: Visit[];
  date: Date;
  onVisitClick: (visit: Visit) => void;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#e6f1f8',
  in_progress: '#fff4e5',
  completed: '#e3f5e8',
  cancelled: '#fce4ec',
  unassigned: '#f0efed',
};

const TIME_SLOTS = Array.from({ length: 21 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

function getVisitPosition(scheduledAt: string, duration: number) {
  const date = new Date(scheduledAt);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const startMinutes = (hours - 8) * 60 + minutes;
  const top = (startMinutes / 30) * 60; // 30min = 60px
  const height = (duration / 30) * 60;
  return { top: Math.max(0, top), height: Math.max(30, height) };
}

function groupVisitsByStaff(visits: Visit[]): Map<string, Visit[]> {
  const grouped = new Map<string, Visit[]>();
  
  visits.forEach((visit) => {
    const key = visit.staff_name || '未割当';
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(visit);
  });

  return grouped;
}

export function DailyCalendarView({
  visits,
  date,
  onVisitClick,
}: DailyCalendarViewProps) {
  const filteredVisits = useMemo(() => {
    return visits.filter((visit) => {
      const visitDate = new Date(visit.scheduled_at);
      return (
        visitDate.getFullYear() === date.getFullYear() &&
        visitDate.getMonth() === date.getMonth() &&
        visitDate.getDate() === date.getDate()
      );
    });
  }, [visits, date]);

  const staffGroups = useMemo(
    () => groupVisitsByStaff(filteredVisits),
    [filteredVisits]
  );

  const staffNames = Array.from(staffGroups.keys());

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="flex">
        {/* Time Column */}
        <div className="w-20 flex-shrink-0 border-r border-gray-200 bg-gray-50">
          <div className="h-12 border-b border-gray-200" /> {/* Header spacer */}
          {TIME_SLOTS.map((time) => (
            <div
              key={time}
              className="h-[60px] border-b border-gray-200 px-2 py-1 text-xs text-gray-500"
            >
              {time}
            </div>
          ))}
        </div>

        {/* Staff Columns */}
        <div className="flex-1 flex">
          {staffNames.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 py-20">
              この日に予定されている訪問はありません
            </div>
          ) : (
            staffNames.map((staffName) => {
              const staffVisits = staffGroups.get(staffName) || [];
              
              return (
                <div
                  key={staffName}
                  className="flex-1 border-r border-gray-200 min-w-[200px]"
                >
                  {/* Staff Header */}
                  <div className="h-12 border-b border-gray-200 px-3 py-2 bg-gray-50 font-medium text-sm flex items-center justify-center">
                    {staffName}
                    <span className="ml-2 text-xs text-gray-500">
                      ({staffVisits.length})
                    </span>
                  </div>

                  {/* Timeline */}
                  <div className="relative" style={{ height: `${TIME_SLOTS.length * 60}px` }}>
                    {/* Time Grid Lines */}
                    {TIME_SLOTS.map((_, index) => (
                      <div
                        key={index}
                        className="absolute w-full h-[60px] border-b border-gray-100"
                        style={{ top: index * 60 }}
                      />
                    ))}

                    {/* Visit Bars */}
                    {staffVisits.map((visit) => {
                      const position = getVisitPosition(
                        visit.scheduled_at,
                        visit.duration
                      );
                      
                      return (
                        <button
                          key={visit.id}
                          onClick={() => onVisitClick(visit)}
                          className="absolute left-1 right-1 rounded shadow-sm hover:shadow-md transition-shadow border-l-4 border-blue-500"
                          style={{
                            top: position.top,
                            height: position.height,
                            backgroundColor: STATUS_COLORS[visit.status],
                          }}
                        >
                          <div className="p-2 text-left h-full overflow-hidden">
                            <div className="font-semibold text-sm truncate">
                              {formatTime(visit.scheduled_at)}
                            </div>
                            <div className="text-sm truncate mt-0.5">
                              {visit.patient_name}
                            </div>
                            {position.height > 60 && (
                              <div className="mt-1">
                                <Badge size="sm">
                                  {visit.duration}分
                                </Badge>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
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
