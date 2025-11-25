import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../atoms/Button';

export type ViewMode = 'day' | 'week' | 'month';

interface ScheduleHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  currentDate: Date;
  onPreviousClick: () => void;
  onNextClick: () => void;
  onTodayClick: () => void;
}

function formatDateRange(date: Date, viewMode: ViewMode): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  switch (viewMode) {
    case 'day':
      return `${year}年${month}月${day}日`;
    case 'week': {
      const weekStart = new Date(date);
      const dayOfWeek = weekStart.getDay();
      const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      weekStart.setDate(diff);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const startMonth = weekStart.getMonth() + 1;
      const startDay = weekStart.getDate();
      const endMonth = weekEnd.getMonth() + 1;
      const endDay = weekEnd.getDate();
      
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${year}年${startMonth}月${startDay}日 - ${endDay}日`;
      } else {
        return `${year}年${startMonth}月${startDay}日 - ${endMonth}月${endDay}日`;
      }
    }
    case 'month':
      return `${year}年${month}月`;
  }
}

export function ScheduleHeader({
  viewMode,
  onViewModeChange,
  currentDate,
  onPreviousClick,
  onNextClick,
  onTodayClick,
}: ScheduleHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* Left: View Mode Selector */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => onViewModeChange('day')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            viewMode === 'day'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          日
        </button>
        <button
          onClick={() => onViewModeChange('week')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            viewMode === 'week'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          週
        </button>
        <button
          onClick={() => onViewModeChange('month')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            viewMode === 'month'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          月
        </button>
      </div>

      {/* Center: Date Navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={onPreviousClick}
          className="p-1"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <div className="flex items-center gap-2 min-w-[200px] justify-center">
          <CalendarIcon className="w-5 h-5 text-gray-600" />
          <span className="text-lg font-semibold text-gray-900">
            {formatDateRange(currentDate, viewMode)}
          </span>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={onNextClick}
          className="p-1"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Right: Today Button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={onTodayClick}
      >
        今日
      </Button>
    </div>
  );
}
