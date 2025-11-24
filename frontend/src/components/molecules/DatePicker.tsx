import { Label } from '../atoms/Label';
import { Input } from '../atoms/Input';

interface DatePickerProps {
  label?: string;
  name: string;
  value: string;
  onChange: (date: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  min?: string;
  max?: string;
  className?: string;
}

export function DatePicker({
  label,
  name,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  min,
  max,
  className = '',
}: DatePickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <Label htmlFor={name} required={required}>
          {label}
        </Label>
      )}
      <Input
        id={name}
        name={name}
        type="date"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        error={!!error}
        min={min}
        max={max}
      />
      {error && (
        <p className="text-sm text-danger-500">{error}</p>
      )}
    </div>
  );
}

interface TimePickerProps {
  label?: string;
  name: string;
  value: string;
  onChange: (time: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  min?: string;
  max?: string;
  step?: number;
  className?: string;
}

export function TimePicker({
  label,
  name,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  min,
  max,
  step = 900,
  className = '',
}: TimePickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <Label htmlFor={name} required={required}>
          {label}
        </Label>
      )}
      <Input
        id={name}
        name={name}
        type="time"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        error={!!error}
        min={min}
        max={max}
        step={step}
      />
      {error && (
        <p className="text-sm text-danger-500">{error}</p>
      )}
    </div>
  );
}

interface DateTimePickerProps {
  label?: string;
  name: string;
  value: string;
  onChange: (datetime: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  min?: string;
  max?: string;
  className?: string;
}

export function DateTimePicker({
  label,
  name,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  min,
  max,
  className = '',
}: DateTimePickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <Label htmlFor={name} required={required}>
          {label}
        </Label>
      )}
      <Input
        id={name}
        name={name}
        type="datetime-local"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        error={!!error}
        min={min}
        max={max}
      />
      {error && (
        <p className="text-sm text-danger-500">{error}</p>
      )}
    </div>
  );
}
