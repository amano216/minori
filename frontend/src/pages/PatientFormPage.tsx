import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchPatient, createPatient, updatePatient, fetchGroups, type PatientInput, type PhoneNumber, type Group } from '../api/client';
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

// 電話番号ラベルのサジェスト候補（自由入力も可能）
const PHONE_LABEL_SUGGESTIONS = [
  '本人携帯',
  '本人自宅',
  '配偶者',
  '長男',
  '長女',
  '次男',
  '次女',
  'ケアマネ',
  '緊急連絡先',
  'FAX',
];

export function PatientFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [nameKana, setNameKana] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([{ number: '', label: '' }]);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [patientCode, setPatientCode] = useState('');
  const [groupId, setGroupId] = useState<number | undefined>(undefined);
  const [groups, setGroups] = useState<Group[]>([]);
  const [status, setStatus] = useState('active');
  const [careRequirements, setCareRequirements] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // グループ一覧を取得
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await fetchGroups();
        setGroups(data);
      } catch (err) {
        console.error('グループの取得に失敗しました:', err);
      }
    };
    loadGroups();
  }, []);

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
          : [{ number: '', label: '' }]);
        setDateOfBirth(patient.date_of_birth || '');
        setGender(patient.gender || '');
        setPatientCode(patient.patient_code || '');
        setGroupId(patient.group_id || undefined);
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

  const handlePhoneNumberChange = (index: number, field: 'number' | 'label', value: string) => {
    setPhoneNumbers((prev) => {
      const newNumbers = [...prev];
      newNumbers[index] = { ...newNumbers[index], [field]: value };
      return newNumbers;
    });
  };

  const addPhoneNumber = () => {
    setPhoneNumbers((prev) => [...prev, { number: '', label: '' }]);
  };

  const removePhoneNumber = (index: number) => {
    setPhoneNumbers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    // 空の電話番号を除外
    const validPhoneNumbers = phoneNumbers.filter(pn => pn.number.trim() !== '');

    const patientData: PatientInput = {
      name,
      name_kana: nameKana || undefined,
      postal_code: postalCode || undefined,
      address: address || undefined,
      phone_numbers: validPhoneNumbers.length > 0 ? validPhoneNumbers : undefined,
      date_of_birth: dateOfBirth || undefined,
      gender: gender || undefined,
      patient_code: patientCode || undefined,
      group_id: groupId,
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
                <Label htmlFor="groupId">担当グループ</Label>
                <select
                  id="groupId"
                  value={groupId || ''}
                  onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : undefined)}
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main"
                >
                  <option value="">選択してください</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
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

            {/* 電話番号 */}
            <div className="mt-4 space-y-2">
              <Label>電話番号</Label>
              <p className="text-xs text-text-gray mb-2">備考欄には関係性（本人、配偶者、長男など）を自由に入力できます</p>
              {phoneNumbers.map((pn, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="relative w-32">
                    <Input
                      type="text"
                      value={pn.label || ''}
                      onChange={(e) => handlePhoneNumberChange(index, 'label', e.target.value)}
                      disabled={submitting}
                      placeholder="例: 本人携帯"
                      list={`phone-label-suggestions-${index}`}
                      className="w-full"
                    />
                    <datalist id={`phone-label-suggestions-${index}`}>
                      {PHONE_LABEL_SUGGESTIONS.map((suggestion) => (
                        <option key={suggestion} value={suggestion} />
                      ))}
                    </datalist>
                  </div>
                  <Input
                    type="tel"
                    value={pn.number}
                    onChange={(e) => handlePhoneNumberChange(index, 'number', e.target.value)}
                    disabled={submitting}
                    placeholder="例: 03-1234-5678"
                    className="flex-1"
                  />
                  {phoneNumbers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePhoneNumber(index)}
                      disabled={submitting}
                      className="p-2 text-text-gray hover:text-danger transition-colors"
                      title="削除"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addPhoneNumber}
                disabled={submitting}
                className="flex items-center gap-1 text-sm text-main hover:text-main-dark transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                電話番号を追加
              </button>
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
