import type { ReactNode } from 'react';

interface AlertProps {
  variant?: 'error' | 'warning' | 'success' | 'info';
  children: ReactNode;
  className?: string;
}

const variantStyles = {
  error: 'bg-danger-50 border-danger-200 text-danger-700',
  warning: 'bg-warning-50 border-warning-200 text-warning-700',
  success: 'bg-success-50 border-success-200 text-success-700',
  info: 'bg-primary-50 border-primary-200 text-primary-700',
};

export function Alert({ variant = 'error', children, className = '' }: AlertProps) {
  return (
    <div
      className={`
        border rounded-lg p-3 sm:p-4 text-sm
        ${variantStyles[variant]}
        ${className}
      `}
      role="alert"
    >
      {children}
    </div>
  );
}
