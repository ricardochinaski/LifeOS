import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface OperationalModeHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  onOpenFull: () => void;
  action?: React.ReactNode;
}

export const OperationalModeHeader: React.FC<OperationalModeHeaderProps> = ({
  eyebrow,
  title,
  description,
  icon,
  onOpenFull,
  action,
}) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-center gap-3">
      <div className="shrink-0 rounded-xl bg-slate-900 p-2 text-emerald-400 dark:bg-slate-800">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">{eyebrow}</p>
        <h1 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">{title}</h1>
        <p className="mt-0.5 hidden text-[11px] leading-4 text-slate-500 dark:text-slate-400 sm:block">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {action}
        <button
          type="button"
          onClick={onOpenFull}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-black text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Vista completa</span>
          <span className="sm:hidden">Más</span>
        </button>
      </div>
    </div>
  </section>
);

export const FullModeBackButton: React.FC<{ onBack: () => void; label: string }> = ({ onBack, label }) => (
  <button
    type="button"
    onClick={onBack}
    className="mb-3 inline-flex min-h-9 items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
  >
    ← Volver a {label}
  </button>
);
