import React, { useMemo, useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, ShieldAlert, Wallet } from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';
import { getDemoReadiness } from '../../lib/demoData';
import type { TabType } from '../../types';

export const DemoDataGuardCard: React.FC = () => {
  const {
    accounts,
    budgets,
    debts,
    healthProfile,
    healthLogs,
    books,
    bookNotes,
    setActiveTab,
  } = useLifeOS();
  const [expanded, setExpanded] = useState(false);

  const readiness = useMemo(
    () => getDemoReadiness({ accounts, budgets, debts, healthProfile, healthLogs, books, bookNotes }),
    [accounts, budgets, debts, healthLogs, healthProfile, books, bookNotes],
  );
  const visibleTotal = readiness.financeCount + readiness.libraryCount;

  if (visibleTotal === 0) return null;

  const moduleButton = (tab: TabType, label: string, count: number, icon: React.ReactNode) => {
    if (count === 0) return null;
    return (
      <button type="button" onClick={() => setActiveTab(tab)} className="flex min-h-11 items-center gap-2 rounded-2xl border border-amber-300/60 bg-white/70 px-3 py-2 text-left dark:border-amber-900 dark:bg-slate-900/70">
        <div className="rounded-xl bg-amber-100 p-1.5 text-amber-700 dark:bg-amber-950 dark:text-amber-300">{icon}</div>
        <span className="min-w-0 flex-1 text-xs font-black text-slate-950 dark:text-white">{label}</span>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:bg-amber-950 dark:text-amber-300">{count}</span>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
      </button>
    );
  };

  return (
    <section className="mb-3 rounded-2xl border border-amber-300/70 bg-amber-50/90 p-3 shadow-sm dark:border-amber-900 dark:bg-amber-950/20">
      <button type="button" onClick={() => setExpanded((value) => !value)} className="flex w-full items-center gap-3 text-left" aria-expanded={expanded}>
        <div className="rounded-xl bg-amber-400 p-2 text-slate-950"><ShieldAlert className="h-4 w-4" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-black text-slate-950 dark:text-white">{visibleTotal} datos demo pendientes</p><span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase text-amber-700 dark:bg-amber-950 dark:text-amber-300">Revisar antes del piloto</span></div>
          <p className="mt-0.5 truncate text-[10px] text-slate-500 dark:text-slate-400">Finanzas {readiness.financeCount} · Biblioteca {readiness.libraryCount}</p>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {moduleButton('finances', 'Finanzas', readiness.financeCount, <Wallet className="h-4 w-4" />)}
          {moduleButton('library', 'Biblioteca', readiness.libraryCount, <BookOpen className="h-4 w-4" />)}
          <p className="sm:col-span-2 text-[10px] leading-4 text-slate-500 dark:text-slate-400">Los datos históricos de módulos retirados se conservan internamente para evitar pérdida de información, pero ya no forman parte del entorno operativo.</p>
        </div>
      )}
    </section>
  );
};