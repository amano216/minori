import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchPatient, createPatient, updatePatient, type PatientInput } from '../api/client';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Label } from '../components/atoms/Label';
import { Spinner } from '../components/atoms/Spinner';
import { Card } from '../components/molecules/Card';
import { PageHeader } from '../components/templates/ListLayout';

const CARE_REQUIREMENTS = [
  { value: 'nursing_care', label: '看護ケア' },
  { value: 'rehabilitation', label: 'リハビリ' },
  { value: 'medication_management', label: '服薬管理' },
  { value: 'wound_care', label: '創傷ケア' },
  { value: 'vital_check', label: 'バイタル測定' },
  { value: 'bathing_assistance', label: '入浴介助' },
  { value: 'meal_assistance', label: '食事介助' },
];

export function PatientFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('active');
  const [careRequirements, setCareRequirements] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const loadPatient = async () => {
      try {
        const patient = await fetchPatient(Number(id));
        setName(patient.name);
        setAddress(patient.address || '');
        setPhone(patient.phone || '');
        setStatus(patient.status);
        setCareRequirements(patient.care_requirements);
        setNotes(patient.notes || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : '患者の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    loadPatient();
  }, [id]);

  const handleCareRequirementChange = (req: string) => {
    setCareRequirements((prev) =>
      prev.includes(req) ? prev.filter((r) => r !== req) : [...prev, req]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const patientData: PatientInput = {
      name,
      address,
      phone,
      status,
      care_requirements: careRequirements,
      notes,
    };

    try {
      if (isEdit && id) {
        await updatePatient(Number(id), patientData);
      } else {
        await createPatient(patientData);
      }
      navigate('/patients');
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
        title={isEdit ? '患者編集' : '患者登録'}
        breadcrumbs={[
          { label: '患者一覧', href: '/patients' },
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
              placeholder="例: 田中 花子"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">住所</Label>
            <Input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={submitting}
              placeholder="例: 東京都渋谷区..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">電話番号</Label>
            <Input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={submitting}
              placeholder="例: 03-1234-5678"
            />
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
              <option value="active">利用中</option>
              <option value="inactive">休止中</option>
              <option value="discharged">退所</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>ケア内容</Label>
            <div className="flex flex-wrap gap-3">
              {CARE_REQUIREMENTS.map((req) => (
                <label
                  key={req.value}
                  className="flex items-center gap-2 cursor-pointer text-sm text-text-black"
                >
                  <input
                    type="checkbox"
                    checked={careRequirements.includes(req.value)}
                    onChange={() => handleCareRequirementChange(req.value)}
                    disabled={submitting}
                    className="w-4 h-4 text-main border-border rounded focus:ring-main"
                  />
                  {req.label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">備考</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main resize-y"
              placeholder="患者に関する補足情報..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? '保存中...' : '保存'}
            </Button>
            <Link to="/patients">
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
