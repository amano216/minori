import { useToast } from '../../contexts/ToastContext';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ICON_MAP = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLOR_MAP = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
};

export function ToastContainer() {
  const { toasts, hideToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
      {toasts.map(toast => {
        const Icon = ICON_MAP[toast.type];
        const colorClass = COLOR_MAP[toast.type];

        return (
          <div
            key={toast.id}
            className={`${colorClass} border rounded-lg shadow-lg p-4 min-w-[320px] max-w-md pointer-events-auto animate-slide-in-right`}
          >
            <div className="flex items-start gap-3">
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="flex-1 text-sm font-medium">{toast.message}</p>
              <button
                onClick={() => hideToast(toast.id)}
                className="flex-shrink-0 hover:opacity-70 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
