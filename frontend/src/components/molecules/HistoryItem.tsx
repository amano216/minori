import { ClockIcon, UserIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { Badge } from '../atoms';

interface Change {
  before: unknown;
  after: unknown;
}

interface HistoryItemProps {
  event: 'create' | 'update' | 'destroy';
  eventLabel: string;
  whodunnitName: string | null;
  createdAt: string;
  changes?: Record<string, Change>;
  fieldLabels?: Record<string, string>;
}

const eventVariants: Record<string, 'success' | 'info' | 'danger'> = {
  create: 'success',
  update: 'info',
  destroy: 'danger',
};

/**
 * 変更値をフォーマット
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '(空)';
  if (typeof value === 'boolean') return value ? 'はい' : 'いいえ';
  if (Array.isArray(value)) {
    if (value.length === 0) return '(空)';
    return value.map(v => formatValue(v)).join(', ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

/**
 * 日時をフォーマット
 */
function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 監査ログの1件を表示するコンポーネント
 * Google Docs風の変更履歴表示
 */
export function HistoryItem({
  event,
  eventLabel,
  whodunnitName,
  createdAt,
  changes,
  fieldLabels = {},
}: HistoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChanges = changes && Object.keys(changes).length > 0;

  // 表示しない内部フィールド
  const hiddenFields = ['updated_at', 'created_at', 'id', 'organization_id'];

  const visibleChanges = changes
    ? Object.entries(changes).filter(([key]) => !hiddenFields.includes(key))
    : [];

  return (
    <div className="border-l-2 border-secondary-200 pl-4 py-2 hover:bg-secondary-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={eventVariants[event] || 'default'} size="sm">
              {eventLabel}
            </Badge>
            <span className="text-sm text-secondary-500 flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5" />
              {whodunnitName || '不明'}
            </span>
          </div>
          <div className="text-xs text-secondary-400 flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            {formatDateTime(createdAt)}
          </div>
        </div>

        {hasChanges && visibleChanges.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-secondary-400 hover:text-secondary-600 transition-colors"
            aria-label={isExpanded ? '詳細を閉じる' : '詳細を表示'}
          >
            {isExpanded ? (
              <ChevronUpIcon className="w-5 h-5" />
            ) : (
              <ChevronDownIcon className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {/* 変更差分の表示 */}
      {isExpanded && visibleChanges.length > 0 && (
        <div className="mt-3 space-y-2">
          {visibleChanges.map(([field, change]) => (
            <div key={field} className="text-sm bg-white rounded p-2 border border-secondary-100">
              <div className="font-medium text-secondary-600 mb-1">
                {fieldLabels[field] || field}
              </div>
              <div className="flex items-start gap-2 text-xs">
                <span className="bg-danger-50 text-danger-700 px-2 py-0.5 rounded line-through">
                  {formatValue(change.before)}
                </span>
                <span className="text-secondary-400">→</span>
                <span className="bg-success-50 text-success-700 px-2 py-0.5 rounded">
                  {formatValue(change.after)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
