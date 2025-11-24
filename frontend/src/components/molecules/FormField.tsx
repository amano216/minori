import { Label } from '../atoms/Label';
import { Input } from '../atoms/Input';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'date' | 'time' | 'datetime-local';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
  className?: string;
}

export function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  hint,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <Label htmlFor={name} required={required}>
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        error={!!error}
      />
      {hint && !error && (
        <p className="text-sm text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="text-sm text-danger-500">{error}</p>
      )}
    </div>
  );
}

interface TextareaFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
  rows?: number;
  className?: string;
}

export function TextareaField({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  hint,
  rows = 3,
  className = '',
}: TextareaFieldProps) {
  const baseStyles = 'w-full px-3 py-2 border rounded-md text-base transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[44px]';
  const errorStyles = error
    ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500'
    : 'border-gray-300 hover:border-gray-400';
  const disabledStyles = disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white';

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <Label htmlFor={name} required={required}>
        {label}
      </Label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`${baseStyles} ${errorStyles} ${disabledStyles} resize-y`}
      />
      {hint && !error && (
        <p className="text-sm text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="text-sm text-danger-500">{error}</p>
      )}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
  className?: string;
}

export function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  disabled = false,
  error,
  hint,
  className = '',
}: SelectFieldProps) {
  const baseStyles = 'w-full px-3 py-2 border rounded-md text-base transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[44px]';
  const errorStyles = error
    ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500'
    : 'border-gray-300 hover:border-gray-400';
  const disabledStyles = disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white';

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <Label htmlFor={name} required={required}>
        {label}
      </Label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`${baseStyles} ${errorStyles} ${disabledStyles}`}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && !error && (
        <p className="text-sm text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="text-sm text-danger-500">{error}</p>
      )}
    </div>
  );
}
