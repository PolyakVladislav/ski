import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  title: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmSheet({ title, message, confirmLabel = 'מחק', onConfirm, onCancel }: Props) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40 animate-fade-in" />
      <div
        className="relative w-full max-w-[400px] px-3 pb-3 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-ios-card rounded-2xl overflow-hidden mb-2">
          <div className="px-4 pt-4 pb-2 text-center">
            <p className="text-[13px] font-semibold text-ios-label">{title}</p>
            {message && <p className="text-[13px] text-ios-gray mt-1">{message}</p>}
          </div>
          <div className="border-t border-ios-separator">
            <button
              onClick={onConfirm}
              className="w-full py-3 text-[17px] font-normal text-red-500 active:bg-ios-gray5 transition-colors"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="w-full bg-ios-card rounded-2xl py-3 text-[17px] font-semibold text-ios-blue active:bg-ios-gray5 transition-colors"
        >
          ביטול
        </button>
      </div>
    </div>,
    document.body
  );
}
