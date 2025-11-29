import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDownIcon, CheckIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import type { Group } from '../../api/client';

interface MultiGroupSelectorProps {
  groups: Group[];
  selectedGroupIds: number[];
  onChange: (ids: number[]) => void;
  compact?: boolean; // スマホ用アイコンモード
}

export function MultiGroupSelector({ groups, selectedGroupIds, onChange, compact = false }: MultiGroupSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // チームのみを抽出し、「親 > チーム」形式のラベルを作成
  const teamsWithLabels = useMemo(() => {
    const groupMap = new Map<number, Group>();
    groups.forEach(g => groupMap.set(g.id, g));

    // チーム（parent_idがあるもの）のみ抽出
    const teams = groups.filter(g => g.parent_id !== null && g.parent_id !== undefined);

    return teams.map(team => {
      const parent = team.parent_id ? groupMap.get(team.parent_id) : null;
      const label = parent ? `${parent.name} > ${team.name}` : team.name;
      return { ...team, label, parentName: parent?.name || '' };
    }).sort((a, b) => {
      // 親名でソート、同じ親内ではチーム名でソート
      if (a.parentName !== b.parentName) {
        return a.parentName.localeCompare(b.parentName, 'ja');
      }
      return a.name.localeCompare(b.name, 'ja');
    });
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

  const selectAll = () => {
    onChange(teamsWithLabels.map(t => t.id));
  };

  const clearAll = () => {
    onChange([]);
  };

  // 選択されているチームのみカウント（事業所は除外）
  const teamIds = new Set(teamsWithLabels.map(t => t.id));
  const selectedTeamCount = selectedGroupIds.filter(id => teamIds.has(id)).length;
  const totalTeamCount = teamsWithLabels.length;
  const isAllSelected = selectedTeamCount === totalTeamCount && totalTeamCount > 0;

  // 選択されているチームの表示名
  const selectedTeamNames = useMemo(() => {
    if (selectedTeamCount === 0) return 'チームを選択';
    if (isAllSelected) return 'すべてのチーム';
    if (selectedTeamCount <= 2) {
      return teamsWithLabels
        .filter(t => selectedGroupIds.includes(t.id))
        .map(t => t.label)
        .join(', ');
    }
    return `${selectedTeamCount} チームを選択中`;
  }, [selectedTeamCount, isAllSelected, teamsWithLabels, selectedGroupIds]);

  return (
    <div className="relative z-[100]" ref={containerRef}>
      {/* Desktop: full button, Mobile: icon only when compact */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={
          compact
            ? `flex items-center justify-center p-2 rounded-lg transition-colors ${
                isAllSelected ? 'bg-gray-100 text-gray-600' : 'bg-indigo-50 text-indigo-600'
              } sm:bg-white sm:border sm:border-gray-300 sm:text-gray-700 sm:px-3 sm:py-2 sm:rounded-lg sm:text-sm sm:font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:shadow-sm sm:max-w-xs`
            : 'flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm max-w-xs'
        }
        title={selectedTeamNames}
      >
        {/* Mobile: icon with badge */}
        {compact && (
          <span className="sm:hidden relative">
            <UserGroupIcon className="w-5 h-5" />
            {!isAllSelected && selectedTeamCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                {selectedTeamCount}
              </span>
            )}
          </span>
        )}
        {/* Desktop: full text */}
        <span className={compact ? 'hidden sm:flex sm:items-center sm:space-x-2' : 'flex items-center space-x-2'}>
          <span className="truncate">{selectedTeamNames}</span>
          <ChevronDownIcon className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
        </span>
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[200] overflow-hidden max-h-[60vh] flex flex-col ${compact ? 'left-0 right-auto w-72 sm:left-0' : 'left-0 w-72'}`}>
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
            {teamsWithLabels.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">チームがありません</div>
            ) : (
              teamsWithLabels.map((team) => {
                const isSelected = selectedGroupIds.includes(team.id);
                return (
                  <div
                    key={team.id}
                    onClick={() => toggleGroup(team.id)}
                    className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50"
                  >
                    <div
                      className={`w-4 h-4 border rounded mr-3 flex items-center justify-center transition-colors flex-shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-sm ${isSelected ? 'text-indigo-900 font-medium' : 'text-gray-700'}`}>
                      {team.label}
                    </span>
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
