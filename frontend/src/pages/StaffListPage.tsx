import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchStaffs, deleteStaff, type Staff } from '../api/client';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { Card } from '../components/molecules/Card';
import { SelectField } from '../components/molecules/FormField';
import { DataTable } from '../components/organisms/DataTable';
import { ListLayout } from '../components/templates/ListLayout';
import { ConfirmModal } from '../components/molecules/Modal';

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

const STATUS_VARIANTS: Record<string, 'success' | 'default' | 'warning'> = {
  active: 'success',
  inactive: 'default',
  on_leave: 'warning',
};

export function StaffListPage() {
  const navigate = useNavigate();
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await deleteStaff(deleteTarget.id);
      setStaffs(staffs.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: '名前',
      render: (staff: Staff) => (
        <Link
          to={`/staffs/${staff.id}`}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          {staff.name}
        </Link>
      ),
    },
    {
      key: 'email',
      header: 'メールアドレス',
    },
    {
      key: 'qualifications',
      header: '資格',
      render: (staff: Staff) =>
        staff.qualifications.map((q) => QUALIFICATION_LABELS[q] || q).join(', ') || '-',
    },
    {
      key: 'status',
      header: 'ステータス',
      render: (staff: Staff) => (
        <Badge variant={STATUS_VARIANTS[staff.status] || 'secondary'}>
          {STATUS_LABELS[staff.status] || staff.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (staff: Staff) => (
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/staffs/${staff.id}/edit`);
            }}
          >
            編集
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(staff);
            }}
          >
            削除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <ListLayout
      title="スタッフ管理"
      action={
        <Link to="/staffs/new">
          <Button variant="primary">新規登録</Button>
        </Link>
      }
      filters={
        <Card padding="sm">
          <div className="flex items-end gap-4">
            <SelectField
              label="ステータス"
              name="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'active', label: '在籍' },
                { value: 'inactive', label: '退職' },
                { value: 'on_leave', label: '休職' },
              ]}
              placeholder="すべて"
              className="w-48"
            />
          </div>
        </Card>
      }
    >
      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <Card padding="none">
        <DataTable
          columns={columns}
          data={staffs}
          keyExtractor={(staff) => staff.id}
          loading={loading}
          emptyMessage="スタッフが登録されていません"
          onRowClick={(staff) => navigate(`/staffs/${staff.id}`)}
        />
      </Card>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="スタッフの削除"
        message={`${deleteTarget?.name}を削除しますか？この操作は取り消せません。`}
        confirmLabel="削除"
        cancelLabel="キャンセル"
        variant="danger"
        loading={deleting}
      />
    </ListLayout>
  );
}
