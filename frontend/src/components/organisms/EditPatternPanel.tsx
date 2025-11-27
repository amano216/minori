import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { X, User, Clock, Save, Trash2 } from 'lucide-react';
import {
  updateVisitPattern,
  deleteVisitPattern,
  fetchStaffs,
  fetchPatients,
  type VisitPatternInput,
  type VisitPattern,
  type Staff,
  type Patient,
  type Group,
} from '../../api/client';
import { Button } from '../atoms/Button';
import { Spinner } from '../atoms/Spinner';
import { SearchableSelect } from '../molecules/SearchableSelect';

interface EditPatternPanelProps {
  isOpen: boolean;
  pattern: VisitPattern | null;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
  groups?: Group[];
}

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

export function EditPatternPanel({
  isOpen,
  pattern,
  onClose,
  onUpdated,
  onDeleted,
  groups = [],
}: EditPatternPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Form State
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [staffId, setStaffId] = useState<number | ''>('');
  const [patientId, setPatientId] = useState<number | ''>('');

  // Data State
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && pattern) {
      setTimeout(() => setIsVisible(true), 10);
      loadMasterData();
      
      // Populate form from pattern
      setDayOfWeek(pattern.day_of_week);
      setStartTime(pattern.start_time);
      setDuration(pattern.duration);
      setStaffId(pattern.default_staff_id || '');
      setPatientId(pattern.patient_id);
    } else {
      setIsVisible(false);
      setShowDeleteConfirm(false);
      setError('');
    }
  }, [isOpen, pattern]);

  const loadMasterData = async () => {
    setLoading(true);
    try {
      const [staffsData, patientsData] = await Promise.all([
        fetchStaffs({ status: 'active' }),
        fetchPatients(),
      ]);
      setStaffs(staffsData);
      setPatients(patientsData);
    } catch (err) {
      console.error('Failed to load master data:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!pattern) return;
    if (!patientId) {
      setError('患者を選択してください');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const input: Partial<VisitPatternInput> = {
        day_of_week: dayOfWeek,
        start_time: startTime,
        duration,
        patient_id: Number(patientId),
        default_staff_id: staffId ? Number(staffId) : undefined,
      };

      await updateVisitPattern(pattern.id, input);
      onUpdated();
      handleClose();
    } catch (err) {
      console.error('Failed to update pattern:', err);
      setError('パターンの更新に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!pattern) return;
    
    setDeleting(true);
    setError('');

    try {
      await deleteVisitPattern(pattern.id);
      onDeleted();
      handleClose();
    } catch (err) {
      console.error('Failed to delete pattern:', err);
      setError('パターンの削除に失敗しました');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Sort staffs by group for display
  const staffsWithGroupLabels = useMemo(() => {
    const groupMap = new Map<number, Group>();
    groups.forEach(g => groupMap.set(g.id, g));

    return staffs.map(staff => {
      let groupName = '未所属';
      if (staff.group_id) {
        const group = groupMap.get(staff.group_id);
        if (group) {
          const parent = group.parent_id ? groupMap.get(group.parent_id) : null;
          groupName = parent ? `${parent.name} > ${group.name}` : group.name;
        }
      }
      return { ...staff, groupLabel: groupName };
    });
  }, [staffs, groups]);

  if (!isOpen || !pattern) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Panel */}
      <div
        className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-16 sm:right-4 sm:bottom-4 w-full sm:w-96 bg-white shadow-2xl sm:border sm:border-gray-200 sm:rounded-xl z-50 transform transition-transform duration-200 ease-out flex flex-col max-h-[85vh] sm:max-h-none rounded-t-2xl sm:rounded-xl ${
          isVisible ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-y-0 sm:translate-x-[120%]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-emerald-50 rounded-t-2xl sm:rounded-t-xl">
          <h2 className="text-lg font-semibold text-emerald-800">週間パターン編集</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-emerald-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Day of Week */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  曜日
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((dow) => (
                    <button
                      key={dow}
                      type="button"
                      onClick={() => setDayOfWeek(dow)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        dayOfWeek === dow
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {DAY_NAMES[dow]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="w-4 h-4 inline mr-1" />
                    開始時間
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    所要時間
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value={30}>30分</option>
                    <option value={60}>1時間</option>
                    <option value={90}>1時間30分</option>
                    <option value={120}>2時間</option>
                  </select>
                </div>
              </div>

              {/* Patient */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  患者 <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={patients.map(p => ({ value: p.id, label: p.name }))}
                  value={patientId}
                  onChange={(val) => setPatientId(val as number)}
                  placeholder="患者を選択..."
                />
              </div>

              {/* Staff (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  担当スタッフ（任意）
                </label>
                <SearchableSelect
                  options={[
                    { value: '', label: '未割当' },
                    ...staffsWithGroupLabels.map(s => ({ 
                      value: s.id, 
                      label: `${s.name} (${s.groupLabel})` 
                    }))
                  ]}
                  value={staffId}
                  onChange={(val) => setStaffId(val as number | '')}
                  placeholder="スタッフを選択..."
                />
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2">
                <Button
                  type="submit"
                  disabled={submitting || !patientId}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {submitting ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      変更を保存
                    </>
                  )}
                </Button>

                {/* Delete Button */}
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-2 px-4 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    このパターンを削除
                  </button>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700 mb-2">本当に削除しますか？</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                        disabled={deleting}
                      >
                        キャンセル
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm flex items-center justify-center"
                        disabled={deleting}
                      >
                        {deleting ? <Spinner size="sm" /> : '削除する'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
