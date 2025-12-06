import { useState, useRef, useEffect, type ReactNode } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

export interface SelectOption {
  value: string | number;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string | number | '';
  onChange: (value: string | number | '') => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  allowClear?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = '選択してください',
  searchPlaceholder = '検索...',
  disabled = false,
  required = false,
  allowClear = false,
  icon,
  className = '',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // フィルタリングされたオプション
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opt.sublabel?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 外部クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // 開いた時に検索にフォーカス
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // キーボードナビゲーション
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    } else if (e.key === 'Enter' && filteredOptions.length === 1) {
      onChange(filteredOptions[0].value);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* トリガーボタン */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2
          px-3 py-2.5 
          bg-white border border-gray-300 rounded-lg
          text-left text-base
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed
          transition-colors
          ${isOpen ? 'ring-2 ring-indigo-500 border-transparent' : ''}
        `}
      >
        <span className="flex items-center gap-2 flex-1 min-w-0">
          {icon}
          {selectedOption ? (
            <span className="truncate text-gray-900">{selectedOption.label}</span>
          ) : (
            <span className="truncate text-gray-400">{placeholder}</span>
          )}
        </span>
        <span className="flex items-center gap-1 flex-shrink-0">
          {allowClear && value && !required && (
            <span
              onClick={handleClear}
              className="p-0.5 hover:bg-gray-100 rounded-full cursor-pointer"
            >
              <XMarkIcon className="w-4 h-4 text-gray-400" />
            </span>
          )}
          <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {/* ドロップダウンパネル */}
      {isOpen && (
        <div
          ref={listRef}
          className={`
            absolute z-[200] mt-1
            w-full
            bg-white border border-gray-200 rounded-lg shadow-lg
            max-h-80
            rounded-lg
            flex flex-col
            overflow-hidden
          `}
        >
          {/* 検索入力 */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* オプションリスト */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                該当する項目がありません
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full px-4 py-3 text-left flex items-center gap-3
                    hover:bg-indigo-50 transition-colors
                    ${option.value === value ? 'bg-indigo-50' : ''}
                  `}
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-base text-gray-900 truncate">{option.label}</span>
                    {option.sublabel && (
                      <span className="block text-xs text-gray-500 truncate">{option.sublabel}</span>
                    )}
                  </span>
                  {option.value === value && (
                    <CheckIcon className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
