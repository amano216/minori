import { useState, useEffect } from 'react';
import {
  fetchPatients,
  fetchStaffs,
  createVisit,
  updateVisit,
  type Patient,
  type Staff,
  type GanttVisit,
} from '../api/client';
import { Modal } from './molecules/Modal';
import { Button } from './atoms/Button';
import { Label } from './atoms/Label';

interface VisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  visit?: GanttVisit | null;
  defaultDate?: string;
  defaultTime?: string;
  defaultStaffId?: number | null;
}

export function VisitModal({
  isOpen,
  onClose,
  onSave,
  visit,
  defaultDate,
  defaultTime,
  defaultStaffId,
}: VisitModalProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [patientId, setPatientId] = useState<number | ''>('');
  const [staffId, setStaffId] = useState<number | '' | null>('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        fetchPatients({ status: 'active' }),
        fetchStaffs({ status: 'active' }),
      ]).then(([patientsData, staffsData]) => {
        setPatients(patientsData);
        setStaffs(staffsData);
      });

      if (visit) {
        setPatientId(visit.patient.id);
        setStaffId(visit.staff_id ?? '');
        setScheduledAt(visit.scheduled_at.slice(0, 16));
        setDuration(visit.duration);
        setNotes(visit.notes || '');
      } else {
        setPatientId('');
        setStaffId(defaultStaffId ?? '');
        const time = defaultTime || '09:00';
        setScheduledAt(defaultDate ? `${defaultDate}T${time}` : '');
        setDuration(60);
        setNotes('');
      }
    }
  }, [isOpen, visit, defaultDate, defaultTime, defaultStaffId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !scheduledAt) {
      setError('患者と予定日時は必須です');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = {
        patient_id: patientId as number,
        staff_id: staffId === '' ? null : (staffId as number | null),
        scheduled_at: scheduledAt,
        duration,
        notes,
      };

      if (visit) {
        await updateVisit(visit.id, data);
      } else {
        await createVisit(data);
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const selectClassName = `
    w-full px-3 py-2 border border-border rounded-md text-sm
    bg-white text-text-black
    focus:outline-none focus:ring-2 focus:ring-main focus:border-main
    min-h-[44px]
  `;

  const inputClassName = `
    w-full px-3 py-2 border border-border rounded-md text-sm
    bg-white text-text-black
    focus:outline-none focus:ring-2 focus:ring-main focus:border-main
    min-h-[44px]
  `;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={visit ? '訪問予定を編集' : '新規訪問予定'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            キャンセル
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? '保存中...' : '保存'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-danger-50 border border-danger-300 text-danger rounded-md p-3 text-sm">
            {error}
          </div>
        )}

        <div>
          <Label required>患者</Label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value ? Number(e.target.value) : '')}
            required
            className={selectClassName}
          >
            <option value="">選択してください</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>担当スタッフ</Label>
          <select
            value={staffId ?? ''}
            onChange={(e) => setStaffId(e.target.value ? Number(e.target.value) : null)}
            className={selectClassName}
          >
            <option value="">未割当</option>
            {staffs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label required>予定日時</Label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
              className={inputClassName}
            />
          </div>

          <div>
            <Label>所要時間</Label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={selectClassName}
            >
              <option value={30}>30分</option>
              <option value={45}>45分</option>
              <option value={60}>60分</option>
              <option value={90}>90分</option>
              <option value={120}>120分</option>
            </select>
          </div>
        </div>

        <div>
          <Label>メモ</Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="訪問に関するメモ"
            className={`${inputClassName} min-h-[80px]`}
          />
        </div>
      </form>
    </Modal>
  );
}
