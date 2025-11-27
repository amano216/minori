import { useState, useMemo, useEffect } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, CalendarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { fetchWeeklySchedule } from '../../api/client';

interface GenerateVisitsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (startDate: string, endDate: string, dayOfWeeks: number[]) => Promise<void>;
}

export function GenerateVisitsPanel({ isOpen, onClose, onGenerate }: GenerateVisitsPanelProps) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // 月〜金をデフォルト選択
  const [isGenerating, setIsGenerating] = useState(false);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [scheduledDates, setScheduledDates] = useState<Set<string>>(new Set());

  // Reset state when panel opens
  useEffect(() => {
    if (isOpen) {
      setStartDate(null);
      setEndDate(null);
      setSelectedDays([1, 2, 3, 4, 5]);
      setViewDate(new Date());
    }
  }, [isOpen]);

  // Fetch existing schedules for visible months
  useEffect(() => {
    if (!isOpen) return;
    
    const loadSchedules = async () => {
      try {
        // Fetch schedules for current view month (approx 6 weeks)
        const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        const startDate = new Date(startOfMonth);
        startDate.setDate(startDate.getDate() - 7); // Week before
        
        const data = await fetchWeeklySchedule({ 
          start_date: startDate.toISOString().split('T')[0]
        });
        
        const dates = new Set<string>();
        Object.entries(data.days).forEach(([dateStr, visits]) => {
          if (visits.length > 0) {
            dates.add(dateStr);
          }
        });
        setScheduledDates(dates);
      } catch (err) {
        console.error('Failed to load schedules:', err);
      }
    };
    
    loadSchedules();
  }, [isOpen, viewDate]);

  const days = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const calendarDays: Date[] = [];
    
    // Previous month padding
    for (let i = 0; i < startingDay; i++) {
      calendarDays.push(new Date(year, month, -startingDay + 1 + i));
    }
    
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push(new Date(year, month, i));
    }
    
    // Next month padding
    const remainingDays = 42 - calendarDays.length;
    for (let i = 1; i <= remainingDays; i++) {
      calendarDays.push(new Date(year, month + 1, i));
    }
    
    return calendarDays;
  }, [viewDate]);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const toggleDayOfWeek = (dow: number) => {
    setSelectedDays(prev => 
      prev.includes(dow) 
        ? prev.filter(d => d !== dow)
        : [...prev, dow].sort((a, b) => a - b)
    );
  };

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    if (scheduledDates.has(dateStr)) return; // Can't select dates with existing schedules
    
    if (!startDate || (startDate && endDate)) {
      // Start new selection
      setStartDate(date);
      setEndDate(null);
    } else {
      // Complete selection
      if (date < startDate) {
        setEndDate(startDate);
        setStartDate(date);
      } else {
        setEndDate(date);
      }
    }
  };

  const isInRange = (date: Date) => {
    if (!startDate) return false;
    
    const end = endDate || hoverDate;
    if (!end) return date.toDateString() === startDate.toDateString();
    
    const [rangeStart, rangeEnd] = startDate <= end ? [startDate, end] : [end, startDate];
    return date >= rangeStart && date <= rangeEnd;
  };

  const isRangeStart = (date: Date) => {
    if (!startDate) return false;
    const end = endDate || hoverDate;
    if (!end) return date.toDateString() === startDate.toDateString();
    const rangeStart = startDate <= end ? startDate : end;
    return date.toDateString() === rangeStart.toDateString();
  };

  const isRangeEnd = (date: Date) => {
    if (!startDate) return false;
    const end = endDate || hoverDate;
    if (!end) return false;
    const rangeEnd = startDate <= end ? end : startDate;
    return date.toDateString() === rangeEnd.toDateString();
  };

  const hasSchedule = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return scheduledDates.has(dateStr);
  };

  // ローカルタイムゾーンでYYYY-MM-DD形式に変換
  const formatDateForApi = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleGenerate = async () => {
    if (!startDate || !endDate || selectedDays.length === 0) return;
    
    setIsGenerating(true);
    try {
      const startStr = formatDateForApi(startDate);
      const endStr = formatDateForApi(endDate);
      await onGenerate(startStr, endStr, selectedDays);
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDateRange = () => {
    if (!startDate) return '期間を選択してください';
    if (!endDate) return `${formatDate(startDate)} 〜 ?`;
    return `${formatDate(startDate)} 〜 ${formatDate(endDate)}`;
  };

  const formatDate = (date: Date) => {
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getMonth() + 1}/${date.getDate()}(${dayNames[date.getDay()]})`;
  };

  const getSelectedDayCount = () => {
    if (!startDate || !endDate || selectedDays.length === 0) return 0;
    let count = 0;
    const current = new Date(startDate);
    while (current <= endDate) {
      if (selectedDays.includes(current.getDay())) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  if (!isOpen) return null;

  const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-emerald-50">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-gray-800">スケジュールに反映</h2>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Day of Week Selector */}
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs text-gray-500 mb-2">反映する曜日</p>
        <div className="flex gap-1">
          {dayLabels.map((label, dow) => (
            <button
              key={dow}
              onClick={() => toggleDayOfWeek(dow)}
              className={`
                flex-1 py-2 rounded-lg text-xs font-medium transition-all
                ${dow === 0 ? 'text-red-600' : dow === 6 ? 'text-blue-600' : ''}
                ${selectedDays.includes(dow)
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 hover:bg-gray-200'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-auto px-4 py-3">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full">
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <h3 className="text-sm font-bold text-gray-800">
            {viewDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
          </h3>
          <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full">
            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 mb-1">
          {dayLabels.map((day, i) => (
            <div key={day} className={`text-center text-xs font-medium py-1 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}`}>
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === viewDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
            const scheduled = hasSchedule(day);
            const inRange = isInRange(day);
            const isStart = isRangeStart(day);
            const isEnd = isRangeEnd(day);
            const isDisabled = isPast || scheduled || !isCurrentMonth;
            
            return (
              <div
                key={index}
                onMouseEnter={() => !endDate && startDate && !isDisabled && setHoverDate(day)}
                onMouseLeave={() => setHoverDate(null)}
                onClick={() => !isDisabled && handleDateClick(day)}
                className={`
                  relative h-9 flex items-center justify-center text-sm transition-all
                  ${isDisabled ? 'cursor-default' : 'cursor-pointer'}
                  ${!isCurrentMonth ? 'text-gray-300' : ''}
                  ${isPast && isCurrentMonth ? 'text-gray-300' : ''}
                  ${inRange && isCurrentMonth && !isPast && !scheduled ? 'bg-indigo-100' : ''}
                  ${isStart && isCurrentMonth ? 'rounded-l-full' : ''}
                  ${isEnd && isCurrentMonth ? 'rounded-r-full' : ''}
                `}
              >
                <span
                  className={`
                    w-7 h-7 flex items-center justify-center rounded-full relative
                    ${isStart || isEnd ? 'bg-indigo-600 text-white font-bold' : ''}
                    ${!isStart && !isEnd && isToday && isCurrentMonth ? 'ring-2 ring-indigo-400' : ''}
                    ${!isStart && !isEnd && isCurrentMonth && !isDisabled ? 'hover:bg-indigo-200' : ''}
                    ${scheduled && isCurrentMonth ? 'bg-gray-200 text-gray-400' : ''}
                  `}
                >
                  {day.getDate()}
                  {scheduled && isCurrentMonth && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-400 rounded-full" />
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-orange-400 rounded-full" />
            <span>スケジュールあり</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
        {/* Selected Range Display */}
        <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{formatDateRange()}</span>
            {startDate && endDate && selectedDays.length > 0 && (
              <span className="text-xs text-gray-500">{getSelectedDayCount()}日分</span>
            )}
          </div>
          {selectedDays.length > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              曜日: {selectedDays.map(d => dayLabels[d]).join('・')}
            </div>
          )}
        </div>

        {/* Info */}
        <p className="text-xs text-gray-500 mb-3">
          ※ 既にスケジュールがある日は反映されません
        </p>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!startDate || !endDate || selectedDays.length === 0 || isGenerating}
          className={`
            w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all
            ${startDate && endDate && selectedDays.length > 0 && !isGenerating
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>生成中...</span>
            </>
          ) : (
            <>
              <ArrowRightIcon className="w-4 h-4" />
              <span>スケジュールに反映</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
