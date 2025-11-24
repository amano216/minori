import type { ReactNode } from 'react';
import { Spinner } from '../atoms/Spinner';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = 'データがありません',
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-secondary-600">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`
                  px-4 py-3 text-left text-xs font-bold text-secondary-700
                  bg-secondary-100 border-b border-border
                  ${column.className || ''}
                `}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              className={`
                border-b border-border
                hover:bg-secondary-50 transition-colors
                ${onRowClick ? 'cursor-pointer' : ''}
              `}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`
                    px-4 py-3 text-secondary-900
                    ${column.className || ''}
                  `}
                >
                  {column.render
                    ? column.render(item)
                    : String((item as Record<string, unknown>)[column.key] ?? '')
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface TableCardProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  title?: string;
  action?: ReactNode;
}

export function TableCard<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = 'データがありません',
  onRowClick,
  title,
  action,
}: TableCardProps<T>) {
  return (
    <div className="bg-white rounded-md border border-border">
      {(title || action) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          {title && (
            <h3 className="text-base font-bold text-secondary-900">{title}</h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={keyExtractor}
        loading={loading}
        emptyMessage={emptyMessage}
        onRowClick={onRowClick}
      />
    </div>
  );
}
