import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPatients, deletePatient, type Patient } from '../api/client';

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

export function PatientListPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await fetchPatients(statusFilter ? { status: statusFilter } : undefined);
      setPatients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '患者の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [statusFilter]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`${name}を削除しますか？`)) return;

    try {
      await deletePatient(id);
      setPatients(patients.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    }
  };

  if (loading) return <div className="loading">読み込み中...</div>;

  return (
    <div className="patient-list">
      <div className="page-header">
        <h1>患者/利用者管理</h1>
        <Link to="/patients/new" className="btn btn-primary">
          新規登録
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filters">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">すべてのステータス</option>
          <option value="active">利用中</option>
          <option value="inactive">休止中</option>
          <option value="discharged">退所</option>
        </select>
      </div>

      {patients.length === 0 ? (
        <p className="no-data">患者が登録されていません</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>名前</th>
              <th>住所</th>
              <th>電話番号</th>
              <th>ケア内容</th>
              <th>ステータス</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id}>
                <td>
                  <Link to={`/patients/${patient.id}`}>{patient.name}</Link>
                </td>
                <td>{patient.address || '-'}</td>
                <td>{patient.phone || '-'}</td>
                <td>
                  {patient.care_requirements
                    .map((r) => CARE_REQUIREMENT_LABELS[r] || r)
                    .join(', ') || '-'}
                </td>
                <td>
                  <span className={`status-badge status-${patient.status}`}>
                    {STATUS_LABELS[patient.status] || patient.status}
                  </span>
                </td>
                <td className="actions">
                  <Link to={`/patients/${patient.id}/edit`} className="btn btn-small">
                    編集
                  </Link>
                  <button
                    onClick={() => handleDelete(patient.id, patient.name)}
                    className="btn btn-small btn-danger"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
