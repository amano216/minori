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
          min-h-[44px]
          text-base text-secondary-900
          bg-white
          border rounded-lg
          transition-colors duration-200
          placeholder:text-secondary-400
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          disabled:bg-secondary-100 disabled:cursor-not-allowed
          ${error
            ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500'
            : 'border-secondary-300 hover:border-secondary-400'
          }
          ${className}
        `}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
