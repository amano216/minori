import { useState, useEffect, type FormEvent } from 'react';
import { X, User, Calendar, Clock, FileText, Save, Plus, Users, CalendarOff } from 'lucide-react';
import { CalendarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import {
  createVisit,
  createEvent,
  fetchStaffs,
  fetchPatients,
  type VisitInput,
  type Staff,
  type Patient,
  type EventType,
  type AbsenceReason,
} from '../../api/client';
import { Button } from '../atoms/Button';
import { Spinner } from '../atoms/Spinner';
import { SearchableSelect } from '../molecules/SearchableSelect';

type TabType = 'visit' | 'event' | 'absence';

const ABSENCE_REASON_LABELS: Record<AbsenceReason, string> = {
  compensatory_leave: '振休',
  paid_leave: '有給',
  half_day_leave: '半休',
};

interface NewSchedulePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  initialDate?: Date;
  initialStaffId?: number;
  initialPlanningLaneId?: number;
  initialTab?: TabType;
}

const EVENT_TYPE_LABELS: Record<Exclude<EventType, 'absence'>, string> = {
  meeting: 'ミーティング',
  facility: '施設訪問',
  training: '研修',
  other: 'その他',
};

export function NewSchedulePanel({
  isOpen,
  onClose,
  onCreated,
  initialDate,
  initialStaffId,
  initialPlanningLaneId,
  initialTab = 'visit',
}: NewSchedulePanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  
  // Common State
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [planningLaneId, setPlanningLaneId] = useState<number | null>(null);
  
  // Visit-specific State
  const [staffId, setStaffId] = useState<number | ''>('');
  const [patientId, setPatientId] = useState<number | ''>('');
  
  // Event-specific State
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<Exclude<EventType, 'absence'>>('meeting');
  const [participantIds, setParticipantIds] = useState<number[]>([]);

  // Absence-specific State
  const [absenceReason, setAbsenceReason] = useState<AbsenceReason>('paid_leave');
  const [absenceStaffId, setAbsenceStaffId] = useState<number | ''>('');
  const [isAllDay, setIsAllDay] = useState(true);

  // Data State
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
      loadMasterData();
      setActiveTab(initialTab);
      
      // Initialize form with props
      if (initialDate) {
        const year = initialDate.getFullYear();
        const month = String(initialDate.getMonth() + 1).padStart(2, '0');
        const day = String(initialDate.getDate()).padStart(2, '0');
        setScheduledDate(`${year}-${month}-${day}`);
        setScheduledTime(initialDate.toTimeString().slice(0, 5));
      } else {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        setScheduledDate(`${year}-${month}-${day}`);
      }
      
      if (initialStaffId) {
        setStaffId(initialStaffId);
      }

      if (initialPlanningLaneId) {
        setPlanningLaneId(initialPlanningLaneId);
      } else {
        setPlanningLaneId(null);
      }
      
      // Reset form
      setPatientId('');
      setNotes('');
      setEventTitle('');
      setEventType('meeting');
      setParticipantIds([]);
      setAbsenceReason('paid_leave');
      setAbsenceStaffId('');
      setIsAllDay(true);
      setError('');
      // Set appropriate duration based on tab
      setDuration(initialTab === 'absence' ? 240 : 60);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, initialDate, initialStaffId, initialPlanningLaneId, initialTab]);

  const loadMasterData = async () => {
    try {
      setLoading(true);
      const [staffsData, patientsData] = await Promise.all([
        fetchStaffs({ status: 'active' }),
        fetchPatients({ status: 'active' }),
      ]);
      setStaffs(staffsData);
      setPatients(patientsData);
    } catch (err: unknown) {
      console.error('Failed to load master data:', err);
      setError('マスターデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // All patients are selectable regardless of planning lane
  // This allows flexibility for backup staff assignments across teams

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const handleSubmitVisit = async (e: FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      setError('患者を選択してください');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
      
      const visitData: VisitInput = {
        patient_id: patientId as number,
        staff_id: staffId ? (staffId as number) : undefined,
        scheduled_at: scheduledAt.toISOString(),
        duration,
        notes: notes || undefined,
        planning_lane_id: planningLaneId || undefined,
      };

      await createVisit(visitData);
      onCreated();
      handleClose();
    } catch (err: unknown) {
      console.error('Failed to create visit:', err);
      setError('訪問の作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (!eventTitle) {
      setError('タイトルを入力してください');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
      
      await createEvent({
        title: eventTitle,
        event_type: eventType,
        scheduled_at: scheduledAt.toISOString(),
        duration,
        notes: notes || undefined,
        planning_lane_id: planningLaneId || undefined,
        participant_ids: participantIds,
      });
      onCreated();
      handleClose();
    } catch (err: unknown) {
      console.error('Failed to create event:', err);
      setError('イベントの作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleParticipant = (id: number) => {
    if (participantIds.includes(id)) {
      setParticipantIds(participantIds.filter(p => p !== id));
    } else {
      setParticipantIds([...participantIds, id]);
    }
  };

  const handleSubmitAbsence = async (e: FormEvent) => {
    e.preventDefault();
    if (!absenceStaffId) {
      setError('スタッフを選択してください');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      let scheduledAt: Date;
      let absenceDuration: number;

      if (isAllDay) {
        // 終日の場合：9:00から8時間（480分）
        scheduledAt = new Date(`${scheduledDate}T09:00`);
        absenceDuration = 480;
      } else {
        // 時間指定の場合
        scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
        absenceDuration = duration;
      }

      const selectedStaff = staffs.find(s => s.id === absenceStaffId);
      const title = `${selectedStaff?.name || ''} - ${ABSENCE_REASON_LABELS[absenceReason]}`;
      
      await createEvent({
        title,
        event_type: 'absence',
        scheduled_at: scheduledAt.toISOString(),
        duration: absenceDuration,
        notes: notes || undefined,
        planning_lane_id: planningLaneId || undefined,
        participant_ids: [absenceStaffId as number],
        absence_reason: absenceReason,
      });
      onCreated();
      handleClose();
    } catch (err: unknown) {
      console.error('Failed to create absence:', err);
      setError('不在の作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = (e: FormEvent) => {
    if (activeTab === 'visit') {
      handleSubmitVisit(e);
    } else if (activeTab === 'event') {
      handleSubmitEvent(e);
    } else {
      handleSubmitAbsence(e);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />
      
      {/* Panel */}
      <div className={`fixed top-0 right-0 bottom-0 w-full sm:w-96 md:w-[420px] bg-white shadow-2xl z-50 transform transition-transform duration-200 ${isVisible ? 'translate-x-0' : 'translate-x-full'} flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className="flex-none px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-gray-900">新規作成</span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-none px-4 pt-3 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-1">
            <button
              onClick={() => {
                setActiveTab('visit');
                setDuration(60);
              }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'visit'
                  ? 'bg-white text-indigo-600 border border-gray-200 border-b-white -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              新規訪問
            </button>
            <button
              onClick={() => {
                setActiveTab('event');
                setDuration(60);
              }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'event'
                  ? 'bg-white text-purple-600 border border-gray-200 border-b-white -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserGroupIcon className="w-4 h-4" />
              新規イベント
            </button>
            <button
              onClick={() => {
                setActiveTab('absence');
                setDuration(240);
              }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'absence'
                  ? 'bg-white text-gray-600 border border-gray-200 border-b-white -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarOff className="w-4 h-4" />
              不在
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Visit-specific fields */}
              {activeTab === 'visit' && (
                <>
                  {/* Patient */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <User className="w-4 h-4" />
                      患者
                    </label>
                    <SearchableSelect
                      options={patients.map(p => ({ value: p.id, label: p.name }))}
                      value={patientId}
                      onChange={(val) => setPatientId(val as number)}
                      placeholder="患者を選択..."
                    />
                  </div>

                  {/* Staff */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <Users className="w-4 h-4" />
                      担当スタッフ
                    </label>
                    <select
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">未割り当て</option>
                      {staffs.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Event-specific fields */}
              {activeTab === 'event' && (
                <>
                  {/* Title */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <FileText className="w-4 h-4" />
                      タイトル
                    </label>
                    <input
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="イベントタイトル"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>

                  {/* Event Type */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      種別
                    </label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value as Exclude<EventType, 'absence'>)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Participants */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <Users className="w-4 h-4" />
                      参加者
                    </label>
                    <div className="border border-gray-300 rounded-lg max-h-32 overflow-y-auto">
                      {staffs.map((staff) => (
                        <label
                          key={staff.id}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={participantIds.includes(staff.id)}
                            onChange={() => toggleParticipant(staff.id)}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">{staff.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Absence-specific fields */}
              {activeTab === 'absence' && (
                <>
                  {/* Staff */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <User className="w-4 h-4" />
                      対象スタッフ
                    </label>
                    <select
                      value={absenceStaffId}
                      onChange={(e) => setAbsenceStaffId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      required
                    >
                      <option value="">スタッフを選択...</option>
                      {staffs.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Absence Reason */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <CalendarOff className="w-4 h-4" />
                      不在理由
                    </label>
                    <select
                      value={absenceReason}
                      onChange={(e) => setAbsenceReason(e.target.value as AbsenceReason)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    >
                      {Object.entries(ABSENCE_REASON_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* All Day Toggle */}
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAllDay}
                        onChange={(e) => setIsAllDay(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                      <span className="ml-3 text-sm font-medium text-gray-700">終日</span>
                    </label>
                  </div>
                </>
              )}

              {/* Common fields */}
              {/* Date & Time */}
              <div className={`grid ${activeTab === 'absence' && isAllDay ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4" />
                    日付
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                {!(activeTab === 'absence' && isAllDay) && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <Clock className="w-4 h-4" />
                      時刻
                    </label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Duration - hide for all-day absence */}
              {!(activeTab === 'absence' && isAllDay) && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <Clock className="w-4 h-4" />
                    時間
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {activeTab === 'absence' ? (
                      <>
                        <option value={240}>4時間（午前/午後）</option>
                        <option value={480}>8時間（終日）</option>
                      </>
                    ) : (
                      <>
                        <option value={30}>30分</option>
                        <option value={60}>60分</option>
                        <option value={90}>90分</option>
                        <option value={120}>120分</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <FileText className="w-4 h-4" />
                  メモ
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="..."
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex-none px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleFormSubmit}
            disabled={submitting || loading}
            className={activeTab === 'event' ? 'bg-purple-600 hover:bg-purple-700' : activeTab === 'absence' ? 'bg-gray-600 hover:bg-gray-700' : ''}
          >
            {submitting ? (
              <Spinner className="w-4 h-4" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-1" />
                保存
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
