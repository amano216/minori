import type { LabelHTMLAttributes, ReactNode } from 'react';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
  required?: boolean;
}

export function Label({ children, required, className = '', ...props }: LabelProps) {
  return (
    <label
      className={`
        block text-sm font-medium text-secondary-700
        ${className}
      `}
      {...props}
    >
      {children}
      {required && <span className="text-danger-500 ml-1">*</span>}
    </label>
  );
}
