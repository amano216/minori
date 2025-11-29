import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { X, User, Calendar, Clock, FileText, Save, Plus, Users } from 'lucide-react';
import { CalendarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import {
  createVisit,
  createEvent,
  fetchStaffs,
  fetchPatients,
  fetchPlanningLanes,
  type VisitInput,
  type Staff,
  type Patient,
  type Group,
  type EventType,
  type PlanningLane,
} from '../../api/client';
import { Button } from '../atoms/Button';
import { Spinner } from '../atoms/Spinner';
import { SearchableSelect } from '../molecules/SearchableSelect';

type TabType = 'visit' | 'event';

interface NewSchedulePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  initialDate?: Date;
  initialStaffId?: number;
  initialPlanningLaneId?: number;
  initialTab?: TabType;
  groups?: Group[];
}

const EVENT_TYPE_LABELS: Record<EventType, string> = {
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
  groups = [],
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
  const [eventType, setEventType] = useState<EventType>('meeting');
  const [participantIds, setParticipantIds] = useState<number[]>([]);

  // Data State
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [planningLanes, setPlanningLanes] = useState<PlanningLane[]>([]);
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
      setError('');
    } else {
      setIsVisible(false);
    }
  }, [isOpen, initialDate, initialStaffId, initialPlanningLaneId, initialTab]);

  const loadMasterData = async () => {
    try {
      setLoading(true);
      const [staffsData, patientsData, lanesData] = await Promise.all([
        fetchStaffs({ status: 'active' }),
        fetchPatients({ status: 'active' }),
        fetchPlanningLanes(),
      ]);
      setStaffs(staffsData);
      setPatients(patientsData);
      setPlanningLanes(lanesData);
    } catch (err: unknown) {
      console.error('Failed to load master data:', err);
      setError('マスターデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // Filter patients by planning lane's group
  const filteredPatients = useMemo(() => {
    if (!planningLaneId) return patients;
    
    const lane = planningLanes.find(l => l.id === planningLaneId);
    if (!lane || !lane.group_id) return patients;
    
    const group = groups.find(g => g.id === lane.group_id);
    if (!group) return patients;
    
    return patients.filter(p => p.group_id === lane.group_id);
  }, [patients, planningLaneId, planningLanes, groups]);

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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />
      
      {/* Panel */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-200 ${isVisible ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white">
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
        <div className="flex-shrink-0 px-4 pt-3 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('visit')}
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
              onClick={() => setActiveTab('event')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'event'
                  ? 'bg-white text-purple-600 border border-gray-200 border-b-white -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserGroupIcon className="w-4 h-4" />
              新規イベント
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <form onSubmit={activeTab === 'visit' ? handleSubmitVisit : handleSubmitEvent} className="space-y-4">
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
                      options={filteredPatients.map(p => ({ value: p.id, label: p.name }))}
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
                      onChange={(e) => setEventType(e.target.value as EventType)}
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

              {/* Common fields */}
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
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
              </div>

              {/* Duration */}
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
                  <option value={30}>30分</option>
                  <option value={60}>60分</option>
                  <option value={90}>90分</option>
                  <option value={120}>120分</option>
                </select>
              </div>

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
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
          >
            キャンセル
          </Button>
          <Button
            onClick={activeTab === 'visit' ? handleSubmitVisit : handleSubmitEvent}
            disabled={submitting || loading}
            className={activeTab === 'event' ? 'bg-purple-600 hover:bg-purple-700' : ''}
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
