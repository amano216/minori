import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchStaff, deleteStaff, type Staff } from '../api/client';

const QUALIFICATION_LABELS: Record<string, string> = {
  nurse: '看護師',
  physical_therapist: '理学療法士',
  occupational_therapist: '作業療法士',
  speech_therapist: '言語聴覚士',
  care_worker: '介護福祉士',
};

const STATUS_LABELS: Record<string, string> = {
  active: '在籍',
  inactive: '退職',
  on_leave: '休職',
};

const DAY_LABELS: Record<string, string> = {
  monday: '月曜日',
  tuesday: '火曜日',
  wednesday: '水曜日',
  thursday: '木曜日',
  friday: '金曜日',
  saturday: '土曜日',
  sunday: '日曜日',
};

export function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStaff = async () => {
      if (!id) return;
      try {
        const data = await fetchStaff(Number(id));
        setStaff(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'スタッフの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    loadStaff();
  }, [id]);

  const handleDelete = async () => {
    if (!staff || !confirm(`${staff.name}を削除しますか？`)) return;

    try {
      await deleteStaff(staff.id);
      navigate('/staffs');
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    }
  };

  if (loading) return <div className="loading">読み込み中...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!staff) return <div className="error-message">スタッフが見つかりません</div>;

  return (
    <div className="staff-detail">
      <div className="page-header">
        <h1>{staff.name}</h1>
        <div className="header-actions">
          <Link to={`/staffs/${staff.id}/edit`} className="btn btn-primary">
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
            <dt>メールアドレス</dt>
            <dd>{staff.email}</dd>
          </div>
          <div className="detail-item">
            <dt>ステータス</dt>
            <dd>
              <span className={`status-badge status-${staff.status}`}>
                {STATUS_LABELS[staff.status] || staff.status}
              </span>
            </dd>
          </div>
          <div className="detail-item">
            <dt>資格</dt>
            <dd>
              {staff.qualifications.length > 0
                ? staff.qualifications.map((q) => QUALIFICATION_LABELS[q] || q).join(', ')
                : '-'}
            </dd>
          </div>
          <div className="detail-item">
            <dt>勤務可能時間</dt>
            <dd>
              {Object.keys(staff.available_hours).length > 0 ? (
                <ul className="hours-list">
                  {Object.entries(staff.available_hours).map(([day, hours]) => (
                    <li key={day}>
                      {DAY_LABELS[day] || day}: {hours.start} - {hours.end}
                    </li>
                  ))}
                </ul>
              ) : (
                '-'
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className="back-link">
        <Link to="/staffs">← スタッフ一覧に戻る</Link>
      </div>
    </div>
  );
}
