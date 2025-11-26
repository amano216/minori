import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDownIcon, ChevronRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import type { Group } from '../../api/client';

interface MultiGroupSelectorProps {
  groups: Group[];
  selectedGroupIds: number[];
  onChange: (ids: number[]) => void;
}

export function MultiGroupSelector({ groups, selectedGroupIds, onChange }: MultiGroupSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedOffices, setExpandedOffices] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const hierarchy = useMemo(() => {
    const offices = groups.filter(g => !g.parent_id);
    const teamsMap = new Map<number, Group[]>();
    groups.filter(g => g.parent_id).forEach(t => {
      if (t.parent_id) {
        const list = teamsMap.get(t.parent_id) || [];
        list.push(t);
        teamsMap.set(t.parent_id, list);
      }
    });
    return { offices, teamsMap };
  }, [groups]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleGroup = (groupId: number) => {
    const newSelectedIds = selectedGroupIds.includes(groupId)
      ? selectedGroupIds.filter(id => id !== groupId)
      : [...selectedGroupIds, groupId];
    onChange(newSelectedIds);
  };

  const toggleOfficeAndTeams = (officeId: number, teams: Group[]) => {
    const teamIds = teams.map(t => t.id);
    const allIds = [officeId, ...teamIds];
    
    // Check if all are currently selected
    const allSelected = allIds.every(id => selectedGroupIds.includes(id));
    
    let newSelectedIds: number[];
    if (allSelected) {
      // Deselect all
      newSelectedIds = selectedGroupIds.filter(id => !allIds.includes(id));
    } else {
      // Select all (add missing ones)
      const toAdd = allIds.filter(id => !selectedGroupIds.includes(id));
      newSelectedIds = [...selectedGroupIds, ...toAdd];
    }
    onChange(newSelectedIds);
  };

  const toggleOfficeExpand = (e: React.MouseEvent, officeId: number) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedOffices);
    if (newExpanded.has(officeId)) {
      newExpanded.delete(officeId);
    } else {
      newExpanded.add(officeId);
    }
    setExpandedOffices(newExpanded);
  };

  const selectAll = () => {
    onChange(groups.map(g => g.id));
  };

  const clearAll = () => {
    onChange([]);
  };

  const selectedCount = selectedGroupIds.length;
  const totalCount = groups.length;
  const isAllSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
      >
        <span>
          {selectedCount === 0
            ? 'グループを選択'
            : isAllSelected
            ? 'すべてのグループ'
            : `${selectedCount} グループを選択中`}
        </span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden max-h-[80vh] flex flex-col">
          <div className="p-2 border-b border-gray-100 flex justify-between text-xs flex-shrink-0 bg-gray-50">
            <button
              onClick={selectAll}
              className="text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50"
            >
              すべて選択
            </button>
            <button
              onClick={clearAll}
              className="text-gray-500 hover:text-gray-700 font-medium px-2 py-1 rounded hover:bg-gray-100"
            >
              クリア
            </button>
          </div>
          <div className="overflow-y-auto py-1 flex-1">
            {hierarchy.offices.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">グループがありません</div>
            ) : (
              hierarchy.offices.map((office) => {
                const teams = hierarchy.teamsMap.get(office.id) || [];
                const isOfficeSelected = selectedGroupIds.includes(office.id);
                const isExpanded = expandedOffices.has(office.id);
                
                // Check if all children are selected
                const teamIds = teams.map(t => t.id);
                const selectedTeamCount = teamIds.filter(id => selectedGroupIds.includes(id)).length;
                const isAllTeamsSelected = teams.length > 0 && selectedTeamCount === teams.length;
                const isPartiallySelected = (isOfficeSelected || selectedTeamCount > 0) && !(isOfficeSelected && isAllTeamsSelected);

                return (
                  <div key={office.id} className="border-b border-gray-50 last:border-0">
                    <div className="flex items-center px-2 py-1 hover:bg-gray-50">
                      <button 
                        onClick={(e) => toggleOfficeExpand(e, office.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 mr-1"
                      >
                        <ChevronRightIcon className={`w-3 h-3 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`} />
                      </button>
                      
                      <div 
                        className="flex-1 flex items-center cursor-pointer py-1"
                        onClick={() => toggleOfficeAndTeams(office.id, teams)}
                      >
                        <div
                          className={`w-4 h-4 border rounded mr-2 flex items-center justify-center transition-colors ${
                            isOfficeSelected && isAllTeamsSelected
                              ? 'bg-indigo-600 border-indigo-600'
                              : isPartiallySelected
                              ? 'bg-indigo-50 border-indigo-600'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isOfficeSelected && isAllTeamsSelected && <CheckIcon className="w-3 h-3 text-white" />}
                          {isPartiallySelected && !(isOfficeSelected && isAllTeamsSelected) && <div className="w-2 h-2 bg-indigo-600 rounded-sm" />}
                        </div>
                        <span className={`text-sm ${isOfficeSelected ? 'text-indigo-900 font-medium' : 'text-gray-700'}`}>
                          {office.name}
                        </span>
                        <span className="ml-auto text-xs text-gray-400">
                          {selectedTeamCount + (isOfficeSelected ? 1 : 0)}/{teams.length + 1}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="bg-gray-50/50 pb-1">
                        {/* Office Itself Selection Row (Optional, if we want to select Office independently from teams) */}
                        <div 
                          className="flex items-center px-4 py-1 pl-10 cursor-pointer hover:bg-gray-100"
                          onClick={() => toggleGroup(office.id)}
                        >
                           <div
                            className={`w-3 h-3 border rounded mr-2 flex items-center justify-center transition-colors ${
                              isOfficeSelected
                                ? 'bg-indigo-600 border-indigo-600'
                                : 'border-gray-300 bg-white'
                            }`}
                          >
                            {isOfficeSelected && <CheckIcon className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className="text-xs text-gray-600">事業所のみ</span>
                        </div>

                        {teams.map(team => {
                          const isTeamSelected = selectedGroupIds.includes(team.id);
                          return (
                            <div
                              key={team.id}
                              onClick={() => toggleGroup(team.id)}
                              className="flex items-center px-4 py-1 pl-10 cursor-pointer hover:bg-gray-100"
                            >
                              <div
                                className={`w-3 h-3 border rounded mr-2 flex items-center justify-center transition-colors ${
                                  isTeamSelected
                                    ? 'bg-indigo-600 border-indigo-600'
                                    : 'border-gray-300 bg-white'
                                }`}
                              >
                                {isTeamSelected && <CheckIcon className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <span className={`text-xs ${isTeamSelected ? 'text-indigo-900 font-medium' : 'text-gray-600'}`}>
                                {team.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
