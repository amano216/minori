import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchStaff, createStaff, updateStaff, fetchGroups, type StaffInput, type Group } from '../api/client';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Label } from '../components/atoms/Label';
import { Spinner } from '../components/atoms/Spinner';
import { Card } from '../components/molecules/Card';
import { PageHeader } from '../components/templates/ListLayout';

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
  const [groupId, setGroupId] = useState<number | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const groupsData = await fetchGroups();
        setGroups(groupsData);

        if (id) {
          const staff = await fetchStaff(Number(id));
          setName(staff.name);
          setEmail(staff.email);
          setStatus(staff.status);
          setQualifications(staff.qualifications);
          setAvailableHours(staff.available_hours);
          setGroupId(staff.group_id || null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    loadData();
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      group_id: groupId,
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
        title={isEdit ? 'スタッフ編集' : 'スタッフ登録'}
        breadcrumbs={[
          { label: 'スタッフ一覧', href: '/staffs' },
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
            <Label htmlFor="name" required>名前</Label>
            <Input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={submitting}
              placeholder="例: 山田 太郎"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" required>メールアドレス</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
              placeholder="例: yamada@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="group">所属グループ</Label>
            <select
              id="group"
              value={groupId || ''}
              onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : null)}
              disabled={submitting}
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main"
            >
              <option value="">未所属</option>
              {groups.filter(g => g.group_type === 'office').map(office => (
                <optgroup key={office.id} label={office.name}>
                  <option value={office.id}>{office.name} (事業所)</option>
                  {groups.filter(g => g.parent_id === office.id).map(team => (
                    <option key={team.id} value={team.id}>
                      &nbsp;&nbsp;{team.name} (チーム)
                    </option>
                  ))}
                </optgroup>
              ))}
              {/* Orphan teams or other groups */}
              {groups.filter(g => !g.parent_id && g.group_type !== 'office').map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status">ステータス</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main"
            >
              <option value="active">在籍</option>
              <option value="inactive">退職</option>
              <option value="on_leave">休職</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>資格</Label>
            <div className="flex flex-wrap gap-3">
              {QUALIFICATIONS.map((qual) => (
                <label
                  key={qual.value}
                  className="flex items-center gap-2 cursor-pointer text-sm text-text-black"
                >
                  <input
                    type="checkbox"
                    checked={qualifications.includes(qual.value)}
                    onChange={() => handleQualificationChange(qual.value)}
                    disabled={submitting}
                    className="w-4 h-4 text-main border-border rounded focus:ring-main"
                  />
                  {qual.label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>勤務可能時間</Label>
            <div className="space-y-3">
              {DAYS.map((day) => (
                <div key={day.value} className="flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-text-black w-24">
                    <input
                      type="checkbox"
                      checked={Boolean(availableHours[day.value])}
                      onChange={() => toggleDay(day.value)}
                      disabled={submitting}
                      className="w-4 h-4 text-main border-border rounded focus:ring-main"
                    />
                    {day.label}
                  </label>
                  {availableHours[day.value] && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={availableHours[day.value]?.start || '09:00'}
                        onChange={(e) => handleHoursChange(day.value, 'start', e.target.value)}
                        disabled={submitting}
                        className="px-2 py-1.5 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-main"
                      />
                      <span className="text-text-grey">〜</span>
                      <input
                        type="time"
                        value={availableHours[day.value]?.end || '17:00'}
                        onChange={(e) => handleHoursChange(day.value, 'end', e.target.value)}
                        disabled={submitting}
                        className="px-2 py-1.5 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-main"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? '保存中...' : '保存'}
            </Button>
            <Link to="/staffs">
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
