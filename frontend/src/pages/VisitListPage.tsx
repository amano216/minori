import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchVisits, cancelVisit, completeVisit, deleteVisit, type Visit } from '../api/client';

const STATUS_LABELS: Record<string, string> = {
  scheduled: '予定',
  in_progress: '実施中',
  completed: '完了',
  cancelled: 'キャンセル',
  unassigned: '未割当',
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'status-scheduled',
  in_progress: 'status-in-progress',
  completed: 'status-completed',
  cancelled: 'status-cancelled',
  unassigned: 'status-unassigned',
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
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

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

  const handleCancel = async (id: number) => {
    if (!confirm('この訪問をキャンセルしますか？')) return;
    try {
      const updated = await cancelVisit(id);
      setVisits(visits.map((v) => (v.id === id ? updated : v)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'キャンセルに失敗しました');
    }
  };

  const handleComplete = async (id: number) => {
    if (!confirm('この訪問を完了にしますか？')) return;
    try {
      const updated = await completeVisit(id);
      setVisits(visits.map((v) => (v.id === id ? updated : v)));
    } catch (err) {
      setError(err instanceof Error ? err.message : '完了処理に失敗しました');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この訪問予定を削除しますか？')) return;
    try {
      await deleteVisit(id);
      setVisits(visits.filter((v) => v.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    }
  };

  if (loading) return <div className="loading">読み込み中...</div>;

  return (
    <div className="visit-list">
      <div className="page-header">
        <h1>訪問予定管理</h1>
        <Link to="/visits/new" className="btn btn-primary">
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
          className="filter-input"
        />
        {dateFilter && (
          <button onClick={() => setDateFilter('')} className="btn btn-small">
            日付クリア
          </button>
        )}
      </div>

      {visits.length === 0 ? (
        <p className="no-data">訪問予定が登録されていません</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>日時</th>
              <th>患者</th>
              <th>担当スタッフ</th>
              <th>時間</th>
              <th>ステータス</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((visit) => (
              <tr key={visit.id}>
                <td>
                  <Link to={`/visits/${visit.id}`}>{formatDateTime(visit.scheduled_at)}</Link>
                </td>
                <td>{visit.patient?.name || '-'}</td>
                <td>{visit.staff?.name || '未割当'}</td>
                <td>{visit.duration}分</td>
                <td>
                  <span className={`status-badge ${STATUS_COLORS[visit.status]}`}>
                    {STATUS_LABELS[visit.status] || visit.status}
                  </span>
                </td>
                <td className="actions">
                  {visit.status === 'scheduled' && (
                    <>
                      <button
                        onClick={() => handleComplete(visit.id)}
                        className="btn btn-small btn-success"
                      >
                        完了
                      </button>
                      <button
                        onClick={() => handleCancel(visit.id)}
                        className="btn btn-small btn-warning"
                      >
                        キャンセル
                      </button>
                    </>
                  )}
                  <Link to={`/visits/${visit.id}/edit`} className="btn btn-small">
                    編集
                  </Link>
                  <button
                    onClick={() => handleDelete(visit.id)}
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
