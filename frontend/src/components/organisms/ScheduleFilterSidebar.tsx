import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Users, User, FileText } from 'lucide-react';

interface Group {
  id: number;
  name: string;
}

interface Staff {
  id: number;
  name: string;
}

interface Patient {
  id: number;
  name: string;
}

export interface ScheduleFilters {
  groupIds: number[];
  staffIds: number[];
  patientIds: number[];
}

interface ScheduleFilterSidebarProps {
  groups: Group[];
  staffs: Staff[];
  patients: Patient[];
  filters: ScheduleFilters;
  onFiltersChange: (filters: ScheduleFilters) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const STORAGE_KEY = 'minori_schedule_filters';

export function ScheduleFilterSidebar({
  groups,
  staffs,
  patients,
  filters,
  onFiltersChange,
  isCollapsed = false,
  onToggleCollapse,
}: ScheduleFilterSidebarProps) {
  const [showPatients, setShowPatients] = useState(false);

  // Load filters from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        onFiltersChange(parsed);
      } catch (e) {
        console.error('Failed to parse saved filters', e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save filters to localStorage when they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const toggleStaffFilter = (staffId: number) => {
    if (filters.staffIds.includes(staffId)) {
      onFiltersChange({
        ...filters,
        staffIds: filters.staffIds.filter((id) => id !== staffId),
      });
    } else {
      onFiltersChange({
        ...filters,
        staffIds: [...filters.staffIds, staffId],
      });
    }
  };

  const togglePatientFilter = (patientId: number) => {
    if (filters.patientIds.includes(patientId)) {
      onFiltersChange({
        ...filters,
        patientIds: filters.patientIds.filter((id) => id !== patientId),
      });
    } else {
      onFiltersChange({
        ...filters,
        patientIds: [...filters.patientIds, patientId],
      });
    }
  };

  const clearAllFilters = () => {
    onFiltersChange({ groupIds: [], staffIds: [], patientIds: [] });
  };

  const selectAllStaff = () => {
    onFiltersChange({
      ...filters,
      groupIds: groups.map((g) => g.id),
      staffIds: staffs.map((s) => s.id),
    });
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4 space-y-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          title="フィルターを表示"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
        <Users className="w-5 h-5 text-gray-400" />
        <FileText className="w-5 h-5 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5" />
          フィルター
        </h3>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="フィルターを隠す"
          >
            <ChevronDown className="w-4 h-4 text-gray-600 rotate-90" />
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-2 border-b border-gray-200 flex gap-2">
        <button
          onClick={selectAllStaff}
          className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
        >
          すべて選択
        </button>
        <button
          onClick={clearAllFilters}
          className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
        >
          クリア
        </button>
      </div>

      {/* Filter Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Staff List */}
        <div className="border-b border-gray-200">
          <div className="p-3 bg-gray-100 font-medium text-sm text-gray-700 flex items-center gap-2">
            <Users className="w-4 h-4" />
            スタッフ
          </div>
          <div className="p-2">
            {staffs.map((staff) => (
              <label
                key={staff.id}
                className="flex items-center gap-2 py-2 px-3 hover:bg-gray-100 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={filters.staffIds.includes(staff.id)}
                  onChange={() => toggleStaffFilter(staff.id)}
                  className="rounded border-gray-300"
                />
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{staff.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Patients */}
        <div>
          <button
            onClick={() => setShowPatients(!showPatients)}
            className="w-full p-3 bg-gray-100 font-medium text-sm text-gray-700 flex items-center gap-2 hover:bg-gray-150"
          >
            {showPatients ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <FileText className="w-4 h-4" />
            患者
            {filters.patientIds.length > 0 && (
              <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {filters.patientIds.length}
              </span>
            )}
          </button>
          {showPatients && (
            <div className="max-h-64 overflow-y-auto">
              {patients.map((patient) => (
                <label
                  key={patient.id}
                  className="flex items-center gap-2 py-2 px-4 hover:bg-gray-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.patientIds.includes(patient.id)}
                    onChange={() => togglePatientFilter(patient.id)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{patient.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
