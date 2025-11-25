import { useState } from 'react';
import { Calendar, UserX, RefreshCw, Download } from 'lucide-react';
import { Button } from '../atoms/Button';

interface Staff {
  id: number;
  name: string;
}

interface QuickActionToolbarProps {
  staffs: Staff[];
  onSuddenLeave: (staffId: number) => Promise<void>;
  onBulkReassign?: () => void;
  onExport?: () => void;
}

export function QuickActionToolbar({
  staffs,
  onSuddenLeave,
  onBulkReassign,
  onExport,
}: QuickActionToolbarProps) {
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<number | ''>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSuddenLeave = async () => {
    if (!selectedStaffId) return;

    try {
      setIsProcessing(true);
      await onSuddenLeave(selectedStaffId);
      setShowLeaveModal(false);
      setSelectedStaffId('');
    } catch (error) {
      console.error('Failed to handle sudden leave:', error);
      alert('急な休みの処理に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>クイックアクション:</span>
        </div>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowLeaveModal(true)}
          className="flex items-center gap-2"
        >
          <UserX className="w-4 h-4" />
          急な休み
        </Button>

        {onBulkReassign && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onBulkReassign}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            一括再割当
          </Button>
        )}

        {onExport && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onExport}
            className="flex items-center gap-2 ml-auto"
          >
            <Download className="w-4 h-4" />
            エクスポート
          </Button>
        )}
      </div>

      {/* Sudden Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserX className="w-5 h-5 text-orange-500" />
              急な休みの処理
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              急に休みになったスタッフを選択してください。
              そのスタッフの本日以降の予定がすべて「未割当」になります。
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                スタッフを選択
              </label>
              <select
                value={selectedStaffId}
                onChange={(e) =>
                  setSelectedStaffId(e.target.value ? Number(e.target.value) : '')
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">スタッフを選択してください</option>
                {staffs.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowLeaveModal(false);
                  setSelectedStaffId('');
                }}
                disabled={isProcessing}
              >
                キャンセル
              </Button>
              <Button
                variant="primary"
                onClick={handleSuddenLeave}
                disabled={!selectedStaffId || isProcessing}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isProcessing ? '処理中...' : '未割当にする'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
