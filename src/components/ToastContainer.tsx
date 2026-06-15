'use client';

import { useEffect, useState } from 'react';
import { useFinanceStore } from '@/lib/financeStore';

interface ToastItemProps {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
  onClose: () => void;
}

function ToastItem({ id, message, type, onClose }: ToastItemProps) {
  const [progress, setProgress] = useState(100);
  const duration = 4000; // 4 seconds

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        onClose();
      }
    }, 30);

    return () => clearInterval(interval);
  }, [onClose]);

  const typeConfig = {
    success: {
      icon: 'check_circle',
      iconClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      progressClass: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
      borderClass: 'border-emerald-500/20',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.07)]',
    },
    info: {
      icon: 'info',
      iconClass: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      progressClass: 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]',
      borderClass: 'border-sky-500/20',
      glow: 'shadow-[0_0_30px_rgba(14,165,233,0.07)]',
    },
    error: {
      icon: 'error',
      iconClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      progressClass: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
      borderClass: 'border-rose-500/20',
      glow: 'shadow-[0_0_30px_rgba(244,63,94,0.07)]',
    },
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border bg-slate-950/80 backdrop-blur-xl p-4 text-white shadow-2xl transition-all duration-300 pointer-events-auto hover:scale-[1.02] active:scale-[0.98] flex gap-3 ${config.borderClass} ${config.glow} animate-in slide-in-from-right-5 fade-in duration-300`}
    >
      {/* Icon Badge */}
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xl ${config.iconClass}`}>
        <span className="material-symbols-outlined">{config.icon}</span>
      </div>

      {/* Message & Close Button */}
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-semibold leading-relaxed tracking-wide text-slate-100 break-words pt-1">{message}</p>
      </div>

      <button
        onClick={onClose}
        className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>

      {/* Countdown Progress Bar */}
      <div className="absolute bottom-0 left-0 h-[3px] w-full bg-white/5">
        <div
          className={`h-full transition-all ease-linear ${config.progressClass}`}
          style={{ width: `${progress}%`, transitionDuration: '30ms' }}
        />
      </div>
    </div>
  );
}

export default function ToastContainer() {
  const notifications = useFinanceStore((state) => state.notifications);
  const removeNotification = useFinanceStore((state) => state.removeNotification);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-24 right-6 z-[9999] flex flex-col gap-3 w-80 max-w-[calc(100vw-3rem)] pointer-events-none">
      {notifications.map((n) => (
        <ToastItem
          key={n.id}
          id={n.id}
          message={n.message}
          type={n.type}
          onClose={() => removeNotification(n.id)}
        />
      ))}
    </div>
  );
}
