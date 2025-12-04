import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

type DialogVariant = 'warning' | 'danger' | 'info';

interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
}

interface ConfirmDialogContextType {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider');
  }
  return context;
}

interface ConfirmDialogProviderProps {
  children: ReactNode;
}

export function ConfirmDialogProvider({ children }: ConfirmDialogProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmDialogOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    
    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    resolvePromise?.(true);
    setResolvePromise(null);
    setOptions(null);
  }, [resolvePromise]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    resolvePromise?.(false);
    setResolvePromise(null);
    setOptions(null);
  }, [resolvePromise]);

  const getVariantStyles = (variant: DialogVariant = 'info') => {
    switch (variant) {
      case 'warning':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          buttonBg: 'bg-amber-600 hover:bg-amber-700',
        };
      case 'danger':
        return {
          icon: AlertCircle,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          buttonBg: 'bg-red-600 hover:bg-red-700',
        };
      case 'info':
      default:
        return {
          icon: Info,
          iconBg: 'bg-indigo-100',
          iconColor: 'text-indigo-600',
          buttonBg: 'bg-indigo-600 hover:bg-indigo-700',
        };
    }
  };

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      
      {/* Dialog Overlay */}
      {isOpen && options && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={handleCancel}
          />
          
          {/* Dialog */}
          <div className="relative bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 transform transition-all animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={handleCancel}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Content */}
            <div className="p-6">
              {/* Icon */}
              {(() => {
                const styles = getVariantStyles(options.variant);
                const IconComponent = styles.icon;
                return (
                  <div className={`mx-auto w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center mb-4`}>
                    <IconComponent className={`w-6 h-6 ${styles.iconColor}`} />
                  </div>
                );
              })()}
              
              {/* Title */}
              <h3 
                id="confirm-dialog-title"
                className="text-lg font-semibold text-gray-900 text-center mb-2"
              >
                {options.title}
              </h3>
              
              {/* Message */}
              <p className="text-sm text-gray-600 text-center whitespace-pre-line">
                {options.message}
              </p>
            </div>
            
            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                {options.cancelLabel || 'キャンセル'}
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${getVariantStyles(options.variant).buttonBg}`}
              >
                {options.confirmLabel || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
}
