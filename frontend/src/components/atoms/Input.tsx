import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          w-full px-3 py-2
          min-h-[40px]
          text-sm text-secondary-900
          bg-white
          border rounded
          transition-all duration-150
          placeholder:text-secondary-400
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
      />
    );
  }
);

Input.displayName = 'Input';
