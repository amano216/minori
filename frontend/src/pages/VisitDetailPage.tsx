import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchVisit, deleteVisit, cancelVisit, completeVisit, type Visit } from '../api/client';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { Spinner } from '../components/atoms/Spinner';
import { Card } from '../components/molecules/Card';
import { Modal } from '../components/molecules/Modal';
import { PageHeader } from '../components/templates/ListLayout';

const STATUS_LABELS: Record<string, string> = {
  scheduled: '予定',
  in_progress: '実施中',
  completed: '完了',
  cancelled: 'キャンセル',
  unassigned: '未割当',
};

const STATUS_VARIANTS: Record<string, 'info' | 'warning' | 'success' | 'error' | 'default'> = {
  scheduled: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
  unassigned: 'default',
};

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function VisitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionModal, setActionModal] = useState<'complete' | 'cancel' | 'delete' | null>(null);

  useEffect(() => {
    const loadVisit = async () => {
      if (!id) return;
      try {
        const data = await fetchVisit(Number(id));
        setVisit(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '訪問予定の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    loadVisit();
  }, [id]);

  const handleAction = async () => {
    if (!visit || !actionModal) return;
    try {
      if (actionModal === 'delete') {
        await deleteVisit(visit.id);
        navigate('/visits');
      } else if (actionModal === 'cancel') {
        const updated = await cancelVisit(visit.id);
        setVisit(updated);
      } else if (actionModal === 'complete') {
        const updated = await completeVisit(visit.id);
        setVisit(updated);
      }
      setActionModal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '処理に失敗しました');
    }
  };

  const getModalContent = () => {
    switch (actionModal) {
      case 'complete':
        return {
          title: '訪問を完了にする',
          message: 'この訪問を完了にしますか？',
          buttonLabel: '完了にする',
          buttonVariant: 'primary' as const,
        };
      case 'cancel':
        return {
          title: '訪問をキャンセル',
          message: 'この訪問をキャンセルしますか？',
          buttonLabel: 'キャンセルする',
          buttonVariant: 'secondary' as const,
        };
      case 'delete':
        return {
          title: '訪問予定の削除',
          message: 'この訪問予定を削除しますか？この操作は取り消せません。',
          buttonLabel: '削除する',
          buttonVariant: 'danger' as const,
        };
      default:
        return { title: '', message: '', buttonLabel: '', buttonVariant: 'primary' as const };
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

  if (!visit) {
    return (
      <div className="bg-danger-100 border border-danger-300 text-danger rounded-md p-4">
        訪問予定が見つかりません
      </div>
    );
  }

  const modalContent = getModalContent();

  return (
    <>
      <PageHeader
        title="訪問予定詳細"
        breadcrumbs={[
          { label: '訪問予定一覧', href: '/visits' },
          { label: formatDateTime(visit.scheduled_at) },
        ]}
        action={
          <div className="flex gap-2 flex-wrap">
            {visit.status === 'scheduled' && (
              <>
                <Button variant="primary" onClick={() => setActionModal('complete')}>
                  完了
                </Button>
                <Button variant="secondary" onClick={() => setActionModal('cancel')}>
                  キャンセル
                </Button>
              </>
            )}
            <Button variant="secondary" onClick={() => navigate(`/visits/${visit.id}/edit`)}>
              編集
            </Button>
            <Button variant="danger" onClick={() => setActionModal('delete')}>
              削除
            </Button>
          </div>
        }
      />

      <Card>
        <dl className="divide-y divide-border">
          <div className="py-4 flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-text-grey sm:w-40">日時</dt>
            <dd className="mt-1 sm:mt-0 text-text-black">{formatDateTime(visit.scheduled_at)}</dd>
          </div>
          <div className="py-4 flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-text-grey sm:w-40">所要時間</dt>
            <dd className="mt-1 sm:mt-0 text-text-black">{visit.duration}分</dd>
          </div>
          <div className="py-4 flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-text-grey sm:w-40">患者</dt>
            <dd className="mt-1 sm:mt-0">
              {visit.patient ? (
                <Link to={`/patients/${visit.patient.id}`} className="text-main hover:underline">
                  {visit.patient.name}
                </Link>
              ) : (
                <span className="text-text-grey">-</span>
              )}
            </dd>
          </div>
          <div className="py-4 flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-text-grey sm:w-40">担当スタッフ</dt>
            <dd className="mt-1 sm:mt-0">
              {visit.staff ? (
                <Link to={`/staffs/${visit.staff.id}`} className="text-main hover:underline">
                  {visit.staff.name}
                </Link>
              ) : (
                <span className="text-text-grey">未割当</span>
              )}
            </dd>
          </div>
          <div className="py-4 flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-text-grey sm:w-40">ステータス</dt>
            <dd className="mt-1 sm:mt-0">
              <Badge variant={STATUS_VARIANTS[visit.status] || 'default'}>
                {STATUS_LABELS[visit.status] || visit.status}
              </Badge>
            </dd>
          </div>
          <div className="py-4 flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-text-grey sm:w-40">備考</dt>
            <dd className="mt-1 sm:mt-0 text-text-black whitespace-pre-wrap">
              {visit.notes || '-'}
            </dd>
          </div>
        </dl>
      </Card>

      <div className="mt-6">
        <Link to="/visits" className="text-main hover:underline text-sm">
          ← 訪問予定一覧に戻る
        </Link>
      </div>

      <Modal
        isOpen={!!actionModal}
        onClose={() => setActionModal(null)}
        title={modalContent.title}
      >
        <p className="text-text-grey mb-6">{modalContent.message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setActionModal(null)}>
            戻る
          </Button>
          <Button variant={modalContent.buttonVariant} onClick={handleAction}>
            {modalContent.buttonLabel}
          </Button>
        </div>
      </Modal>
    </>
  );
}
