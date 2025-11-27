import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchPatient, createPatient, updatePatient, type PatientInput, type PhoneNumber } from '../api/client';
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

const GENDER_OPTIONS = [
  { value: '', label: '選択してください' },
  { value: '男', label: '男性' },
  { value: '女', label: '女性' },
];

const PHONE_LABEL_OPTIONS = [
  { value: '電話', label: '電話' },
  { value: '自宅', label: '自宅' },
  { value: '携帯', label: '携帯' },
  { value: '勤務先', label: '勤務先' },
  { value: '緊急連絡先', label: '緊急連絡先' },
  { value: 'FAX', label: 'FAX' },
  { value: 'その他', label: 'その他' },
];

export function PatientFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [nameKana, setNameKana] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([{ number: '', label: '電話' }]);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [patientCode, setPatientCode] = useState('');
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
        setNameKana(patient.name_kana || '');
        setPostalCode(patient.postal_code || '');
        setAddress(patient.address || '');
        setPhoneNumbers(patient.phone_numbers?.length > 0 
          ? patient.phone_numbers 
          : [{ number: '', label: '電話' }]);
        setDateOfBirth(patient.date_of_birth || '');
        setGender(patient.gender || '');
        setPatientCode(patient.patient_code || '');
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
      name_kana: nameKana || undefined,
      postal_code: postalCode || undefined,
      address: address || undefined,
      phone: phone || undefined,
      date_of_birth: dateOfBirth || undefined,
      gender: gender || undefined,
      patient_code: patientCode || undefined,
      status,
      care_requirements: careRequirements,
      notes: notes || undefined,
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

  // 年齢を計算
  const calculateAge = (dob: string): number | null => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const age = calculateAge(dateOfBirth);

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
          {/* 基本情報 */}
          <div className="border-b border-border pb-4">
            <h3 className="text-sm font-semibold text-text-black mb-4">基本情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="patientCode">利用者コード</Label>
                <Input
                  type="text"
                  id="patientCode"
                  value={patientCode}
                  onChange={(e) => setPatientCode(e.target.value)}
                  disabled={submitting}
                  placeholder="例: 0000001935"
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

              <div className="space-y-1.5">
                <Label htmlFor="name" required>氏名</Label>
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
                <Label htmlFor="nameKana">フリガナ</Label>
                <Input
                  type="text"
                  id="nameKana"
                  value={nameKana}
                  onChange={(e) => setNameKana(e.target.value)}
                  disabled={submitting}
                  placeholder="例: タナカ ハナコ"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dateOfBirth">生年月日</Label>
                <Input
                  type="date"
                  id="dateOfBirth"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  disabled={submitting}
                />
                {age !== null && (
                  <p className="text-sm text-text-gray">年齢: {age}歳</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gender">性別</Label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main"
                >
                  {GENDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 連絡先情報 */}
          <div className="border-b border-border pb-4">
            <h3 className="text-sm font-semibold text-text-black mb-4">連絡先情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="postalCode">郵便番号</Label>
                <Input
                  type="text"
                  id="postalCode"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  disabled={submitting}
                  placeholder="例: 123-4567"
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

              <div className="space-y-1.5 md:col-span-2">
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
            </div>
          </div>

          {/* ケア情報 */}
          <div className="border-b border-border pb-4">
            <h3 className="text-sm font-semibold text-text-black mb-4">ケア情報</h3>
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
          </div>

          {/* 備考 */}
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
