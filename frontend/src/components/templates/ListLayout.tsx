import type { ReactNode } from 'react';

export interface ListLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  filters?: ReactNode;
  className?: string;
}

export function ListLayout({
  title,
  description,
  children,
  actions,
  filters,
  className = '',
}: ListLayoutProps) {
  return (
    <div className={`p-4 sm:p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-black">{title}</h1>
          {description && (
            <p className="mt-1 text-xs sm:text-sm text-text-grey">{description}</p>
          )}
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>

      {/* Filters */}
      {filters && (
        <div className="mb-4 sm:mb-6">
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
    <div className="mb-4 sm:mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="text-xs sm:text-sm text-text-grey mb-2">
          {breadcrumbs.map((crumb, index) => (
            <span key={index}>
              {index > 0 && <span className="mx-1 sm:mx-2">/</span>}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="hover:text-text-black transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-text-black">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-black">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-xs sm:text-sm text-text-grey">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
