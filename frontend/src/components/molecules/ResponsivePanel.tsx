import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ResponsivePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /**
   * PC: サイドパネルの幅
   * @default 'md' (384px / w-96)
   */
  width?: 'sm' | 'md' | 'lg';
  /**
   * モバイル: パネルの最大高さ
   * @default '85vh'
   */
  mobileMaxHeight?: string;
  /**
   * クリックで閉じるバックドロップ
   * @default true
   */
  closeOnBackdrop?: boolean;
  /**
   * z-index レベル
   * @default 40
   */
  zIndex?: number;
}

const widthClasses = {
  sm: 'sm:w-80',
  md: 'sm:w-96',
  lg: 'sm:w-[480px]',
};

/**
 * レスポンシブパネルコンポーネント
 * - PC: 右サイドパネル（スライドイン）
 * - モバイル: 下からスライドアップするパネル
 */
export function ResponsivePanel({
  isOpen,
  onClose,
  title,
  children,
  footer,
  width = 'md',
  mobileMaxHeight = '85vh',
  closeOnBackdrop = true,
  zIndex = 40,
}: ResponsivePanelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // アニメーション開始を少し遅らせる
      const timer = setTimeout(() => setIsVisible(true), 10);
      // bodyのスクロールを無効化
      document.body.style.overflow = 'hidden';
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    } else {
      // isOpenがfalseになったとき、タイマーで非表示にする
      const timer = setTimeout(() => setIsVisible(false), 0);
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleBackdropClick = () => {
    if (closeOnBackdrop) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* バックドロップ（モバイルのみ） */}
      <div
        className={`fixed inset-0 bg-black/30 sm:hidden transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ zIndex: zIndex - 1 }}
        onClick={handleBackdropClick}
      />
      
      {/* パネル本体 */}
      <div
        className={`
          fixed
          /* モバイル: 下からスライドアップ */
          inset-x-0 bottom-0
          /* PC: 右サイドパネル */
          sm:inset-y-0 sm:inset-x-auto sm:right-0 sm:bottom-auto
          w-full ${widthClasses[width]}
          bg-white shadow-2xl
          /* モバイル: 角丸上部のみ */
          rounded-t-2xl sm:rounded-none
          /* PC: 左側にボーダー */
          sm:border-l sm:border-gray-200
          flex flex-col
          transform transition-all duration-300 ease-out
          ${isVisible 
            ? 'translate-y-0 sm:translate-x-0' 
            : 'translate-y-full sm:translate-y-0 sm:translate-x-full'
          }
        `}
        style={{ 
          zIndex,
          maxHeight: `var(--mobile-max-height, ${mobileMaxHeight})`,
        }}
      >
        {/* モバイル: ドラッグハンドル */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* ヘッダー */}
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
            <div className="font-semibold text-gray-900">
              {title}
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors -mr-2"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        )}

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* フッター（オプション） */}
        {footer && (
          <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
            {footer}
          </div>
        )}
      </div>

      {/* PC: 閉じるときのバックドロップ（クリックで閉じる） */}
      {closeOnBackdrop && (
        <div
          className="hidden sm:block fixed inset-0 bg-transparent"
          style={{ zIndex: zIndex - 2 }}
          onClick={handleBackdropClick}
        />
      )}
    </>,
    document.body
  );
}
