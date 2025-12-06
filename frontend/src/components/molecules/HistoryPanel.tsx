import { useState, useEffect, useCallback } from 'react';
import { ClockIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Spinner } from '../atoms';
import { HistoryItem } from './HistoryItem';
import { fetchVersions, fetchVersionDetail, type AuditVersion, type AuditItemType } from '../../api/versionsApi';

interface HistoryPanelProps {
  itemType: AuditItemType;
  itemId: number;
  fieldLabels?: Record<string, string>;
  className?: string;
}

/**
 * タイムライン形式の変更履歴パネル
 * 患者・訪問の作成/更新/削除履歴を表示
 */
export function HistoryPanel({
  itemType,
  itemId,
  fieldLabels = {},
  className = '',
}: HistoryPanelProps) {
  const [versions, setVersions] = useState<AuditVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const perPage = 10;

  const loadVersions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchVersions({
        item_type: itemType,
        item_id: itemId,
        page,
        per_page: perPage,
      });
      setVersions(response.versions);
      setTotalPages(response.meta.total_pages);
    } catch (err) {
      console.error('Failed to load versions:', err);
      setError('履歴の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [itemType, itemId, page]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const loadVersionDetail = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    try {
      const response = await fetchVersionDetail(id);
      // 詳細データでversionsを更新
      setVersions((prev) =>
        prev.map((v) =>
          v.id === id
            ? { ...v, object_changes: response.version.object_changes }
            : v
        )
      );
      setExpandedId(id);
    } catch (err) {
      console.error('Failed to load version detail:', err);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <div className={`bg-gradient-to-b from-gray-50/50 to-white rounded-xl border border-gray-200 ${className}`}>
      <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <ClockIcon className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">変更履歴</h3>
          <p className="text-xs text-gray-500">すべての変更が記録されています</p>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="md" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">{error}</div>
        ) : versions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <ClockIcon className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400">履歴がありません</p>
          </div>
        ) : (
          <div className="space-y-0">
            {versions.map((version, index) => (
              <div
                key={version.id}
                onClick={() => version.event !== 'create' && loadVersionDetail(version.id)}
                className={version.event !== 'create' ? 'cursor-pointer' : ''}
              >
                <HistoryItem
                  event={version.event}
                  eventLabel={version.event_label}
                  whodunnitName={version.whodunnit_name}
                  createdAt={version.created_at}
                  changes={
                    expandedId === version.id ? version.object_changes : undefined
                  }
                  fieldLabels={fieldLabels}
                  isLast={index === versions.length - 1}
                />
              </div>
            ))}
          </div>
        )}

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={handlePrevPage}
              disabled={page === 1}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              前へ
            </button>
            <span className="text-sm text-gray-500 font-medium">
              {page} / {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={page === totalPages}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
            >
              次へ
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
