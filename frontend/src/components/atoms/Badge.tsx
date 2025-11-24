import type { ReactNode } from 'react';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'error';
type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-secondary-100 text-secondary-700',
  primary: 'bg-primary-50 text-primary-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
  info: 'bg-primary-50 text-main',
  error: 'bg-danger-50 text-danger-600',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-0.5 text-xs',
};

export function Badge({ variant = 'default', size = 'md', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center
        font-bold
        rounded-full
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
