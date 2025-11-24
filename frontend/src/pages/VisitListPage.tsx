import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchVisits, cancelVisit, completeVisit, deleteVisit, type Visit } from '../api/client';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { Spinner } from '../components/atoms/Spinner';
import { DataTable } from '../components/organisms/DataTable';
import { ListLayout } from '../components/templates/ListLayout';
import { Modal } from '../components/molecules/Modal';

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

export function VisitListPage() {
  const navigate = useNavigate();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [actionModal, setActionModal] = useState<{ type: 'complete' | 'cancel' | 'delete'; visit: Visit } | null>(null);

  const loadVisits = async () => {
    try {
      setLoading(true);
      const params: { status?: string; date?: string } = {};
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      const data = await fetchVisits(Object.keys(params).length > 0 ? params : undefined);
      setVisits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '訪問予定の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisits();
  }, [statusFilter, dateFilter]);

  const handleAction = async () => {
    if (!actionModal) return;
    const { type, visit } = actionModal;

    try {
      if (type === 'complete') {
        const updated = await completeVisit(visit.id);
        setVisits(visits.map((v) => (v.id === visit.id ? updated : v)));
      } else if (type === 'cancel') {
        const updated = await cancelVisit(visit.id);
        setVisits(visits.map((v) => (v.id === visit.id ? updated : v)));
      } else if (type === 'delete') {
        await deleteVisit(visit.id);
        setVisits(visits.filter((v) => v.id !== visit.id));
      }
      setActionModal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '処理に失敗しました');
    }
  };

  const columns = [
    {
      key: 'scheduled_at',
      header: '日時',
      render: (visit: Visit) => (
        <Link to={`/visits/${visit.id}`} className="text-main hover:underline font-medium">
          {formatDateTime(visit.scheduled_at)}
        </Link>
      ),
    },
    {
      key: 'patient',
      header: '患者',
      render: (visit: Visit) => (
        <span className="text-text-black">{visit.patient?.name || '-'}</span>
      ),
    },
    {
      key: 'staff',
      header: '担当スタッフ',
      render: (visit: Visit) => (
        <span className={visit.staff ? 'text-text-black' : 'text-text-grey'}>
          {visit.staff?.name || '未割当'}
        </span>
      ),
    },
    {
      key: 'duration',
      header: '時間',
      render: (visit: Visit) => (
        <span className="text-text-grey">{visit.duration}分</span>
      ),
    },
    {
      key: 'status',
      header: 'ステータス',
      render: (visit: Visit) => (
        <Badge variant={STATUS_VARIANTS[visit.status] || 'default'}>
          {STATUS_LABELS[visit.status] || visit.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (visit: Visit) => (
        <div className="flex gap-2 flex-wrap">
          {visit.status === 'scheduled' && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActionModal({ type: 'complete', visit })}
              >
                完了
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActionModal({ type: 'cancel', visit })}
              >
                キャンセル
              </Button>
            </>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/visits/${visit.id}/edit`)}
          >
            編集
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setActionModal({ type: 'delete', visit })}
          >
            削除
          </Button>
        </div>
      ),
    },
  ];

  const filterContent = (
    <div className="flex gap-3 items-center flex-wrap">
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main"
      >
        <option value="">すべてのステータス</option>
        <option value="scheduled">予定</option>
        <option value="in_progress">実施中</option>
        <option value="completed">完了</option>
        <option value="cancelled">キャンセル</option>
        <option value="unassigned">未割当</option>
      </select>
      <input
        type="date"
        value={dateFilter}
        onChange={(e) => setDateFilter(e.target.value)}
        className="px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main"
      />
      {dateFilter && (
        <Button variant="text" size="sm" onClick={() => setDateFilter('')}>
          日付クリア
        </Button>
      )}
    </div>
  );

  const getModalContent = () => {
    if (!actionModal) return { title: '', message: '', buttonLabel: '', buttonVariant: 'primary' as const };
    const { type, visit } = actionModal;
    switch (type) {
      case 'complete':
        return {
          title: '訪問を完了にする',
          message: `${visit.patient?.name || '患者'}への訪問を完了にしますか？`,
          buttonLabel: '完了にする',
          buttonVariant: 'primary' as const,
        };
      case 'cancel':
        return {
          title: '訪問をキャンセル',
          message: `${visit.patient?.name || '患者'}への訪問をキャンセルしますか？`,
          buttonLabel: 'キャンセルする',
          buttonVariant: 'secondary' as const,
        };
      case 'delete':
        return {
          title: '訪問予定の削除',
          message: `${visit.patient?.name || '患者'}への訪問予定を削除しますか？この操作は取り消せません。`,
          buttonLabel: '削除する',
          buttonVariant: 'danger' as const,
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const modalContent = getModalContent();

  return (
    <>
      <ListLayout
        title="訪問予定管理"
        description={`${visits.length}件の訪問予定があります`}
        actions={
          <Button variant="primary" onClick={() => navigate('/visits/new')}>
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

        {visits.length === 0 ? (
          <div className="text-center py-12 text-text-grey">
            訪問予定が登録されていません
          </div>
        ) : (
          <DataTable
            data={visits}
            columns={columns}
            keyExtractor={(visit) => visit.id}
          />
        )}
      </ListLayout>

      {/* Action Confirmation Modal */}
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
