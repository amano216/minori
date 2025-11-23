import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchStaff, createStaff, updateStaff, type StaffInput } from '../api/client';

const QUALIFICATIONS = [
  { value: 'nurse', label: '看護師' },
  { value: 'physical_therapist', label: '理学療法士' },
  { value: 'occupational_therapist', label: '作業療法士' },
  { value: 'speech_therapist', label: '言語聴覚士' },
  { value: 'care_worker', label: '介護福祉士' },
];

const DAYS = [
  { value: 'monday', label: '月曜日' },
  { value: 'tuesday', label: '火曜日' },
  { value: 'wednesday', label: '水曜日' },
  { value: 'thursday', label: '木曜日' },
  { value: 'friday', label: '金曜日' },
  { value: 'saturday', label: '土曜日' },
  { value: 'sunday', label: '日曜日' },
];

export function StaffFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('active');
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [availableHours, setAvailableHours] = useState<Record<string, { start: string; end: string }>>({});
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const loadStaff = async () => {
      try {
        const staff = await fetchStaff(Number(id));
        setName(staff.name);
        setEmail(staff.email);
        setStatus(staff.status);
        setQualifications(staff.qualifications);
        setAvailableHours(staff.available_hours);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'スタッフの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    loadStaff();
  }, [id]);

  const handleQualificationChange = (qual: string) => {
    setQualifications((prev) =>
      prev.includes(qual) ? prev.filter((q) => q !== qual) : [...prev, qual]
    );
  };

  const handleHoursChange = (day: string, field: 'start' | 'end', value: string) => {
    setAvailableHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const toggleDay = (day: string) => {
    setAvailableHours((prev) => {
      if (prev[day]) {
        const { [day]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [day]: { start: '09:00', end: '17:00' } };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const staffData: StaffInput = {
      name,
      email,
      status,
      qualifications,
      available_hours: availableHours,
    };

    try {
      if (isEdit && id) {
        await updateStaff(Number(id), staffData);
      } else {
        await createStaff(staffData);
      }
      navigate('/staffs');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">読み込み中...</div>;

  return (
    <div className="staff-form">
      <h1>{isEdit ? 'スタッフ編集' : 'スタッフ登録'}</h1>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">名前 *</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">メールアドレス *</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="status">ステータス</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={submitting}
          >
            <option value="active">在籍</option>
            <option value="inactive">退職</option>
            <option value="on_leave">休職</option>
          </select>
        </div>

        <div className="form-group">
          <label>資格</label>
          <div className="checkbox-group">
            {QUALIFICATIONS.map((qual) => (
              <label key={qual.value} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={qualifications.includes(qual.value)}
                  onChange={() => handleQualificationChange(qual.value)}
                  disabled={submitting}
                />
                {qual.label}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>勤務可能時間</label>
          <div className="hours-grid">
            {DAYS.map((day) => (
              <div key={day.value} className="hours-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={Boolean(availableHours[day.value])}
                    onChange={() => toggleDay(day.value)}
                    disabled={submitting}
                  />
                  {day.label}
                </label>
                {availableHours[day.value] && (
                  <div className="hours-inputs">
                    <input
                      type="time"
                      value={availableHours[day.value]?.start || '09:00'}
                      onChange={(e) => handleHoursChange(day.value, 'start', e.target.value)}
                      disabled={submitting}
                    />
                    <span>〜</span>
                    <input
                      type="time"
                      value={availableHours[day.value]?.end || '17:00'}
                      onChange={(e) => handleHoursChange(day.value, 'end', e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? '保存中...' : '保存'}
          </button>
          <Link to="/staffs" className="btn">
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}
