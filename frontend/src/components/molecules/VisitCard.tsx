import React, { useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Visit } from '../../api/client';

interface VisitCardProps {
  visit: Visit;
  onClick?: () => void;
  isOverlay?: boolean;
  className?: string;
}

export const VisitCard: React.FC<VisitCardProps> = ({ visit, isOverlay, className = '' }) => {
  const visitDate = new Date(visit.scheduled_at);
  const durationMinutes = visit.duration || 60;
  const endDate = new Date(visitDate.getTime() + durationMinutes * 60000);

  const formatTime = (d: Date) => 
    `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;

  const bgColor = visit.staff_id
    ? 'bg-blue-100 border-l-blue-500'
    : 'bg-amber-100 border-l-amber-500';

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
      <div className="text-gray-500 text-[10px] leading-tight flex items-center gap-1">
        <span>{formatTime(visitDate)}-{formatTime(endDate)}</span>
      </div>
      {visit.staff && (
        <div className="text-gray-400 text-[9px] leading-tight truncate mt-0.5">
          {visit.staff.name}
        </div>
      )}
    </div>
  );
};

export const DraggableVisitCard = ({ visit, onClick }: { visit: Visit, onClick: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `visit-${visit.id}`,
    data: { visit },
  });
  
  const pointerStartPos = useRef<{ x: number; y: number } | null>(null);
  const didDrag = useRef(false);

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 1000 : undefined,
    opacity: isDragging ? 0 : 1,
    touchAction: 'none',
  };

  const handlePointerDown = (e: React.PointerEvent) => {
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
      <VisitCard visit={visit} onClick={() => {}} />
    </div>
  );
};
