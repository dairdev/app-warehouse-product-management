import React from 'react';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        let Icon = CheckCircle2;
        let bgStyle = 'bg-stone-900 text-white border-stone-800';
        let iconColor = 'text-yellow-400';

        if (toast.type === 'error') {
          bgStyle = 'bg-red-950 text-red-50 border-red-800';
          iconColor = 'text-red-400';
          Icon = AlertCircle;
        } else if (toast.type === 'info') {
          bgStyle = 'bg-stone-900 text-stone-100 border-stone-700';
          iconColor = 'text-sky-400';
          Icon = Info;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200 ${bgStyle}`}
          >
            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 leading-snug">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-stone-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
