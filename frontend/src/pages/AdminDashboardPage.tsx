export function AdminDashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-text-primary mb-6">管理ダッシュボード</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-2">組織情報</h3>
          <p className="text-text-grey">組織の基本情報を確認・編集できます</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-2">ユーザー管理</h3>
          <p className="text-text-grey">ユーザーの追加・編集・削除が可能です</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-2">ロール管理</h3>
          <p className="text-text-grey">権限ロールの設定が可能です</p>
        </div>
      </div>
    </div>
  );
}
