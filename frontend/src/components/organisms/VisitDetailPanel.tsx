import { useState, useEffect } from 'react';
import { X, Clock, User, FileText, MapPin, Calendar } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';

interface Visit {
  id: number;
  patient_id: number;
  patient_name: string;
  staff_id?: number;
  staff_name?: string;
  scheduled_at: string;
  duration: number;
  status: string;
  visit_type?: string;
  notes?: string;
  address?: string;
}

interface VisitDetailPanelProps {
  visit: Visit | null;
  onClose: () => void;
  onEdit?: (visitId: number) => void;
  onCancel?: (visitId: number) => void;
  onComplete?: (visitId: number) => void;
  onReassign?: (visitId: number) => void;
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: '予定',
  in_progress: '実施中',
  completed: '完了',
  cancelled: 'キャンセル',
  unassigned: '未割当',
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  unassigned: 'bg-gray-100 text-gray-800',
};

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return `${hours}時間${mins}分`;
  } else if (hours > 0) {
    return `${hours}時間`;
  } else {
    return `${mins}分`;
  }
}

export function VisitDetailPanel({
  visit,
  onClose,
  onEdit,
  onCancel,
  onComplete,
  onReassign,
}: VisitDetailPanelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (visit) {
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [visit]);

  if (!visit) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const canEdit = visit.status === 'scheduled' || visit.status === 'unassigned';
  const canCancel = visit.status === 'scheduled' || visit.status === 'in_progress';
  const canComplete = visit.status === 'scheduled' || visit.status === 'in_progress';
  const canReassign = visit.status === 'scheduled' || visit.status === 'unassigned';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isVisible ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">訪問詳細</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-140px)]">
          <div className="p-4 space-y-4">
            {/* Status */}
            <div>
              <Badge className={STATUS_COLORS[visit.status]}>
                {STATUS_LABELS[visit.status]}
              </Badge>
            </div>

            {/* Patient */}
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">患者</div>
                <div className="font-medium text-gray-900">{visit.patient_name}</div>
              </div>
            </div>

            {/* Staff */}
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">担当スタッフ</div>
                <div className="font-medium text-gray-900">
                  {visit.staff_name || '未割当'}
                </div>
              </div>
            </div>

            {/* Scheduled Time */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">予定日時</div>
                <div className="font-medium text-gray-900">
                  {formatDateTime(visit.scheduled_at)}
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">所要時間</div>
                <div className="font-medium text-gray-900">
                  {formatDuration(visit.duration)}
                </div>
              </div>
            </div>

            {/* Visit Type */}
            {visit.visit_type && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">訪問種別</div>
                  <div className="font-medium text-gray-900">{visit.visit_type}</div>
                </div>
              </div>
            )}

            {/* Address */}
            {visit.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">訪問先</div>
                  <div className="font-medium text-gray-900">{visit.address}</div>
                </div>
              </div>
            )}

            {/* Notes */}
            {visit.notes && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">メモ</div>
                  <div className="text-gray-700 whitespace-pre-wrap">{visit.notes}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50 space-y-2">
          {onEdit && canEdit && (
            <Button
              variant="primary"
              className="w-full"
              onClick={() => onEdit(visit.id)}
            >
              編集
            </Button>
          )}

          <div className="flex gap-2">
            {onReassign && canReassign && (
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => onReassign(visit.id)}
              >
                再割当
              </Button>
            )}
            {onComplete && canComplete && (
              <Button
                variant="secondary"
                className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
                onClick={() => onComplete(visit.id)}
              >
                完了
              </Button>
            )}
            {onCancel && canCancel && (
              <Button
                variant="secondary"
                className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => onCancel(visit.id)}
              >
                キャンセル
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
