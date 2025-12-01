import { useState, useEffect, useCallback } from 'react';
import { X, Clock } from 'lucide-react';
import { fetchVersions, type AuditVersion } from '../../api/versionsApi';
import { Spinner } from '../atoms/Spinner';
import { HistoryItem } from '../molecules/HistoryItem';

interface PatternHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PATTERN_FIELD_LABELS: Record<string, string> = {
  patient_id: '患者',
  day_of_week: '曜日',
  start_time: '開始時刻',
  duration: '時間（分）',
  planning_lane_id: '計画レーン',
  staff_id: '担当スタッフ',
  notes: 'メモ',
  is_active: '有効',
};

const DAY_OF_WEEK_LABELS: Record<number, string> = {
  0: '日曜日',
  1: '月曜日',
  2: '火曜日',
  3: '水曜日',
  4: '木曜日',
  5: '金曜日',
  6: '土曜日',
};

const EVENT_LABELS: Record<string, string> = {
  create: '作成',
  update: '更新',
  destroy: '削除',
};

/**
 * changesを正しいフォーマットに変換
 * object_changesはキー名でグループ化された [before, after] の配列または {before, after} 形式
 */
function formatChangesForHistoryItem(objectChanges: Record<string, unknown> | null | undefined): Record<string, { before: unknown; after: unknown }> | undefined {
  if (!objectChanges) return undefined;
  
  const result: Record<string, { before: unknown; after: unknown }> = {};
  
  for (const [key, value] of Object.entries(objectChanges)) {
    if (Array.isArray(value) && value.length === 2) {
      // paper_trail形式: [before, after]
      let before = value[0];
      let after = value[1];
      
      // 曜日の変換
      if (key === 'day_of_week') {
        before = typeof before === 'number' ? DAY_OF_WEEK_LABELS[before] || before : before;
        after = typeof after === 'number' ? DAY_OF_WEEK_LABELS[after] || after : after;
      }
      
      result[key] = { before, after };
    }
  }
  
  return Object.keys(result).length > 0 ? result : undefined;
}

export function PatternHistoryPanel({ isOpen, onClose }: PatternHistoryPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [versions, setVersions] = useState<AuditVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadVersions = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      setLoading(true);
      setError('');
      const response = await fetchVersions({
        item_type: 'VisitPattern',
        page: pageNum,
        per_page: 20,
      });
      
      if (append) {
        setVersions(prev => [...prev, ...response.versions]);
      } else {
        setVersions(response.versions);
      }
      setHasMore(response.meta.current_page < response.meta.total_pages);
    } catch (err) {
      console.error('Failed to load pattern history:', err);
      setError('変更履歴の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
      setPage(1);
      loadVersions(1, false);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, loadVersions]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadVersions(nextPage, true);
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
        <div className="flex-none px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-emerald-50">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-gray-900">パターン変更履歴</span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {loading && versions.length === 0 ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : error ? (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              変更履歴がありません
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <HistoryItem
                  key={version.id}
                  event={version.event as 'create' | 'update' | 'destroy'}
                  eventLabel={EVENT_LABELS[version.event] || version.event}
                  whodunnitName={version.whodunnit_name}
                  createdAt={version.created_at}
                  changes={formatChangesForHistoryItem(version.object_changes)}
                  fieldLabels={PATTERN_FIELD_LABELS}
                />
              ))}
              
              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                >
                  {loading ? '読み込み中...' : 'もっと見る'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
