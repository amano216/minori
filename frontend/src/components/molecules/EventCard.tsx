import type { ScheduleEvent, EventType } from '../../api/client';

interface EventCardProps {
  event: ScheduleEvent;
  onClick?: () => void;
  compact?: boolean;
}

const EVENT_TYPE_STYLES: Record<EventType, { bg: string; border: string; text: string }> = {
  meeting: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-800' },
  facility: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800' },
  training: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800' },
  other: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-800' },
};

const EVENT_TYPE_ICONS: Record<EventType, string> = {
  meeting: '👥',
  facility: '🏢',
  training: '📚',
  other: '📌',
};

export function EventCard({ event, onClick, compact = false }: EventCardProps) {
  const style = EVENT_TYPE_STYLES[event.event_type];
  const icon = EVENT_TYPE_ICONS[event.event_type];
  const startTime = new Date(event.scheduled_at);
  const timeStr = startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

  if (compact) {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        className={`px-1 py-0.5 rounded text-[10px] truncate cursor-pointer border ${style.bg} ${style.border} ${style.text} hover:brightness-95`}
        title={`${event.title} (${timeStr})`}
      >
        {icon} {event.title}
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`px-2 py-1.5 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md ${style.bg} ${style.border} mb-1`}
    >
      <div className={`text-xs font-medium ${style.text} truncate`}>
        {icon} {event.title}
      </div>
      <div className="text-[10px] text-gray-500 mt-0.5">
        {timeStr} ({event.duration}分)
      </div>
      {event.participants.length > 0 && (
        <div className="text-[10px] text-gray-400 mt-0.5 truncate">
          {event.participants.map(p => p.name).join(', ')}
        </div>
      )}
    </div>
  );
}
