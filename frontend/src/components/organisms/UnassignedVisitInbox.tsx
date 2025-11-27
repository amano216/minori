import { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, InboxIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import type { Visit } from '../../api/client';

interface VisitCardProps {
  visit: Visit;
  onClick: (visit: Visit) => void;
  onEditClick?: (visit: Visit) => void;
}

function VisitCard({ visit, onClick, onEditClick }: VisitCardProps) {
  // Type assertion for patient with group
  const patient = visit.patient as { id: number; name: string; group?: { id: number; name: string } };

  return (
    <div
      onClick={() => onClick(visit)}
      className="bg-white px-3 py-2 rounded-lg border shadow-sm hover:shadow-md cursor-pointer transition-shadow border-l-4 border-l-red-400 border-gray-200 group"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-gray-900 truncate">{visit.patient.name}</span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {new Date(visit.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {onEditClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditClick(visit);
              }}
              className="p-1 text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
              title="編集"
            >
              <PencilSquareIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {patient.group && (
        <div className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded inline-block mt-1">
          {patient.group.name}
        </div>
      )}
    </div>
  );
}

interface UnassignedVisitInboxProps {
  visits: Visit[];
  onVisitClick: (visit: Visit) => void;
  onEditClick?: (visit: Visit) => void;
}

export function UnassignedVisitInbox({
  visits,
  onVisitClick,
  onEditClick,
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
            <InboxIcon className="w-5 h-5 mr-2 text-gray-500" />
            <span className="bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs font-bold">
              {visits.length}
            </span>
          </h2>
          <button className="text-gray-400 hover:text-gray-600">
            <FunnelIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50">
        {filteredVisits.map((visit) => (
          <VisitCard
            key={visit.id}
            visit={visit}
            onClick={onVisitClick}
            onEditClick={onEditClick}
          />
        ))}
        
        {filteredVisits.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-300">
            <InboxIcon className="w-12 h-12 mb-2" />
          </div>
        )}
      </div>
    </div>
  );
}
