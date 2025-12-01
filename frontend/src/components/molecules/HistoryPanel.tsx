import { useState, useEffect, useCallback } from 'react';
import { HiClipboardDocumentList, HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import { Spinner } from '../atoms';
import { HistoryItem } from './HistoryItem';
import { fetchVersions, fetchVersionDetail, type AuditVersion } from '../../api/versionsApi';

interface HistoryPanelProps {
  itemType: 'Patient' | 'Visit';
  itemId: number;
  fieldLabels?: Record<string, string>;
  className?: string;
}

/**
 * Google Docs風の変更履歴パネル
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
    <div className={`bg-white rounded-lg border border-secondary-200 ${className}`}>
      <div className="px-4 py-3 border-b border-secondary-200 flex items-center gap-2">
        <HiClipboardDocumentList className="w-5 h-5 text-secondary-500" />
        <h3 className="font-medium text-secondary-700">変更履歴</h3>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-danger-600">{error}</div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8 text-secondary-400">
            履歴がありません
          </div>
        ) : (
          <div className="space-y-1">
            {versions.map((version) => (
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
                />
              </div>
            ))}
          </div>
        )}

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-secondary-100">
            <button
              onClick={handlePrevPage}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-secondary-600 hover:text-secondary-800 disabled:text-secondary-300 disabled:cursor-not-allowed transition-colors"
            >
              <HiChevronLeft className="w-4 h-4" />
              前へ
            </button>
            <span className="text-sm text-secondary-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-secondary-600 hover:text-secondary-800 disabled:text-secondary-300 disabled:cursor-not-allowed transition-colors"
            >
              次へ
              <HiChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
