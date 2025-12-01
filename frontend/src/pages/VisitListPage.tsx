import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import { fetchVisits, fetchVisit, cancelVisit, completeVisit, deleteVisit, createVisit, updateVisit, fetchStaffs, fetchPatients, type Visit, type VisitInput, type Staff, type Patient } from '../api/client';
import { fetchVersions, type AuditVersion } from '../api/versionsApi';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { Spinner } from '../components/atoms/Spinner';
import { Label } from '../components/atoms/Label';
import { DataTable } from '../components/organisms/DataTable';
import { ListLayout } from '../components/templates/ListLayout';
import { Modal } from '../components/molecules/Modal';
import { HistoryItem } from '../components/molecules/HistoryItem';

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

const VISIT_FIELD_LABELS: Record<string, string> = {
  scheduled_at: '訪問日時',
  duration: '所要時間',
  patient_id: '患者',
  staff_id: '担当スタッフ',
  status: 'ステータス',
  notes: '備考',
};

const EVENT_LABELS: Record<string, string> = {
  create: '作成',
  update: '更新',
  destroy: '削除',
};

const DURATION_OPTIONS = [
  { value: 30, label: '30分' },
  { value: 45, label: '45分' },
  { value: 60, label: '60分' },
  { value: 90, label: '90分' },
  { value: 120, label: '120分' },
];

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

function formatChangesForHistoryItem(
  objectChanges: Record<string, unknown> | null | undefined,
  staffs: Staff[],
  patients: Patient[]
): Record<string, { before: unknown; after: unknown }> | undefined {
  if (!objectChanges) return undefined;
  const result: Record<string, { before: unknown; after: unknown }> = {};
  
  const staffMap = new Map(staffs.map(s => [s.id, s.name]));
  const patientMap = new Map(patients.map(p => [p.id, p.name]));
  
  for (const [key, value] of Object.entries(objectChanges)) {
    if (Array.isArray(value) && value.length === 2) {
      let before = value[0];
      let after = value[1];
      
      if (key === 'status') {
        before = STATUS_LABELS[before as string] || before;
        after = STATUS_LABELS[after as string] || after;
      }
      if (key === 'staff_id') {
        before = before ? staffMap.get(before as number) || `ID:${before}` : '未割当';
        after = after ? staffMap.get(after as number) || `ID:${after}` : '未割当';
      }
      if (key === 'patient_id') {
        before = before ? patientMap.get(before as number) || `ID:${before}` : '-';
        after = after ? patientMap.get(after as number) || `ID:${after}` : '-';
      }
      if (key === 'duration') {
        before = before ? `${before}分` : '-';
        after = after ? `${after}分` : '-';
      }
      if (key === 'scheduled_at') {
        before = before ? formatDateTime(before as string) : '-';
        after = after ? formatDateTime(after as string) : '-';
      }
      
      result[key] = { before, after };
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

export function VisitListPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [actionModal, setActionModal] = useState<{ type: 'complete' | 'cancel' | 'delete'; visit: Visit } | null>(null);

  // Side Panel State
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [panelTab, setPanelTab] = useState<'edit' | 'history'>('edit');
  const [panelLoading, setPanelLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // History State
  const [versions, setVersions] = useState<AuditVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    scheduledDate: '',
    scheduledTime: '09:00',
    duration: 60,
    staffId: undefined as number | undefined,
    patientId: undefined as number | undefined,
    status: 'scheduled',
    notes: '',
  });

  const loadVisits = useCallback(async () => {
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
  }, [statusFilter, dateFilter]);

  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  // マスタデータ取得
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [staffsData, patientsData] = await Promise.all([
          fetchStaffs({ status: 'active' }),
          fetchPatients({ status: 'active' }),
        ]);
        setStaffs(staffsData);
        setPatients(patientsData);
      } catch (err) {
        console.error('マスタデータ取得に失敗:', err);
      }
    };
    loadMasterData();
  }, []);

  // History load on tab change
  useEffect(() => {
    if (panelTab === 'history' && editingVisit && versions.length === 0) {
      loadVisitVersions(editingVisit.id);
    }
  }, [panelTab, editingVisit, versions.length]);

  const loadVisitVersions = async (visitId: number) => {
    try {
      setVersionsLoading(true);
      const response = await fetchVersions({
        item_type: 'Visit',
        item_id: visitId,
        per_page: 50,
      });
      setVersions(response.versions);
    } catch (err) {
      console.error('Failed to load visit history:', err);
      setVersions([]);
    } finally {
      setVersionsLoading(false);
    }
  };

  // Patient options filtered by group
  const filteredPatients = useMemo(() => {
    return patients;
  }, [patients]);

  // Staff options filtered by group
  const filteredStaffs = useMemo(() => {
    return staffs;
  }, [staffs]);

  const handleOpenPanel = async (visit?: Visit) => {
    setPanelTab('edit');
    setVersions([]);
    setError('');

    if (visit) {
      setPanelLoading(true);
      setEditingVisit(visit);
      setIsPanelOpen(true);
      setTimeout(() => setIsPanelVisible(true), 10);

      try {
        const fullVisit = await fetchVisit(visit.id);
        const date = new Date(fullVisit.scheduled_at);
        setFormData({
          scheduledDate: date.toISOString().split('T')[0],
          scheduledTime: date.toTimeString().slice(0, 5),
          duration: fullVisit.duration,
          staffId: fullVisit.staff_id || undefined,
          patientId: fullVisit.patient_id,
          status: fullVisit.status,
          notes: fullVisit.notes || '',
        });
        setEditingVisit(fullVisit);
      } catch (err) {
        setError(err instanceof Error ? err.message : '訪問予定の取得に失敗しました');
      } finally {
        setPanelLoading(false);
      }
    } else {
      setEditingVisit(null);
      setFormData({
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '09:00',
        duration: 60,
        staffId: undefined,
        patientId: undefined,
        status: 'scheduled',
        notes: '',
      });
      setIsPanelOpen(true);
      setTimeout(() => setIsPanelVisible(true), 10);
    }
  };

  const handleClosePanel = () => {
    setIsPanelVisible(false);
    setTimeout(() => {
      setIsPanelOpen(false);
      setEditingVisit(null);
      setError('');
    }, 200);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.patientId) {
      setError('患者を選択してください');
      return;
    }

    setSubmitting(true);

    const scheduledAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}:00`).toISOString();

    const visitData: VisitInput = {
      scheduled_at: scheduledAt,
      duration: formData.duration,
      staff_id: formData.staffId || null,
      patient_id: formData.patientId,
      status: formData.staffId ? formData.status : 'unassigned',
      notes: formData.notes || undefined,
    };

    try {
      if (editingVisit) {
        await updateVisit(editingVisit.id, visitData);
      } else {
        await createVisit(visitData);
      }
      await loadVisits();
      handleClosePanel();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

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
      minWidth: 'min-w-[130px]',
      render: (visit: Visit) => (
        <button onClick={() => handleOpenPanel(visit)} className="text-main hover:underline font-medium whitespace-nowrap text-xs sm:text-sm text-left">
          {formatDateTime(visit.scheduled_at)}
        </button>
      ),
    },
    {
      key: 'patient',
      header: '患者',
      minWidth: 'min-w-[80px]',
      render: (visit: Visit) => (
        <span className="text-text-black whitespace-nowrap">{visit.patient?.name || '-'}</span>
      ),
    },
    {
      key: 'staff',
      header: '担当スタッフ',
      minWidth: 'min-w-[80px]',
      render: (visit: Visit) => (
        <span className={`whitespace-nowrap ${visit.staff ? 'text-text-black' : 'text-text-grey'}`}>
          {visit.staff?.name || '未割当'}
        </span>
      ),
    },
    {
      key: 'duration',
      header: '時間',
      minWidth: 'min-w-[50px]',
      render: (visit: Visit) => (
        <span className="text-text-grey whitespace-nowrap">{visit.duration}分</span>
      ),
    },
    {
      key: 'status',
      header: 'ステータス',
      minWidth: 'min-w-[70px]',
      render: (visit: Visit) => (
        <Badge variant={STATUS_VARIANTS[visit.status] || 'default'}>
          {STATUS_LABELS[visit.status] || visit.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      minWidth: 'min-w-[100px]',
      render: (visit: Visit) => (
        <div className="flex gap-1 sm:gap-2 flex-wrap">
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
            onClick={() => handleOpenPanel(visit)}
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
          <Button variant="primary" onClick={() => handleOpenPanel()}>
            新規登録
          </Button>
        }
        filters={filterContent}
      >
        {error && !isPanelOpen && (
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

      {/* Side Panel */}
      {isPanelOpen && (
        <>
          <div
            className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-200 ${isPanelVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleClosePanel}
          />
          <div className={`fixed top-0 right-0 bottom-0 w-full sm:w-[480px] md:w-[540px] bg-white shadow-2xl z-50 transform transition-transform duration-200 ${isPanelVisible ? 'translate-x-0' : 'translate-x-full'} flex flex-col overflow-hidden`}>
            {/* Header */}
            <div className="flex-none px-4 py-3 border-b border-border flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-semibold text-text-primary">{editingVisit ? '訪問予定編集' : '新規訪問予定登録'}</h2>
              <button onClick={handleClosePanel} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            {editingVisit && (
              <div className="flex-none flex border-b border-border bg-white">
                <button
                  type="button"
                  onClick={() => setPanelTab('edit')}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${panelTab === 'edit' ? 'border-main text-main bg-primary-50' : 'border-transparent text-text-grey hover:text-text-primary hover:bg-gray-50'}`}
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => setPanelTab('history')}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${panelTab === 'history' ? 'border-main text-main bg-primary-50' : 'border-transparent text-text-grey hover:text-text-primary hover:bg-gray-50'}`}
                >
                  変更履歴
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>}

              {panelLoading ? (
                <div className="flex justify-center py-12"><Spinner size="lg" /></div>
              ) : panelTab === 'history' && editingVisit ? (
                <div className="space-y-3">
                  {versionsLoading ? (
                    <div className="flex justify-center py-8"><Spinner /></div>
                  ) : versions.length === 0 ? (
                    <div className="text-center text-text-grey py-8">変更履歴がありません</div>
                  ) : (
                    versions.map((version) => (
                      <HistoryItem
                        key={version.id}
                        event={version.event as 'create' | 'update' | 'destroy'}
                        eventLabel={EVENT_LABELS[version.event] || version.event}
                        whodunnitName={version.whodunnit_name}
                        createdAt={version.created_at}
                        changes={formatChangesForHistoryItem(version.object_changes, staffs, patients)}
                        fieldLabels={VISIT_FIELD_LABELS}
                      />
                    ))
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* 患者・スタッフ */}
                  <div className="border-b border-border pb-4">
                    <h3 className="text-sm font-semibold text-text-black mb-3">訪問情報</h3>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="patientId" required>患者</Label>
                        <select
                          id="patientId"
                          value={formData.patientId || ''}
                          onChange={(e) => setFormData({ ...formData, patientId: e.target.value ? Number(e.target.value) : undefined })}
                          required
                          disabled={submitting}
                          className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main"
                        >
                          <option value="">選択してください</option>
                          {filteredPatients.map((patient) => (
                            <option key={patient.id} value={patient.id}>{patient.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="staffId">担当スタッフ</Label>
                        <select
                          id="staffId"
                          value={formData.staffId || ''}
                          onChange={(e) => setFormData({ ...formData, staffId: e.target.value ? Number(e.target.value) : undefined })}
                          disabled={submitting}
                          className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main"
                        >
                          <option value="">未割当</option>
                          {filteredStaffs.map((staff) => (
                            <option key={staff.id} value={staff.id}>{staff.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 日時 */}
                  <div className="border-b border-border pb-4">
                    <h3 className="text-sm font-semibold text-text-black mb-3">日時</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="scheduledDate" required>日付</Label>
                        <input
                          type="date"
                          id="scheduledDate"
                          value={formData.scheduledDate}
                          onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                          required
                          disabled={submitting}
                          className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="scheduledTime" required>時刻</Label>
                        <input
                          type="time"
                          id="scheduledTime"
                          value={formData.scheduledTime}
                          onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                          required
                          disabled={submitting}
                          className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="duration">所要時間</Label>
                        <select
                          id="duration"
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                          disabled={submitting}
                          className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main"
                        >
                          {DURATION_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      {editingVisit && (
                        <div className="space-y-1">
                          <Label htmlFor="status">ステータス</Label>
                          <select
                            id="status"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            disabled={submitting}
                            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main"
                          >
                            <option value="scheduled">予定</option>
                            <option value="in_progress">実施中</option>
                            <option value="completed">完了</option>
                            <option value="cancelled">キャンセル</option>
                            <option value="unassigned">未割当</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 備考 */}
                  <div className="space-y-1">
                    <Label htmlFor="notes">備考</Label>
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      disabled={submitting}
                      rows={3}
                      className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main resize-y"
                      placeholder="訪問に関する補足情報..."
                    />
                  </div>

                  {/* ボタン */}
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" variant="primary" disabled={submitting} className="flex-1">
                      {submitting ? '保存中...' : '保存'}
                    </Button>
                    <Button type="button" variant="secondary" onClick={handleClosePanel} disabled={submitting} className="flex-1">
                      キャンセル
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {panelTab === 'history' && (
              <div className="flex-none p-4 border-t border-border">
                <Button variant="secondary" onClick={handleClosePanel} className="w-full">閉じる</Button>
              </div>
            )}
          </div>
        </>
      )}

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
