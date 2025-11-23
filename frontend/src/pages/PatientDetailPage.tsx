import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchPatient, deletePatient, type Patient } from '../api/client';

const CARE_REQUIREMENT_LABELS: Record<string, string> = {
  nursing_care: '看護ケア',
  rehabilitation: 'リハビリ',
  medication_management: '服薬管理',
  wound_care: '創傷ケア',
  vital_check: 'バイタル測定',
  bathing_assistance: '入浴介助',
  meal_assistance: '食事介助',
};

const STATUS_LABELS: Record<string, string> = {
  active: '利用中',
  inactive: '休止中',
  discharged: '退所',
};

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPatient = async () => {
      if (!id) return;
      try {
        const data = await fetchPatient(Number(id));
        setPatient(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '患者の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    loadPatient();
  }, [id]);

  const handleDelete = async () => {
    if (!patient || !confirm(`${patient.name}を削除しますか？`)) return;

    try {
      await deletePatient(patient.id);
      navigate('/patients');
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    }
  };

  if (loading) return <div className="loading">読み込み中...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!patient) return <div className="error-message">患者が見つかりません</div>;

  return (
    <div className="patient-detail">
      <div className="page-header">
        <h1>{patient.name}</h1>
        <div className="header-actions">
          <Link to={`/patients/${patient.id}/edit`} className="btn btn-primary">
            編集
          </Link>
          <button onClick={handleDelete} className="btn btn-danger">
            削除
          </button>
        </div>
      </div>

      <div className="detail-card">
        <dl className="detail-list">
          <div className="detail-item">
            <dt>住所</dt>
            <dd>{patient.address || '-'}</dd>
          </div>
          <div className="detail-item">
            <dt>電話番号</dt>
            <dd>{patient.phone || '-'}</dd>
          </div>
          <div className="detail-item">
            <dt>ステータス</dt>
            <dd>
              <span className={`status-badge status-${patient.status}`}>
                {STATUS_LABELS[patient.status] || patient.status}
              </span>
            </dd>
          </div>
          <div className="detail-item">
            <dt>ケア内容</dt>
            <dd>
              {patient.care_requirements.length > 0
                ? patient.care_requirements.map((r) => CARE_REQUIREMENT_LABELS[r] || r).join(', ')
                : '-'}
            </dd>
          </div>
          <div className="detail-item">
            <dt>備考</dt>
            <dd style={{ whiteSpace: 'pre-wrap' }}>{patient.notes || '-'}</dd>
          </div>
        </dl>
      </div>

      <div className="back-link">
        <Link to="/patients">← 患者一覧に戻る</Link>
      </div>
    </div>
  );
}
