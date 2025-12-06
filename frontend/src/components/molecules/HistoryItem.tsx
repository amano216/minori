import { ClockIcon, UserCircleIcon, ChevronDownIcon, ChevronUpIcon, PlusCircleIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

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
  isLast?: boolean;
}

const eventConfig: Record<string, { icon: typeof PlusCircleIcon; color: string; bgColor: string; borderColor: string }> = {
  create: { 
    icon: PlusCircleIcon, 
    color: 'text-emerald-600', 
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  update: { 
    icon: PencilSquareIcon, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  destroy: { 
    icon: TrashIcon, 
    color: 'text-red-600', 
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
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
 * 相対時間をフォーマット
 */
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'たった今';
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;
  
  return date.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * フル日時をフォーマット
 */
function formatFullDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 監査ログの1件を表示するコンポーネント
 * タイムライン形式の変更履歴表示
 */
export function HistoryItem({
  event,
  eventLabel,
  whodunnitName,
  createdAt,
  changes,
  fieldLabels = {},
  isLast = false,
}: HistoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChanges = changes && Object.keys(changes).length > 0;

  // 表示しない内部フィールド
  const hiddenFields = ['updated_at', 'created_at', 'id', 'organization_id'];

  const visibleChanges = changes
    ? Object.entries(changes).filter(([key]) => !hiddenFields.includes(key))
    : [];

  const config = eventConfig[event] || eventConfig.update;
  const IconComponent = config.icon;

  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-gradient-to-b from-gray-200 to-transparent" />
      )}
      
      {/* Icon */}
      <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full ${config.bgColor} border-2 ${config.borderColor} flex items-center justify-center`}>
        <IconComponent className={`w-5 h-5 ${config.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          {/* Header */}
          <div 
            className={`px-4 py-3 ${hasChanges && visibleChanges.length > 0 ? 'cursor-pointer' : ''}`}
            onClick={() => hasChanges && visibleChanges.length > 0 && setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                  {eventLabel}
                </span>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <UserCircleIcon className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{whodunnitName || '不明'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span 
                  className="text-xs text-gray-400 flex items-center gap-1"
                  title={formatFullDateTime(createdAt)}
                >
                  <ClockIcon className="w-3.5 h-3.5" />
                  {formatRelativeTime(createdAt)}
                </span>
                {hasChanges && visibleChanges.length > 0 && (
                  <button
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={isExpanded ? '詳細を閉じる' : '詳細を表示'}
                  >
                    {isExpanded ? (
                      <ChevronUpIcon className="w-4 h-4" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 変更差分の表示 */}
          {isExpanded && visibleChanges.length > 0 && (
            <div className="px-4 pb-4 border-t border-gray-50">
              <div className="mt-3 space-y-2">
                {visibleChanges.map(([field, change]) => (
                  <div 
                    key={field} 
                    className="rounded-lg bg-gray-50 p-3"
                  >
                    <div className="text-xs font-medium text-gray-500 mb-2">
                      {fieldLabels[field] || field}
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-400 mb-1">変更前</div>
                        <div className="text-sm text-red-700 bg-red-50 px-2 py-1 rounded border border-red-100 break-words">
                          {formatValue(change.before)}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-gray-300 pt-6">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-400 mb-1">変更後</div>
                        <div className="text-sm text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 break-words">
                          {formatValue(change.after)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
