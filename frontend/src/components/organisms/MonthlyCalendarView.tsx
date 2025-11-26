import { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { Visit } from '../../api/client';

interface MonthlyCalendarViewProps {
  currentDate: Date;
  visits: Visit[];
  onDateClick: (date: Date) => void;
  onVisitClick?: (visit: Visit) => void;
  onClose: () => void;
}

export function MonthlyCalendarView({
  currentDate,
  visits,
  onDateClick,
  onClose,
}: MonthlyCalendarViewProps) {
  const [viewDate, setViewDate] = useState(new Date(currentDate));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const days = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0 = Sunday
    
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
    const remainingDays = 42 - calendarDays.length; // 6 rows * 7 days
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

  return (
    <div ref={containerRef} className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-72 z-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-800">
          {viewDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
        </h2>
        <div className="flex items-center space-x-1">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full">
            <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
          </button>
          <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full">
            <ChevronRightIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 mb-2">
        {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
          <div key={day} className={`text-center text-xs font-medium ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}`}>
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-y-2">
        {days.map((day, index) => {
          const isCurrentMonth = day.getMonth() === viewDate.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();
          const isSelected = day.toDateString() === currentDate.toDateString();
          const hasVisits = visits.some(v => new Date(v.scheduled_at).toDateString() === day.toDateString());
          
          return (
            <div 
              key={index} 
              className="flex flex-col items-center justify-center cursor-pointer relative"
              onClick={() => {
                onDateClick(day);
                onClose();
              }}
            >
              <span 
                className={`
                  w-7 h-7 flex items-center justify-center rounded-full text-xs
                  ${isSelected ? 'bg-indigo-600 text-white font-bold' : ''}
                  ${!isSelected && isToday ? 'bg-indigo-50 text-indigo-600 font-bold' : ''}
                  ${!isSelected && !isToday && !isCurrentMonth ? 'text-gray-300' : ''}
                  ${!isSelected && !isToday && isCurrentMonth ? 'text-gray-700 hover:bg-gray-100' : ''}
                `}
              >
                {day.getDate()}
              </span>
              {hasVisits && isCurrentMonth && (
                <span className="absolute -bottom-1 w-1 h-1 bg-indigo-400 rounded-full"></span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
