import type { ReactNode } from 'react';

interface ListLayoutProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  filters?: ReactNode;
  className?: string;
}

export function ListLayout({
  title,
  children,
  action,
  filters,
  className = '',
}: ListLayoutProps) {
  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">{title}</h1>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>

      {/* Filters */}
      {filters && (
        <div className="mb-6">
          {filters}
        </div>
      )}

      {/* Content */}
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function PageHeader({
  title,
  subtitle,
  action,
  breadcrumbs,
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="text-sm text-secondary-500 mb-2">
          {breadcrumbs.map((crumb, index) => (
            <span key={index}>
              {index > 0 && <span className="mx-2">/</span>}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="hover:text-secondary-700 transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-secondary-700">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-secondary-500">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
