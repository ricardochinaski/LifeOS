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
  <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="shrink-0 rounded-2xl bg-slate-900 p-2.5 text-emerald-400 dark:bg-slate-800">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">{eyebrow}</p>
          <h1 className="mt-0.5 text-xl font-black tracking-tight text-slate-950 dark:text-white">{title}</h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {action}
        <button
          type="button"
          onClick={onOpenFull}
          className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-black text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Vista completa
        </button>
      </div>
    </div>
  </section>
);

export const FullModeBackButton: React.FC<{ onBack: () => void; label: string }> = ({ onBack, label }) => (
  <button
    type="button"
    onClick={onBack}
    className="mb-4 inline-flex min-h-10 items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
  >
    ← Volver a {label}
  </button>
);
