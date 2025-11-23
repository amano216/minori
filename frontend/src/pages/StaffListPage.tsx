
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchStaffs, deleteStaff, type Staff } from '../api/client';

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

export function StaffListPage() {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadStaffs = async () => {
    try {
      setLoading(true);
      const data = await fetchStaffs(statusFilter ? { status: statusFilter } : undefined);
      setStaffs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'スタッフの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffs();
  }, [statusFilter]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`${name}を削除しますか？`)) return;

    try {
      await deleteStaff(id);
      setStaffs(staffs.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    }
  };

  if (loading) return <div className="loading">読み込み中...</div>;

  return (
    <div className="staff-list">
      <div className="page-header">
        <h1>スタッフ管理</h1>
        <Link to="/staffs/new" className="btn btn-primary">
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
          <option value="active">在籍</option>
          <option value="inactive">退職</option>
          <option value="on_leave">休職</option>
        </select>
      </div>

      {staffs.length === 0 ? (
        <p className="no-data">スタッフが登録されていません</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>名前</th>
              <th>メールアドレス</th>
              <th>資格</th>
              <th>ステータス</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {staffs.map((staff) => (
              <tr key={staff.id}>
                <td>
                  <Link to={`/staffs/${staff.id}`}>{staff.name}</Link>
                </td>
                <td>{staff.email}</td>
                <td>
                  {staff.qualifications.map((q) => QUALIFICATION_LABELS[q] || q).join(', ') || '-'}
                </td>
                <td>
                  <span className={`status-badge status-${staff.status}`}>
                    {STATUS_LABELS[staff.status] || staff.status}
                  </span>
                </td>
                <td className="actions">
                  <Link to={`/staffs/${staff.id}/edit`} className="btn btn-small">
                    編集
                  </Link>
                  <button
                    onClick={() => handleDelete(staff.id, staff.name)}
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
