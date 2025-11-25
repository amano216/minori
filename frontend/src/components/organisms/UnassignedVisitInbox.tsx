import { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useDraggable } from '@dnd-kit/core';
import type { Visit } from '../../api/client';

interface DraggableVisitCardProps {
  visit: Visit;
  onClick: (visit: Visit) => void;
}

function DraggableVisitCard({ visit, onClick }: DraggableVisitCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `visit-${visit.id}`,
    data: { visit },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 999,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onClick(visit)}
      className={`bg-white p-3 rounded-lg border shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-shadow border-l-4 border-l-red-400 touch-none ${
        isDragging ? 'opacity-50 shadow-xl rotate-2' : 'border-gray-200'
      }`}
    >
      <div className="flex justify-between items-start mb-1">
        <span className="font-medium text-gray-900">{visit.patient.name}</span>
        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
          {visit.duration}分
        </span>
      </div>
      <div className="text-xs text-gray-500 mb-1">
        {new Date(visit.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      {visit.patient.address && (
        <div className="text-xs text-gray-400 truncate">
          {visit.patient.address}
        </div>
      )}
    </div>
  );
}

interface UnassignedVisitInboxProps {
  visits: Visit[];
  onVisitClick: (visit: Visit) => void;
}

export function UnassignedVisitInbox({
  visits,
  onVisitClick,
}: UnassignedVisitInboxProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVisits = visits.filter((visit) =>
    visit.patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700 flex items-center">
            <span className="bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs font-bold mr-2">
              {visits.length}
            </span>
            未割当
          </h2>
          <button className="text-gray-400 hover:text-gray-600">
            <FunnelIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="患者名で検索..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50">
        {filteredVisits.map((visit) => (
          <DraggableVisitCard
            key={visit.id}
            visit={visit}
            onClick={onVisitClick}
          />
        ))}
        
        {filteredVisits.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            該当する訪問はありません
          </div>
        )}
      </div>
    </div>
  );
}
