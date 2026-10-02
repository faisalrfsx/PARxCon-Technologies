import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  isDestructive = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
        <div className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 text-left shadow-2xl transition-all sm:my-8 w-full max-w-md border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${isDestructive ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400' : 'bg-amber-100 text-amber-600'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{message}</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                isDestructive
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-sm'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-sm'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
