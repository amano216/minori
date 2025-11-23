import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchPatient, createPatient, updatePatient, type PatientInput } from '../api/client';

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

  if (loading) return <div className="loading">読み込み中...</div>;

  return (
    <div className="patient-form">
      <h1>{isEdit ? '患者編集' : '患者登録'}</h1>

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
          <label htmlFor="address">住所</label>
          <input
            type="text"
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">電話番号</label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
            <option value="active">利用中</option>
            <option value="inactive">休止中</option>
            <option value="discharged">退所</option>
          </select>
        </div>

        <div className="form-group">
          <label>ケア内容</label>
          <div className="checkbox-group">
            {CARE_REQUIREMENTS.map((req) => (
              <label key={req.value} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={careRequirements.includes(req.value)}
                  onChange={() => handleCareRequirementChange(req.value)}
                  disabled={submitting}
                />
                {req.label}
              </label>
            ))}
          </div>
        </div>

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
          <Link to="/patients" className="btn">
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}
