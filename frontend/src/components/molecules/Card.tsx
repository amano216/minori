import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  onClick?: () => void;
  hoverable?: boolean;
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const shadowStyles = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
};

export function Card({
  children,
  className = '',
  padding = 'md',
  shadow = 'sm',
  border = true,
  onClick,
  hoverable = false,
}: CardProps) {
  const baseStyles = 'bg-white rounded-lg';
  const borderStyles = border ? 'border border-gray-200' : '';
  const hoverStyles = hoverable ? 'transition-shadow hover:shadow-md cursor-pointer' : '';
  const clickableStyles = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseStyles} ${paddingStyles[padding]} ${shadowStyles[shadow]} ${borderStyles} ${hoverStyles} ${clickableStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function CardHeader({ children, className = '', action }: CardHeaderProps) {
  return (
    <div className={`flex items-center justify-between pb-3 border-b border-gray-100 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900">{children}</h3>
      {action && <div>{action}</div>}
    </div>
  );
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return (
    <div className={`py-3 ${className}`}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

const alignStyles = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
};

export function CardFooter({ children, className = '', align = 'right' }: CardFooterProps) {
  return (
    <div className={`flex items-center gap-2 pt-3 border-t border-gray-100 ${alignStyles[align]} ${className}`}>
      {children}
    </div>
  );
}
