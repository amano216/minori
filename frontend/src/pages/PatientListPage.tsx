import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FormEvent } from 'react';
import { Search, X } from 'lucide-react';
import { fetchPatients, fetchPatient, fetchGroups, deletePatient, createPatient, updatePatient, type Patient, type PatientInput, type PhoneNumber, type ExternalUrl, type Group } from '../api/client';
import { fetchVersions, type AuditVersion } from '../api/versionsApi';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { Spinner } from '../components/atoms/Spinner';
import { Input } from '../components/atoms/Input';
import { Label } from '../components/atoms/Label';
import { DataTable } from '../components/organisms/DataTable';
import { ListLayout } from '../components/templates/ListLayout';
import { Modal } from '../components/molecules/Modal';
import { HistoryItem } from '../components/molecules/HistoryItem';

const CARE_REQUIREMENT_LABELS: Record<string, string> = {
  nursing_care: '看護ケア',
  rehabilitation: 'リハビリ',
  medication_management: '服薬管理',
  wound_care: '創傷ケア',
  vital_check: 'バイタル測定',
  bathing_assistance: '入浴介助',
  meal_assistance: '食事介助',
};

const CARE_REQUIREMENTS = [
  { value: 'nursing_care', label: '看護ケア' },
  { value: 'rehabilitation', label: 'リハビリ' },
  { value: 'medication_management', label: '服薬管理' },
  { value: 'wound_care', label: '創傷ケア' },
  { value: 'vital_check', label: 'バイタル測定' },
  { value: 'bathing_assistance', label: '入浴介助' },
  { value: 'meal_assistance', label: '食事介助' },
];

const STATUS_LABELS: Record<string, string> = {
  active: '利用中',
  hospitalized: '入院中',
  inactive: '終了',
};

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  hospitalized: 'warning',
  inactive: 'error',
};

const GENDER_OPTIONS = [
  { value: '', label: '選択してください' },
  { value: '男', label: '男性' },
  { value: '女', label: '女性' },
];

const PHONE_LABEL_SUGGESTIONS = [
  '本人携帯', '本人自宅', '配偶者', '長男', '長女', '次男', '次女', 'ケアマネ', '緊急連絡先', 'FAX',
];

const URL_LABEL_SUGGESTIONS = [
  'カナミック', 'ケアプラン', '電子カルテ', '主治医', '薬局', 'その他',
];

const PATIENT_FIELD_LABELS: Record<string, string> = {
  name: '氏名',
  name_kana: 'フリガナ',
  date_of_birth: '生年月日',
  gender: '性別',
  postal_code: '郵便番号',
  address: '住所',
  phone_numbers: '電話番号',
  external_urls: '外部URL',
  patient_code: '利用者コード',
  group_id: '担当グループ',
  care_requirements: 'ケア内容',
  notes: '備考',
  status: 'ステータス',
};

const EVENT_LABELS: Record<string, string> = {
  create: '作成',
  update: '更新',
  destroy: '削除',
};

function formatChangesForHistoryItem(objectChanges: Record<string, unknown> | null | undefined): Record<string, { before: unknown; after: unknown }> | undefined {
  if (!objectChanges) return undefined;
  const result: Record<string, { before: unknown; after: unknown }> = {};
  for (const [key, value] of Object.entries(objectChanges)) {
    if (Array.isArray(value) && value.length === 2) {
      let before = value[0];
      let after = value[1];
      if (key === 'status') {
        before = STATUS_LABELS[before as string] || before;
        after = STATUS_LABELS[after as string] || after;
      }
      if (key === 'care_requirements') {
        const formatCare = (care: unknown) => {
          if (!Array.isArray(care)) return care;
          return care.map(c => CARE_REQUIREMENT_LABELS[c] || c).join(', ') || '(なし)';
        };
        before = formatCare(before);
        after = formatCare(after);
      }
      result[key] = { before, after };
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

export function PatientListPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [panelTab, setPanelTab] = useState<'edit' | 'history'>('edit');
  const [panelLoading, setPanelLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [versions, setVersions] = useState<AuditVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    name_kana: '',
    postal_code: '',
    address: '',
    phone_numbers: [{ number: '', label: '' }] as PhoneNumber[],
    external_urls: [{ url: '', label: '' }] as ExternalUrl[],
    date_of_birth: '',
    gender: '',
    patient_code: '',
    group_id: undefined as number | undefined,
    status: 'active',
    care_requirements: [] as string[],
    notes: '',
  });

  const teamsWithLabels = useMemo(() => {
    const teams = groups.filter(g => g.parent_id !== null);
    return teams.map(team => {
      // APIから返される parent_name を使用
      const label = team.parent_name ? `${team.parent_name} > ${team.name}` : team.name;
      return { ...team, label };
    }).sort((a, b) => a.label.localeCompare(b.label, 'ja'));
  }, [groups]);

  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchPatients(statusFilter ? { status: statusFilter } : undefined);
      setPatients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '患者の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await fetchGroups();
        setGroups(data);
      } catch (err) {
        console.error('グループの取得に失敗しました:', err);
      }
    };
    loadGroups();
  }, []);

  useEffect(() => {
    if (panelTab === 'history' && editingPatient && versions.length === 0) {
      loadPatientVersions(editingPatient.id);
    }
  }, [panelTab, editingPatient, versions.length]);

  const loadPatientVersions = async (patientId: number) => {
    try {
      setVersionsLoading(true);
      const response = await fetchVersions({
        item_type: 'Patient',
        item_id: patientId,
        per_page: 50,
      });
      setVersions(response.versions);
    } catch (err) {
      console.error('Failed to load patient history:', err);
      setVersions([]);
    } finally {
      setVersionsLoading(false);
    }
  };

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const query = searchQuery.toLowerCase();
    return patients.filter(patient =>
      patient.name.toLowerCase().includes(query) ||
      patient.name_kana?.toLowerCase().includes(query) ||
      patient.address?.toLowerCase().includes(query) ||
      patient.patient_code?.toLowerCase().includes(query) ||
      patient.phone_numbers?.some(pn => pn.number.includes(query))
    );
  }, [patients, searchQuery]);

  const handleOpenPanel = async (patient?: Patient) => {
    setPanelTab('edit');
    setVersions([]);
    setError('');

    if (patient) {
      setPanelLoading(true);
      setEditingPatient(patient);
      setIsPanelOpen(true);
      setTimeout(() => setIsPanelVisible(true), 10);

      try {
        const fullPatient = await fetchPatient(patient.id);
        setFormData({
          name: fullPatient.name,
          name_kana: fullPatient.name_kana || '',
          postal_code: fullPatient.postal_code || '',
          address: fullPatient.address || '',
          phone_numbers: fullPatient.phone_numbers?.length > 0 
            ? fullPatient.phone_numbers 
            : [{ number: '', label: '' }],
          external_urls: fullPatient.external_urls?.length > 0 
            ? fullPatient.external_urls 
            : [{ url: '', label: '' }],
          date_of_birth: fullPatient.date_of_birth || '',
          gender: fullPatient.gender || '',
          patient_code: fullPatient.patient_code || '',
          group_id: fullPatient.group_id || undefined,
          status: fullPatient.status,
          care_requirements: fullPatient.care_requirements,
          notes: fullPatient.notes || '',
        });
        setEditingPatient(fullPatient);
      } catch (err) {
        setError(err instanceof Error ? err.message : '患者の取得に失敗しました');
      } finally {
        setPanelLoading(false);
      }
    } else {
      setEditingPatient(null);
      setFormData({
        name: '',
        name_kana: '',
        postal_code: '',
        address: '',
        phone_numbers: [{ number: '', label: '' }],
        external_urls: [{ url: '', label: '' }],
        date_of_birth: '',
        gender: '',
        patient_code: '',
        group_id: undefined,
        status: 'active',
        care_requirements: [],
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
      setEditingPatient(null);
      setError('');
    }, 200);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePatient(deleteTarget.id);
      setPatients(patients.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
      if (editingPatient?.id === deleteTarget.id) {
        handleClosePanel();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const validPhoneNumbers = formData.phone_numbers.filter(pn => pn.number.trim() !== '');
    const validExternalUrls = formData.external_urls.filter(eu => eu.url.trim() !== '');

    const patientData: PatientInput = {
      name: formData.name,
      name_kana: formData.name_kana || undefined,
      postal_code: formData.postal_code || undefined,
      address: formData.address || undefined,
      phone_numbers: validPhoneNumbers.length > 0 ? validPhoneNumbers : undefined,
      external_urls: validExternalUrls.length > 0 ? validExternalUrls : undefined,
      date_of_birth: formData.date_of_birth || undefined,
      gender: formData.gender || undefined,
      patient_code: formData.patient_code || undefined,
      group_id: formData.group_id,
      status: formData.status,
      care_requirements: formData.care_requirements,
      notes: formData.notes || undefined,
    };

    try {
      if (editingPatient) {
        await updatePatient(editingPatient.id, patientData);
      } else {
        await createPatient(patientData);
      }
      await loadPatients();
      handleClosePanel();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCareRequirementChange = (req: string) => {
    setFormData(prev => ({
      ...prev,
      care_requirements: prev.care_requirements.includes(req)
        ? prev.care_requirements.filter(r => r !== req)
        : [...prev.care_requirements, req]
    }));
  };

  const handlePhoneNumberChange = (index: number, field: 'number' | 'label', value: string) => {
    setFormData(prev => {
      const newNumbers = [...prev.phone_numbers];
      newNumbers[index] = { ...newNumbers[index], [field]: value };
      return { ...prev, phone_numbers: newNumbers };
    });
  };

  const addPhoneNumber = () => {
    setFormData(prev => ({ ...prev, phone_numbers: [...prev.phone_numbers, { number: '', label: '' }] }));
  };

  const removePhoneNumber = (index: number) => {
    setFormData(prev => ({ ...prev, phone_numbers: prev.phone_numbers.filter((_, i) => i !== index) }));
  };

  const handleExternalUrlChange = (index: number, field: 'url' | 'label', value: string) => {
    setFormData(prev => {
      const newUrls = [...prev.external_urls];
      newUrls[index] = { ...newUrls[index], [field]: value };
      return { ...prev, external_urls: newUrls };
    });
  };

  const addExternalUrl = () => {
    setFormData(prev => ({ ...prev, external_urls: [...prev.external_urls, { url: '', label: '' }] }));
  };

  const removeExternalUrl = (index: number) => {
    setFormData(prev => ({ ...prev, external_urls: prev.external_urls.filter((_, i) => i !== index) }));
  };

  const calculateAge = (dob: string): number | null => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const columns = [
    {
      key: 'name',
      header: '名前',
      minWidth: 'min-w-[100px]',
      render: (patient: Patient) => (
        <button onClick={() => handleOpenPanel(patient)} className="text-main hover:underline font-medium whitespace-nowrap text-left">
          {patient.name}
        </button>
      ),
    },
    {
      key: 'address',
      header: '住所',
      minWidth: 'min-w-[120px]',
      render: (patient: Patient) => <span className="text-text-grey text-xs sm:text-sm">{patient.address || '-'}</span>,
    },
    {
      key: 'phone',
      header: '電話番号',
      minWidth: 'min-w-[100px]',
      render: (patient: Patient) => {
        const firstPhone = patient.phone_numbers?.[0];
        return <span className="text-text-grey whitespace-nowrap">{firstPhone ? firstPhone.number : '-'}</span>;
      },
    },
    {
      key: 'care_requirements',
      header: 'ケア内容',
      minWidth: 'min-w-[120px]',
      render: (patient: Patient) => (
        <div className="flex flex-wrap gap-1">
          {patient.care_requirements.length > 0 ? (
            patient.care_requirements.slice(0, 2).map((r) => (
              <Badge key={r} variant="default" size="sm">{CARE_REQUIREMENT_LABELS[r] || r}</Badge>
            ))
          ) : <span className="text-text-grey">-</span>}
          {patient.care_requirements.length > 2 && <Badge variant="default" size="sm">+{patient.care_requirements.length - 2}</Badge>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'ステータス',
      minWidth: 'min-w-[80px]',
      render: (patient: Patient) => (
        <Badge variant={STATUS_VARIANTS[patient.status] || 'default'}>{STATUS_LABELS[patient.status] || patient.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      minWidth: 'min-w-[80px]',
      render: (patient: Patient) => (
        <div className="flex gap-1 sm:gap-2">
          <Button variant="secondary" size="sm" onClick={() => handleOpenPanel(patient)}>編集</Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteTarget(patient)}>削除</Button>
        </div>
      ),
    },
  ];

  const filterContent = (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="名前、住所、電話番号で検索..."
          className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main"
        />
      </div>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main sm:w-auto"
      >
        <option value="">すべてのステータス</option>
        <option value="active">利用中</option>
        <option value="hospitalized">入院中</option>
        <option value="inactive">終了</option>
      </select>
    </div>
  );

  const age = calculateAge(formData.date_of_birth);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <>
      <ListLayout
        title="患者/利用者管理"
        description={`${filteredPatients.length}件の患者${searchQuery ? '（検索結果）' : 'が登録されています'}`}
        actions={<Button variant="primary" onClick={() => handleOpenPanel()}>新規登録</Button>}
        filters={filterContent}
      >
        {error && !isPanelOpen && (
          <div className="bg-danger-100 border border-danger-300 text-danger rounded-md p-3 text-sm mb-4">{error}</div>
        )}
        {filteredPatients.length === 0 ? (
          <div className="text-center py-12 text-text-grey">
            {searchQuery ? '検索条件に一致する患者がいません' : '患者が登録されていません'}
          </div>
        ) : (
          <DataTable data={filteredPatients} columns={columns} keyExtractor={(patient) => patient.id} />
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
              <h2 className="text-lg font-semibold text-text-primary">{editingPatient ? '患者編集' : '新規患者登録'}</h2>
              <button onClick={handleClosePanel} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            {editingPatient && (
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
              ) : panelTab === 'history' && editingPatient ? (
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
                        changes={formatChangesForHistoryItem(version.object_changes)}
                        fieldLabels={PATIENT_FIELD_LABELS}
                      />
                    ))
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* 基本情報 */}
                  <div className="border-b border-border pb-4">
                    <h3 className="text-sm font-semibold text-text-black mb-3">基本情報</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="patientCode">利用者コード</Label>
                        <Input type="text" id="patientCode" value={formData.patient_code} onChange={(e) => setFormData({ ...formData, patient_code: e.target.value })} disabled={submitting} placeholder="例: 0000001935" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="status">ステータス</Label>
                        <select id="status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} disabled={submitting} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main">
                          <option value="active">利用中</option>
                          <option value="hospitalized">入院中</option>
                          <option value="inactive">終了</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="groupId">担当グループ</Label>
                        <select id="groupId" value={formData.group_id || ''} onChange={(e) => setFormData({ ...formData, group_id: e.target.value ? Number(e.target.value) : undefined })} disabled={submitting} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main">
                          <option value="">選択してください</option>
                          {teamsWithLabels.map((team) => <option key={team.id} value={team.id}>{team.label}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="name" required>氏名</Label>
                        <Input type="text" id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required disabled={submitting} placeholder="例: 田中 花子" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="nameKana">フリガナ</Label>
                        <Input type="text" id="nameKana" value={formData.name_kana} onChange={(e) => setFormData({ ...formData, name_kana: e.target.value })} disabled={submitting} placeholder="例: タナカ ハナコ" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="dateOfBirth">生年月日</Label>
                        <Input type="date" id="dateOfBirth" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} disabled={submitting} />
                        {age !== null && <p className="text-xs text-text-grey">年齢: {age}歳</p>}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="gender">性別</Label>
                        <select id="gender" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} disabled={submitting} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main">
                          {GENDER_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 連絡先情報 */}
                  <div className="border-b border-border pb-4">
                    <h3 className="text-sm font-semibold text-text-black mb-3">連絡先情報</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="postalCode">郵便番号</Label>
                        <Input type="text" id="postalCode" value={formData.postal_code} onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })} disabled={submitting} placeholder="例: 123-4567" />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="address">住所</Label>
                        <Input type="text" id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} disabled={submitting} placeholder="例: 東京都渋谷区..." />
                      </div>
                    </div>

                    {/* 電話番号 */}
                    <div className="mt-3 space-y-2">
                      <Label>電話番号</Label>
                      {formData.phone_numbers.map((pn, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="relative w-28">
                            <Input type="text" value={pn.label || ''} onChange={(e) => handlePhoneNumberChange(index, 'label', e.target.value)} disabled={submitting} placeholder="備考" list={`phone-label-${index}`} className="w-full text-sm" />
                            <datalist id={`phone-label-${index}`}>
                              {PHONE_LABEL_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
                            </datalist>
                          </div>
                          <Input type="tel" value={pn.number} onChange={(e) => handlePhoneNumberChange(index, 'number', e.target.value)} disabled={submitting} placeholder="03-1234-5678" className="flex-1" />
                          {formData.phone_numbers.length > 1 && (
                            <button type="button" onClick={() => removePhoneNumber(index)} disabled={submitting} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={addPhoneNumber} disabled={submitting} className="text-sm text-main hover:text-main-dark transition-colors">+ 電話番号を追加</button>
                    </div>

                    {/* 外部URL */}
                    <div className="mt-3 space-y-2">
                      <Label>外部URL</Label>
                      {formData.external_urls.map((eu, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="relative w-28">
                            <Input type="text" value={eu.label || ''} onChange={(e) => handleExternalUrlChange(index, 'label', e.target.value)} disabled={submitting} placeholder="備考" list={`url-label-${index}`} className="w-full text-sm" />
                            <datalist id={`url-label-${index}`}>
                              {URL_LABEL_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
                            </datalist>
                          </div>
                          <Input type="url" value={eu.url} onChange={(e) => handleExternalUrlChange(index, 'url', e.target.value)} disabled={submitting} placeholder="https://..." className="flex-1" />
                          {formData.external_urls.length > 1 && (
                            <button type="button" onClick={() => removeExternalUrl(index)} disabled={submitting} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={addExternalUrl} disabled={submitting} className="text-sm text-main hover:text-main-dark transition-colors">+ URLを追加</button>
                    </div>
                  </div>

                  {/* ケア情報 */}
                  <div className="border-b border-border pb-4">
                    <h3 className="text-sm font-semibold text-text-black mb-3">ケア情報</h3>
                    <div className="flex flex-wrap gap-2">
                      {CARE_REQUIREMENTS.map((req) => (
                        <label key={req.value} className={`px-3 py-1.5 rounded border cursor-pointer text-sm transition-colors ${formData.care_requirements.includes(req.value) ? 'bg-main text-white border-main' : 'bg-white text-text-primary border-border hover:border-main'}`}>
                          <input type="checkbox" checked={formData.care_requirements.includes(req.value)} onChange={() => handleCareRequirementChange(req.value)} disabled={submitting} className="sr-only" />
                          {req.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 備考 */}
                  <div className="space-y-1">
                    <Label htmlFor="notes">備考</Label>
                    <textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} disabled={submitting} rows={3} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main resize-y" placeholder="患者に関する補足情報..." />
                  </div>

                  {/* ボタン */}
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" variant="primary" disabled={submitting} className="flex-1">{submitting ? '保存中...' : '保存'}</Button>
                    <Button type="button" variant="secondary" onClick={handleClosePanel} disabled={submitting} className="flex-1">キャンセル</Button>
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

      {/* Delete Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="患者の削除">
        <p className="text-text-grey mb-6">
          <span className="font-medium text-text-black">{deleteTarget?.name}</span>を削除しますか？この操作は取り消せません。
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>キャンセル</Button>
          <Button variant="danger" onClick={handleDelete}>削除する</Button>
        </div>
      </Modal>
    </>
  );
}
