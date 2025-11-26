import type { SelectHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, className = '', children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`
          w-full px-3 py-2
          min-h-[44px] sm:min-h-[40px]
          text-base sm:text-sm text-secondary-900
          bg-white
          border rounded
          transition-all duration-150
          hover:border-secondary-500
          focus:border-main focus:ring-2 focus:ring-main/40 focus:outline-none
          disabled:bg-secondary-100 disabled:cursor-not-allowed disabled:text-secondary-400
          ${error
            ? 'border-danger focus:ring-danger/40 focus:border-danger'
            : 'border-border-dark'
          }
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';
