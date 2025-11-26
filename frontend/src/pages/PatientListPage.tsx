import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchPatients, deletePatient, type Patient } from '../api/client';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { Spinner } from '../components/atoms/Spinner';
import { DataTable } from '../components/organisms/DataTable';
import { ListLayout } from '../components/templates/ListLayout';
import { Modal } from '../components/molecules/Modal';

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

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  inactive: 'warning',
  discharged: 'error',
};

export function PatientListPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);

  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchPatients(statusFilter ? { status: statusFilter } : undefined);
      setPatients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '患者の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePatient(deleteTarget.id);
      setPatients(patients.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    }
  };

  const columns = [
    {
      key: 'name',
      header: '名前',
      minWidth: 'min-w-[100px]',
      render: (patient: Patient) => (
        <Link to={`/patients/${patient.id}`} className="text-main hover:underline font-medium whitespace-nowrap">
          {patient.name}
        </Link>
      ),
    },
    {
      key: 'address',
      header: '住所',
      minWidth: 'min-w-[120px]',
      render: (patient: Patient) => (
        <span className="text-text-grey text-xs sm:text-sm">{patient.address || '-'}</span>
      ),
    },
    {
      key: 'phone',
      header: '電話番号',
      minWidth: 'min-w-[100px]',
      render: (patient: Patient) => (
        <span className="text-text-grey whitespace-nowrap">{patient.phone || '-'}</span>
      ),
    },
    {
      key: 'care_requirements',
      header: 'ケア内容',
      minWidth: 'min-w-[120px]',
      render: (patient: Patient) => (
        <div className="flex flex-wrap gap-1">
          {patient.care_requirements.length > 0 ? (
            patient.care_requirements.slice(0, 2).map((r) => (
              <Badge key={r} variant="default" size="sm">
                {CARE_REQUIREMENT_LABELS[r] || r}
              </Badge>
            ))
          ) : (
            <span className="text-text-grey">-</span>
          )}
          {patient.care_requirements.length > 2 && (
            <Badge variant="default" size="sm">
              +{patient.care_requirements.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'ステータス',
      minWidth: 'min-w-[80px]',
      render: (patient: Patient) => (
        <Badge variant={STATUS_VARIANTS[patient.status] || 'default'}>
          {STATUS_LABELS[patient.status] || patient.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      minWidth: 'min-w-[120px]',
      render: (patient: Patient) => (
        <div className="flex gap-1 sm:gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/patients/${patient.id}/edit`)}
          >
            編集
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteTarget(patient)}
          >
            削除
          </Button>
        </div>
      ),
    },
  ];

  const filterContent = (
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main"
    >
      <option value="">すべてのステータス</option>
      <option value="active">利用中</option>
      <option value="inactive">休止中</option>
      <option value="discharged">退所</option>
    </select>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <ListLayout
        title="患者/利用者管理"
        description={`${patients.length}件の患者が登録されています`}
        actions={
          <Button variant="primary" onClick={() => navigate('/patients/new')}>
            新規登録
          </Button>
        }
        filters={filterContent}
      >
        {error && (
          <div className="bg-danger-100 border border-danger-300 text-danger rounded-md p-3 text-sm mb-4">
            {error}
          </div>
        )}

        {patients.length === 0 ? (
          <div className="text-center py-12 text-text-grey">
            患者が登録されていません
          </div>
        ) : (
          <DataTable
            data={patients}
            columns={columns}
            keyExtractor={(patient) => patient.id}
          />
        )}
      </ListLayout>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="患者の削除"
      >
        <p className="text-text-grey mb-6">
          <span className="font-medium text-text-black">{deleteTarget?.name}</span>
          を削除しますか？この操作は取り消せません。
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            キャンセル
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            削除する
          </Button>
        </div>
      </Modal>
    </>
  );
}
