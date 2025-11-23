import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  fetchVisit,
  createVisit,
  updateVisit,
  fetchStaffs,
  fetchPatients,
  type VisitInput,
  type Staff,
  type Patient,
} from '../api/client';

export function VisitFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [staffId, setStaffId] = useState<number | ''>('');
  const [patientId, setPatientId] = useState<number | ''>('');
  const [status, setStatus] = useState('scheduled');
  const [notes, setNotes] = useState('');

  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [staffsData, patientsData] = await Promise.all([
          fetchStaffs({ status: 'active' }),
          fetchPatients({ status: 'active' }),
        ]);
        setStaffs(staffsData);
        setPatients(patientsData);

        if (id) {
          const visit = await fetchVisit(Number(id));
          const date = new Date(visit.scheduled_at);
          setScheduledDate(date.toISOString().split('T')[0]);
          setScheduledTime(date.toTimeString().slice(0, 5));
          setDuration(visit.duration);
          setStaffId(visit.staff_id || '');
          setPatientId(visit.patient_id);
          setStatus(visit.status);
          setNotes(visit.notes || '');
        } else {
          // Default to today
          setScheduledDate(new Date().toISOString().split('T')[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

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
      status: staffId ? status : 'unassigned',
      notes,
    };

    try {
      if (isEdit && id) {
        await updateVisit(Number(id), visitData);
      } else {
        await createVisit(visitData);
      }
      navigate('/visits');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">読み込み中...</div>;

  return (
    <div className="visit-form">
      <h1>{isEdit ? '訪問予定編集' : '訪問予定登録'}</h1>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="patient">患者 *</label>
          <select
            id="patient"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value ? Number(e.target.value) : '')}
            required
            disabled={submitting}
          >
            <option value="">選択してください</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="staff">担当スタッフ</label>
          <select
            id="staff"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value ? Number(e.target.value) : '')}
            disabled={submitting}
          >
            <option value="">未割当</option>
            {staffs.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">日付 *</label>
            <input
              type="date"
              id="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="time">時刻 *</label>
            <input
              type="time"
              id="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              required
              disabled={submitting}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="duration">所要時間（分）</label>
          <select
            id="duration"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            disabled={submitting}
          >
            <option value={30}>30分</option>
            <option value={45}>45分</option>
            <option value={60}>60分</option>
            <option value={90}>90分</option>
            <option value={120}>120分</option>
          </select>
        </div>

        {isEdit && (
          <div className="form-group">
            <label htmlFor="status">ステータス</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={submitting}
            >
              <option value="scheduled">予定</option>
              <option value="in_progress">実施中</option>
              <option value="completed">完了</option>
              <option value="cancelled">キャンセル</option>
              <option value="unassigned">未割当</option>
            </select>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="notes">備考</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={submitting}
            rows={4}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? '保存中...' : '保存'}
          </button>
          <Link to="/visits" className="btn">
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}
