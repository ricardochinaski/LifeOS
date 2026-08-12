import React, { useMemo } from 'react';
import { AlertTriangle, BookOpen, ChevronRight, HeartPulse, ShieldAlert, Wallet } from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';
import type { TabType } from '../../types';

const FINANCE_SEED_IDS = new Set([
  'acc_1', 'acc_2', 'acc_3',
  'bud_1', 'bud_2', 'bud_3', 'bud_4',
  'debt_1', 'debt_2', 'debt_3',
]);

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

  const readiness = useMemo(() => {
    const financeCount = [
      ...accounts.map((item) => item.id),
      ...budgets.map((item) => item.id),
      ...debts.map((item) => item.id),
    ].filter((id) => FINANCE_SEED_IDS.has(id)).length;

    const healthSeedLog = healthLogs.some((log) => log.id === 'hlog_1');
    const healthSeedProfile =
      healthProfile.emergencyContact?.phone === '+56 9 1234 5678' ||
      healthProfile.notes === 'Ficha médica limpia e inicializada hoy. Lista para monitoreo de constantes vitales.';
    const healthCount = Number(healthSeedLog) + Number(healthSeedProfile);

    const libraryCount =
      Number(books.some((book) => book.id === 'book_1')) +
      Number(bookNotes.some((note) => note.id === 'note_1'));

    return { financeCount, healthCount, libraryCount };
  }, [accounts, budgets, debts, healthLogs, healthProfile, books, bookNotes]);

  const total = readiness.financeCount + readiness.healthCount + readiness.libraryCount;
  if (total === 0) return null;

  const moduleButton = (
    tab: TabType,
    label: string,
    detail: string,
    count: number,
    icon: React.ReactNode,
  ) => {
    if (count === 0) return null;
    return (
      <button
        type="button"
        onClick={() => setActiveTab(tab)}
        className="flex min-h-14 items-center gap-3 rounded-2xl border border-amber-200 bg-white/80 px-3 py-3 text-left transition hover:border-amber-400 dark:border-amber-900 dark:bg-slate-900/70"
      >
        <div className="rounded-xl bg-amber-100 p-2 text-amber-700 dark:bg-amber-950 dark:text-amber-300">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-slate-950 dark:text-white">{label}</p>
          <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-slate-400">{detail}</p>
        </div>
        <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700 dark:bg-amber-950 dark:text-amber-300">{count}</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
      </button>
    );
  };

  return (
    <section className="mb-4 rounded-3xl border border-amber-300 bg-amber-50 p-4 shadow-sm dark:border-amber-900 dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-amber-400 p-2.5 text-slate-950">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">Preparación de datos</p>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-700 dark:bg-amber-950 dark:text-amber-300">DEMO DETECTADO</span>
          </div>
          <h2 className="mt-1 text-base font-black text-slate-950 dark:text-white">Revisa estos módulos antes del piloto</h2>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
            LifeOS todavía detecta identificadores o valores de demostración. Este aviso no borra ni modifica nada; evita que confundamos seeds con tus datos reales.
          </p>

          <div className="mt-3 grid gap-2 lg:grid-cols-3">
            {moduleButton('finances', 'Finanzas', 'Cuentas, presupuestos o deudas seed pendientes de reemplazar.', readiness.financeCount, <Wallet className="h-4 w-4" />)}
            {moduleButton('health', 'Salud', 'Perfil o registro inicial de ejemplo todavía detectable.', readiness.healthCount, <HeartPulse className="h-4 w-4" />)}
            {moduleButton('library', 'Biblioteca', 'Libro o nota de ejemplo todavía presentes.', readiness.libraryCount, <BookOpen className="h-4 w-4" />)}
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-2xl bg-white/60 px-3 py-2 text-[10px] leading-4 text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span>El guard desaparece automáticamente cuando ya no detecta esos seeds. Los elementos que hayas editado no se eliminan desde aquí.</span>
          </div>
        </div>
      </div>
    </section>
  );
};
