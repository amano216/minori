import React, { useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Visit, PatternFrequency } from '../../api/client';
import { extractTownName } from '../../utils/addressUtils';

// 頻度ラベルのマッピング
const FREQUENCY_LABELS: Record<PatternFrequency, string> = {
  weekly: '毎週',
  biweekly: '隔週',
  monthly_1_3: '第1・3週',
  monthly_2_4: '第2・4週',
};

interface VisitCardProps {
  visit: Visit;
  onClick?: () => void;
  isOverlay?: boolean;
  className?: string;
  patternFrequency?: PatternFrequency; // パターンモード用
}

export const VisitCard: React.FC<VisitCardProps> = ({ visit, isOverlay, className = '', patternFrequency }) => {
  const visitDate = new Date(visit.scheduled_at);
  const durationMinutes = visit.duration || 60;
  const endDate = new Date(visitDate.getTime() + durationMinutes * 60000);
  const townName = extractTownName(visit.patient.address);

  const formatTime = (d: Date) => 
    `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;

  // 入院中の患者は灰色、それ以外は従来のロジック
  const isHospitalized = visit.patient?.status === 'hospitalized';
  const isNonWeeklyPattern = patternFrequency && patternFrequency !== 'weekly';
  
  let bgColor: string;
  if (isHospitalized) {
    // 入院中患者: 灰色（最優先）
    bgColor = 'bg-gray-200 border-l-gray-400';
  } else if (isNonWeeklyPattern) {
    // 隔週/月2回パターン: ピンク
    bgColor = 'bg-rose-100 border-l-rose-500';
  } else if (patternFrequency) {
    // 毎週パターン: 黄色（未割当と同じ）
    bgColor = 'bg-amber-100 border-l-amber-500';
  } else if (visit.staff_id) {
    // 通常訪問（スタッフ割当済み）: 青
    bgColor = 'bg-blue-100 border-l-blue-500';
  } else {
    // 通常訪問（未割当）: 黄色
    bgColor = 'bg-amber-100 border-l-amber-500';
  }

  return (
    <div
      className={`
        ${bgColor} 
        border-l-[3px] 
        px-1.5 py-1 
        text-[11px] 
        cursor-pointer 
        hover:shadow-md 
        transition-all 
        rounded-r-sm 
        mb-0.5 
        select-none
        ${isOverlay ? 'shadow-xl scale-105 rotate-2 z-50 opacity-90' : ''}
        ${className}
      `}
    >
      <div className="font-semibold text-gray-800 leading-tight truncate">
        {visit.patient.name}
      </div>
      {townName && (
        <div className="text-gray-400 text-[9px] leading-tight truncate">
          {townName}
        </div>
      )}
      <div className="text-gray-500 text-[10px] leading-tight flex items-center gap-1">
        <span>{formatTime(visitDate)}-{formatTime(endDate)}</span>
      </div>
      {visit.staff && (
        <div className="text-gray-400 text-[9px] leading-tight truncate mt-0.5">
          {visit.staff.name}
        </div>
      )}
      {patternFrequency && (
        <div className={`text-[9px] leading-tight truncate mt-0.5 ${isNonWeeklyPattern ? 'text-rose-600 font-medium' : 'text-amber-600'}`}>
          {FREQUENCY_LABELS[patternFrequency]}
        </div>
      )}
    </div>
  );
};

export const DraggableVisitCard = ({ 
  visit, 
  onClick, 
  disabled = false,
  patternFrequency,
}: { 
  visit: Visit; 
  onClick: () => void; 
  disabled?: boolean;
  patternFrequency?: PatternFrequency;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `visit-${visit.id}`,
    data: { visit },
    disabled,
  });
  
  const pointerStartPos = useRef<{ x: number; y: number } | null>(null);
  const didDrag = useRef(false);

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 1000 : undefined,
    opacity: isDragging ? 0 : 1,
    touchAction: disabled ? 'auto' : 'none',
    cursor: disabled ? 'pointer' : 'grab',
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    pointerStartPos.current = { x: e.clientX, y: e.clientY };
    didDrag.current = false;
    // listenersのonPointerDownを呼び出す
    listeners?.onPointerDown?.(e as unknown as PointerEvent);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointerStartPos.current) {
      const dx = Math.abs(e.clientX - pointerStartPos.current.x);
      const dy = Math.abs(e.clientY - pointerStartPos.current.y);
      if (dx > 5 || dy > 5) {
        didDrag.current = true;
      }
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // ドラッグしていなければクリックを発火
    if (!didDrag.current) {
      onClick();
    }
    pointerStartPos.current = null;
    didDrag.current = false;
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      {...attributes}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
    >
      <VisitCard visit={visit} onClick={() => {}} patternFrequency={patternFrequency} />
    </div>
  );
};
