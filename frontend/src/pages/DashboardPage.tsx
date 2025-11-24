import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchHealth, fetchScheduleSummary } from '../api/client';
import { Card, CardHeader, CardBody } from '../components/molecules/Card';
import { Badge } from '../components/atoms/Badge';
import { Spinner } from '../components/atoms/Spinner';
import { PageHeader } from '../components/templates/ListLayout';

export function DashboardPage() {
  const { user } = useAuth();
  const [apiStatus, setApiStatus] = useState<string>('checking...');
  const [summary, setSummary] = useState<{
    total_visits: number;
    by_status: {
      scheduled: number;
      in_progress: number;
      completed: number;
      cancelled: number;
      unassigned: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchHealth().then((data) => setApiStatus(data.status)).catch(() => setApiStatus('error')),
      fetchScheduleSummary().then(setSummary).catch(() => null),
    ]).finally(() => setLoading(false));
  }, []);

  const quickLinks = [
    { path: '/schedule', label: 'スケジュール', description: '今日の訪問予定を確認' },
    { path: '/staffs', label: 'スタッフ管理', description: 'スタッフ情報を管理' },
    { path: '/patients', label: '患者管理', description: '患者情報を管理' },
    { path: '/visits', label: '訪問予定', description: '訪問予定を管理' },
  ];

  return (
    <div>
      <PageHeader
        title="ダッシュボード"
        subtitle={`ようこそ、${user?.email} さん`}
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardBody>
                <div className="text-sm text-secondary-500 mb-1">システム状態</div>
                <div className="flex items-center gap-2">
                  <Badge variant={apiStatus === 'ok' ? 'success' : 'danger'}>
                    {apiStatus === 'ok' ? '正常' : 'エラー'}
                  </Badge>
                </div>
              </CardBody>
            </Card>

            {summary && (
              <>
                <Card>
                  <CardBody>
                    <div className="text-sm text-secondary-500 mb-1">今日の訪問</div>
                    <div className="text-2xl font-bold text-secondary-900">
                      {summary.total_visits}
                      <span className="text-sm font-normal text-secondary-500 ml-1">件</span>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <div className="text-sm text-secondary-500 mb-1">未割当</div>
                    <div className="text-2xl font-bold text-warning-600">
                      {summary.by_status.unassigned}
                      <span className="text-sm font-normal text-secondary-500 ml-1">件</span>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <div className="text-sm text-secondary-500 mb-1">完了</div>
                    <div className="text-2xl font-bold text-success-600">
                      {summary.by_status.completed}
                      <span className="text-sm font-normal text-secondary-500 ml-1">件</span>
                    </div>
                  </CardBody>
                </Card>
              </>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">クイックアクセス</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickLinks.map((link) => (
                <Link key={link.path} to={link.path}>
                  <Card hoverable className="h-full">
                    <CardBody>
                      <div className="text-base font-medium text-secondary-900 mb-1">
                        {link.label}
                      </div>
                      <div className="text-sm text-secondary-500">
                        {link.description}
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Visit Status Summary */}
          {summary && (
            <Card>
              <CardHeader>訪問ステータス</CardHeader>
              <CardBody>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">予定</Badge>
                    <span className="text-secondary-900">{summary.by_status.scheduled}件</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">進行中</Badge>
                    <span className="text-secondary-900">{summary.by_status.in_progress}件</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success">完了</Badge>
                    <span className="text-secondary-900">{summary.by_status.completed}件</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="danger">キャンセル</Badge>
                    <span className="text-secondary-900">{summary.by_status.cancelled}件</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
