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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{visit ? '訪問予定を編集' : '新規訪問予定'}</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>患者 *</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value ? Number(e.target.value) : '')}
              required
            >
              <option value="">選択してください</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>担当スタッフ</label>
            <select
              value={staffId ?? ''}
              onChange={(e) => setStaffId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">未割当</option>
              {staffs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>予定日時 *</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>所要時間（分）</label>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                <option value={30}>30分</option>
                <option value={45}>45分</option>
                <option value={60}>60分</option>
                <option value={90}>90分</option>
                <option value={120}>120分</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>メモ</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="訪問に関するメモ"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn" onClick={onClose}>
              キャンセル
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
