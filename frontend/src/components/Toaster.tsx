import React, { useEffect } from 'react';
import { create } from 'zustand';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: { label: string; onClick: () => void };
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, action?: { label: string; onClick: () => void }, customId?: string) => void;
  removeToast: (id: string) => void;
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type = 'info', action, customId) => {
    const id = customId || crypto.randomUUID();
    set((state) => {
      const existingIdx = state.toasts.findIndex(t => t.id === id);
      if (existingIdx >= 0) {
        const newToasts = [...state.toasts];
        newToasts[existingIdx] = { ...newToasts[existingIdx], message, type, action };
        return { toasts: newToasts };
      }
      return { toasts: [...state.toasts, { id, message, type, action }] };
    });
    
    // Clear the timeout for this specific toast and set a new one
    // (We could store timeouts in a ref, but simple deduplication usually means we just let it fade after 5s of the last update)
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 5000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }))
}));

export function Toaster() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="animate-in fade-in slide-in-from-bottom-4 pointer-events-auto">
          <div className={`flex items-center gap-3 px-4 py-3 rounded border shadow-lg ${
            toast.type === 'success' ? 'bg-[var(--surface)] border-[var(--accent)] text-[var(--accent)]' :
            toast.type === 'error' ? 'bg-[var(--surface)] border-[var(--danger)] text-[var(--danger)]' :
            'bg-[var(--surface)] border-[var(--info)] text-[var(--info)]'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 size={20} /> :
             toast.type === 'error' ? <XCircle size={20} /> :
             <Info size={20} />}
            <span className="font-bold text-[var(--text-primary)] text-sm flex-1">{toast.message}</span>
            {toast.action && (
              <button 
                onClick={() => {
                  toast.action!.onClick();
                  removeToast(toast.id);
                }} 
                className="px-2 py-1 ml-2 text-xs font-bold rounded bg-black/20 hover:bg-black/40 text-[var(--text-primary)]"
              >
                {toast.action.label}
              </button>
            )}
            <button onClick={() => removeToast(toast.id)} className="ml-2 text-[var(--text-muted)] hover:text-white">&times;</button>
          </div>
        </div>
      ))}
    </div>
  );
}
