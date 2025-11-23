import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchVisit, deleteVisit, cancelVisit, completeVisit, type Visit } from '../api/client';

const STATUS_LABELS: Record<string, string> = {
  scheduled: '予定',
  in_progress: '実施中',
  completed: '完了',
  cancelled: 'キャンセル',
  unassigned: '未割当',
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

  const handleDelete = async () => {
    if (!visit || !confirm('この訪問予定を削除しますか？')) return;
    try {
      await deleteVisit(visit.id);
      navigate('/visits');
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    }
  };

  const handleCancel = async () => {
    if (!visit || !confirm('この訪問をキャンセルしますか？')) return;
    try {
      const updated = await cancelVisit(visit.id);
      setVisit(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'キャンセルに失敗しました');
    }
  };

  const handleComplete = async () => {
    if (!visit || !confirm('この訪問を完了にしますか？')) return;
    try {
      const updated = await completeVisit(visit.id);
      setVisit(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : '完了処理に失敗しました');
    }
  };

  if (loading) return <div className="loading">読み込み中...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!visit) return <div className="error-message">訪問予定が見つかりません</div>;

  return (
    <div className="visit-detail">
      <div className="page-header">
        <h1>訪問予定詳細</h1>
        <div className="header-actions">
          {visit.status === 'scheduled' && (
            <>
              <button onClick={handleComplete} className="btn btn-success">
                完了
              </button>
              <button onClick={handleCancel} className="btn btn-warning">
                キャンセル
              </button>
            </>
          )}
          <Link to={`/visits/${visit.id}/edit`} className="btn btn-primary">
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
            <dt>日時</dt>
            <dd>{formatDateTime(visit.scheduled_at)}</dd>
          </div>
          <div className="detail-item">
            <dt>所要時間</dt>
            <dd>{visit.duration}分</dd>
          </div>
          <div className="detail-item">
            <dt>患者</dt>
            <dd>
              {visit.patient ? (
                <Link to={`/patients/${visit.patient.id}`}>{visit.patient.name}</Link>
              ) : (
                '-'
              )}
            </dd>
          </div>
          <div className="detail-item">
            <dt>担当スタッフ</dt>
            <dd>
              {visit.staff ? (
                <Link to={`/staffs/${visit.staff.id}`}>{visit.staff.name}</Link>
              ) : (
                '未割当'
              )}
            </dd>
          </div>
          <div className="detail-item">
            <dt>ステータス</dt>
            <dd>
              <span className={`status-badge status-${visit.status}`}>
                {STATUS_LABELS[visit.status] || visit.status}
              </span>
            </dd>
          </div>
          <div className="detail-item">
            <dt>備考</dt>
            <dd style={{ whiteSpace: 'pre-wrap' }}>{visit.notes || '-'}</dd>
          </div>
        </dl>
      </div>

      <div className="back-link">
        <Link to="/visits">← 訪問予定一覧に戻る</Link>
      </div>
    </div>
  );
}
