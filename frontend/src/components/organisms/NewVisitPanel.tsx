import { useState, useEffect, type FormEvent } from 'react';
import { X, User, Calendar, Clock, FileText, Save, Plus } from 'lucide-react';
import {
  createVisit,
  fetchStaffs,
  fetchPatients,
  type VisitInput,
  type Staff,
  type Patient,
} from '../../api/client';
import { Button } from '../atoms/Button';
import { Spinner } from '../atoms/Spinner';

interface NewVisitPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  initialDate?: Date;
  initialStaffId?: number;
  initialPlanningLaneId?: number;
}

export function NewVisitPanel({
  isOpen,
  onClose,
  onCreated,
  initialDate,
  initialStaffId,
  initialPlanningLaneId,
}: NewVisitPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Form State
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [staffId, setStaffId] = useState<number | ''>('');
  const [patientId, setPatientId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [planningLaneId, setPlanningLaneId] = useState<number | null>(null);

  // Data State
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
      loadMasterData();
      
      // Initialize form with props
      if (initialDate) {
        // Use local time components to avoid UTC shift issues
        const year = initialDate.getFullYear();
        const month = String(initialDate.getMonth() + 1).padStart(2, '0');
        const day = String(initialDate.getDate()).padStart(2, '0');
        setScheduledDate(`${year}-${month}-${day}`);
        
        setScheduledTime(initialDate.toTimeString().slice(0, 5));
      } else {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        setScheduledDate(`${year}-${month}-${day}`);
      }
      
      if (initialStaffId) {
        setStaffId(initialStaffId);
      }

      if (initialPlanningLaneId) {
        setPlanningLaneId(initialPlanningLaneId);
      } else {
        setPlanningLaneId(null);
      }
    } else {
      setIsVisible(false);
    }
  }, [isOpen, initialDate, initialStaffId, initialPlanningLaneId]);

  const loadMasterData = async () => {
    try {
      setLoading(true);
      const [staffsData, patientsData] = await Promise.all([
        fetchStaffs({ status: 'active' }),
        fetchPatients({ status: 'active' }),
      ]);
      setStaffs(staffsData);
      setPatients(patientsData);
    } catch (err: unknown) {
      console.error('Failed to load master data:', err);
      setError('マスターデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!patientId) {
      setError('患者を選択してください');
      return;
    }

    setSubmitting(true);

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();

    const visitData: VisitInput = {
      scheduled_at: scheduledAt,
      duration,
      staff_id: staffId || null,
      patient_id: patientId as number,
      status: staffId ? 'scheduled' : 'unassigned',
      notes,
      planning_lane_id: planningLaneId,
    };

    try {
      await createVisit(visitData);
      onCreated();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Panel - No Backdrop, allows interaction with background */}
      <div
        className={`fixed top-16 right-4 bottom-4 w-96 bg-white/95 backdrop-blur-sm shadow-2xl border border-gray-200 rounded-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isVisible ? 'translate-x-0' : 'translate-x-[120%]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
            <Plus className="w-6 h-6 text-indigo-600" />
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <form id="new-visit-form" onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
                <select
                  id="patient"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value ? Number(e.target.value) : '')}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">患者を選択...</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-indigo-500" />
                </div>
                <select
                  id="staff"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value ? Number(e.target.value) : '')}
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">未割り当て</option>
                  {staffs.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-gray-500" />
                  </div>
                  <input
                    type="date"
                    id="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    required
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                  </div>
                  <input
                    type="time"
                    id="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    required
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-gray-500" />
                </div>
                <select
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={30}>30分</option>
                  <option value={45}>45分</option>
                  <option value={60}>60分</option>
                  <option value={90}>90分</option>
                  <option value={120}>120分</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-gray-500" />
                </div>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={submitting}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                  placeholder="..."
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl flex justify-end gap-4">
          <Button variant="secondary" onClick={handleClose} disabled={submitting} className="h-14 w-14 p-0 flex items-center justify-center rounded-full shadow-sm hover:shadow-md transition-all" title="キャンセル">
            <X className="w-8 h-8" />
          </Button>
          <Button type="submit" form="new-visit-form" variant="primary" disabled={submitting} className="h-14 w-14 p-0 flex items-center justify-center rounded-full shadow-md hover:shadow-lg transition-all" title="保存">
            <Save className="w-8 h-8" />
          </Button>
        </div>
      </div>
    </>
  );
}
