import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchPatient, deletePatient, type Patient } from '../api/client';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { Spinner } from '../components/atoms/Spinner';
import { Card } from '../components/molecules/Card';
import { Modal } from '../components/molecules/Modal';
import { PageHeader } from '../components/templates/ListLayout';

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

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'error'> = {
  active: 'success',
  inactive: 'warning',
  discharged: 'error',
};

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
    if (!patient) return;
    try {
      await deletePatient(patient.id);
      navigate('/patients');
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger-100 border border-danger-300 text-danger rounded-md p-4">
        {error}
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="bg-danger-100 border border-danger-300 text-danger rounded-md p-4">
        患者が見つかりません
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={patient.name}
        breadcrumbs={[
          { label: '患者一覧', href: '/patients' },
          { label: patient.name },
        ]}
        action={
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => navigate(`/patients/${patient.id}/edit`)}>
              編集
            </Button>
            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
              削除
            </Button>
          </div>
        }
      />

      <Card>
        <dl className="divide-y divide-border">
          {/* 基本情報 */}
          <div className="py-4 flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-text-grey sm:w-40">利用者コード</dt>
            <dd className="mt-1 sm:mt-0 text-text-black">{patient.patient_code || '-'}</dd>
          </div>
          <div className="py-4 flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-text-grey sm:w-40">フリガナ</dt>
            <dd className="mt-1 sm:mt-0 text-text-black">{patient.name_kana || '-'}</dd>
          </div>
          <div className="py-4 flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-text-grey sm:w-40">生年月日</dt>
            <dd className="mt-1 sm:mt-0 text-text-black">
              {patient.date_of_birth || '-'}
              {patient.age !== undefined && patient.age !== null && (
                <span className="ml-2 text-text-grey">({patient.age}歳)</span>
              )}
            </dd>
          </div>
          <div className="py-4 flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-text-grey sm:w-40">性別</dt>
            <dd className="mt-1 sm:mt-0 text-text-black">{patient.gender || '-'}</dd>
          </div>
          <div className="py-4 flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-text-grey sm:w-40">郵便番号</dt>
            <dd className="mt-1 sm:mt-0 text-text-black">{patient.postal_code || '-'}</dd>
          </div>
          <div className="py-4 flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-text-grey sm:w-40">住所</dt>
            <dd className="mt-1 sm:mt-0 text-text-black">{patient.address || '-'}</dd>
          </div>
          <div className="py-4 flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-text-grey sm:w-40">電話番号</dt>
            <dd className="mt-1 sm:mt-0 text-text-black">
              {patient.phone_numbers && patient.phone_numbers.length > 0 ? (
                <ul className="space-y-1">
                  {patient.phone_numbers.map((pn, idx) => (
                    <li key={idx}>
                      {pn.label ? (
                        <span className="text-text-grey text-sm mr-2">{pn.label}:</span>
                      ) : null}
                      {pn.number}
                    </li>
                  ))}
                </ul>
              ) : '-'}
            </dd>
          </div>
          <div className="py-4 flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-text-grey sm:w-40">ステータス</dt>
            <dd className="mt-1 sm:mt-0">
              <Badge variant={STATUS_VARIANTS[patient.status] || 'default'}>
                {STATUS_LABELS[patient.status] || patient.status}
              </Badge>
            </dd>
          </div>
          <div className="py-4 flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-text-grey sm:w-40">ケア内容</dt>
            <dd className="mt-1 sm:mt-0">
              {patient.care_requirements.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {patient.care_requirements.map((r) => (
                    <Badge key={r} variant="primary">
                      {CARE_REQUIREMENT_LABELS[r] || r}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-text-grey">-</span>
              )}
            </dd>
          </div>
          <div className="py-4 flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-text-grey sm:w-40">備考</dt>
            <dd className="mt-1 sm:mt-0 text-text-black whitespace-pre-wrap">
              {patient.notes || '-'}
            </dd>
          </div>
        </dl>
      </Card>

      <div className="mt-6">
        <Link to="/patients" className="text-main hover:underline text-sm">
          ← 患者一覧に戻る
        </Link>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="患者の削除"
      >
        <p className="text-text-grey mb-6">
          <span className="font-medium text-text-black">{patient.name}</span>
          を削除しますか？この操作は取り消せません。
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
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
