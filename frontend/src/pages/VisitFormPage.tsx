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
import { Button } from '../components/atoms/Button';
import { Label } from '../components/atoms/Label';
import { Spinner } from '../components/atoms/Spinner';
import { Card } from '../components/molecules/Card';
import { PageHeader } from '../components/templates/ListLayout';

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
      navigate('/schedule/visits');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={isEdit ? '訪問予定編集' : '訪問予定登録'}
        breadcrumbs={[
          { label: '訪問予定一覧', href: '/visits' },
          { label: isEdit ? '編集' : '新規登録' },
        ]}
      />

      {error && (
        <div className="bg-danger-100 border border-danger-300 text-danger rounded-md p-3 text-sm mb-4">
          {error}
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <Label htmlFor="patient" required>患者</Label>
            <select
              id="patient"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value ? Number(e.target.value) : '')}
              required
              disabled={submitting}
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main"
            >
              <option value="">選択してください</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="staff">担当スタッフ</Label>
            <select
              id="staff"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value ? Number(e.target.value) : '')}
              disabled={submitting}
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main"
            >
              <option value="">未割当</option>
              {staffs.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="date" required>日付</Label>
              <input
                type="date"
                id="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
                disabled={submitting}
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="time" required>時刻</Label>
              <input
                type="time"
                id="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
                disabled={submitting}
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="duration">所要時間</Label>
            <select
              id="duration"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              disabled={submitting}
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main"
            >
              <option value={30}>30分</option>
              <option value={45}>45分</option>
              <option value={60}>60分</option>
              <option value={90}>90分</option>
              <option value={120}>120分</option>
            </select>
          </div>

          {isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="status">ステータス</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={submitting}
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main"
              >
                <option value="scheduled">予定</option>
                <option value="in_progress">実施中</option>
                <option value="completed">完了</option>
                <option value="cancelled">キャンセル</option>
                <option value="unassigned">未割当</option>
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes">備考</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main resize-y"
              placeholder="訪問に関する補足情報..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? '保存中...' : '保存'}
            </Button>
            <Link to="/visits">
              <Button type="button" variant="secondary" disabled={submitting}>
                キャンセル
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </>
  );
}
