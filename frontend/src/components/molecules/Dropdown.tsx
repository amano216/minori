import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, children, align = 'left', className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const alignStyles = align === 'right' ? 'right-0' : 'left-0';

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className={`absolute ${alignStyles} mt-2 min-w-[160px] bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-40`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  icon?: ReactNode;
}

export function DropdownItem({
  children,
  onClick,
  disabled = false,
  danger = false,
  icon,
}: DropdownItemProps) {
  const baseStyles = 'w-full flex items-center gap-2 px-4 py-2 text-left text-sm transition-colors min-h-[40px]';
  const colorStyles = danger
    ? 'text-danger-600 hover:bg-danger-50'
    : 'text-gray-700 hover:bg-gray-50';
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <button
      className={`${baseStyles} ${colorStyles} ${disabledStyles}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

export function DropdownDivider() {
  return <hr className="my-1 border-gray-200" />;
}
