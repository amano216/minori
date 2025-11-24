import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchStaff, deleteStaff, type Staff } from '../api/client';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { Spinner } from '../components/atoms/Spinner';
import { Card } from '../components/molecules/Card';
import { Modal } from '../components/molecules/Modal';
import { PageHeader } from '../components/templates/ListLayout';

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

const STATUS_VARIANTS: Record<string, 'success' | 'error' | 'warning'> = {
  active: 'success',
  inactive: 'error',
  on_leave: 'warning',
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
    if (!staff) return;
    try {
      await deleteStaff(staff.id);
      navigate('/staffs');
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

  if (!staff) {
    return (
      <div className="bg-danger-100 border border-danger-300 text-danger rounded-md p-4">
        スタッフが見つかりません
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={staff.name}
        breadcrumbs={[
          { label: 'スタッフ一覧', href: '/staffs' },
          { label: staff.name },
        ]}
        action={
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => navigate(`/staffs/${staff.id}/edit`)}>
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
          <div className="py-4 flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-text-grey sm:w-40">メールアドレス</dt>
            <dd className="mt-1 sm:mt-0 text-text-black">{staff.email}</dd>
          </div>
          <div className="py-4 flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-text-grey sm:w-40">ステータス</dt>
            <dd className="mt-1 sm:mt-0">
              <Badge variant={STATUS_VARIANTS[staff.status] || 'default'}>
                {STATUS_LABELS[staff.status] || staff.status}
              </Badge>
            </dd>
          </div>
          <div className="py-4 flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-text-grey sm:w-40">資格</dt>
            <dd className="mt-1 sm:mt-0">
              {staff.qualifications.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {staff.qualifications.map((q) => (
                    <Badge key={q} variant="primary">
                      {QUALIFICATION_LABELS[q] || q}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-text-grey">-</span>
              )}
            </dd>
          </div>
          <div className="py-4 flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-text-grey sm:w-40">勤務可能時間</dt>
            <dd className="mt-1 sm:mt-0">
              {Object.keys(staff.available_hours).length > 0 ? (
                <ul className="space-y-1 text-text-black">
                  {Object.entries(staff.available_hours).map(([day, hours]) => (
                    <li key={day} className="text-sm">
                      <span className="font-medium">{DAY_LABELS[day] || day}:</span>{' '}
                      {hours.start} - {hours.end}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-text-grey">-</span>
              )}
            </dd>
          </div>
        </dl>
      </Card>

      <div className="mt-6">
        <Link to="/staffs" className="text-main hover:underline text-sm">
          ← スタッフ一覧に戻る
        </Link>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="スタッフの削除"
      >
        <p className="text-text-grey mb-6">
          <span className="font-medium text-text-black">{staff.name}</span>
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
