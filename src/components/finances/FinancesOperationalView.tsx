import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Plus, Receipt, Wallet } from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';
import { todayLocalDate } from '../../lib/dateOnly';
import { isDemoAccount, isDemoBudget, isDemoDebt } from '../../lib/demoData';
import { OperationalModeHeader, FullModeBackButton } from '../common/OperationalModeHeader';
import { FinancesView, formatCLP } from './FinancesView';

export const FinancesOperationalView: React.FC = () => {
  const {
    accounts,
    transactions,
    budgets,
    debts,
    financialGoals,
    recurringTransactions,
    openQuickCapture,
  } = useLifeOS();
  const [fullMode, setFullMode] = useState(false);
  const month = todayLocalDate().slice(0, 7);

  const realAccounts = useMemo(() => accounts.filter((item) => !isDemoAccount(item)), [accounts]);
  const realBudgets = useMemo(() => budgets.filter((item) => !isDemoBudget(item)), [budgets]);
  const realDebts = useMemo(() => debts.filter((item) => !isDemoDebt(item)), [debts]);
  const demoCount = accounts.length + budgets.length + debts.length - realAccounts.length - realBudgets.length - realDebts.length;

  const summary = useMemo(() => {
    const monthly = transactions.filter((tx) => tx.date.startsWith(month));
    const income = monthly.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const expenses = monthly.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
    const balance = realAccounts.reduce((sum, account) => sum + account.balance, 0);
    const debt = realDebts.reduce((sum, item) => sum + item.remainingAmount, 0);
    const activeRecurring = recurringTransactions.filter((item) => item.active).length;
    return { income, expenses, balance, debt, activeRecurring };
  }, [month, realAccounts, realDebts, recurringTransactions, transactions]);

  const recent = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
    [transactions],
  );

  const budgetWarnings = useMemo(() => realBudgets
    .filter((budget) => budget.period === month)
    .map((budget) => {
      const spent = transactions
        .filter((tx) => tx.type === 'expense' && tx.date.startsWith(month) && tx.category === budget.category)
        .reduce((sum, tx) => sum + tx.amount, 0);
      const pct = budget.monthlyLimit > 0 ? Math.round((spent / budget.monthlyLimit) * 100) : 0;
      return { ...budget, spent, pct };
    })
    .filter((budget) => budget.pct >= 80)
    .sort((a, b) => b.pct - a.pct), [realBudgets, month, transactions]);

  if (fullMode) {
    return (
      <div>
        <FullModeBackButton onBack={() => setFullMode(false)} label="modo operativo" />
        <FinancesView />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-3 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] animate-fade-in">
      <OperationalModeHeader
        eyebrow="Finanzas"
        title="Estado financiero"
        description="Caja, flujo del mes y alertas con datos reales."
        icon={<Wallet className="h-5 w-5" />}
        onOpenFull={() => setFullMode(true)}
        action={(
          <button
            type="button"
            onClick={openQuickCapture}
            className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-slate-950"
          >
            <Plus className="h-4 w-4" /> Movimiento
          </button>
        )}
      />

      {demoCount > 0 && (
        <section className="rounded-2xl border border-amber-800/70 bg-amber-950/20 px-3 py-2.5 text-xs text-amber-200">
          <span className="font-black">Datos demo ocultos.</span> {demoCount} seeds financieros intactos no participan en balance, deuda ni alertas operativas. Si editas uno, pasa a considerarse dato real.
        </section>
      )}

      <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <div className="col-span-2 rounded-2xl bg-slate-950 p-3 text-white lg:col-span-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Balance real</p>
          <p className="mt-1 text-xl font-black">{realAccounts.length > 0 ? formatCLP(summary.balance) : 'Sin configurar'}</p>
          <p className="mt-1 text-[10px] text-slate-400">{realAccounts.length} cuenta{realAccounts.length === 1 ? '' : 's'} real{realAccounts.length === 1 ? '' : 'es'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          <p className="mt-1.5 text-[10px] font-black uppercase text-slate-400">Ingresos mes</p>
          <p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{formatCLP(summary.income)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <ArrowDownRight className="h-4 w-4 text-rose-500" />
          <p className="mt-1.5 text-[10px] font-black uppercase text-slate-400">Gastos mes</p>
          <p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{formatCLP(summary.expenses)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <Receipt className="h-4 w-4 text-sky-500" />
          <p className="mt-1.5 text-[10px] font-black uppercase text-slate-400">Flujo neto</p>
          <p className={`mt-1 text-lg font-black ${summary.income - summary.expenses >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{formatCLP(summary.income - summary.expenses)}</p>
        </div>
      </section>

      {(budgetWarnings.length > 0 || summary.debt > 0) && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            <h2 className="text-xs font-black uppercase tracking-wider">Atención financiera</h2>
          </div>
          <div className="mt-2 space-y-2 text-xs text-slate-700 dark:text-slate-300">
            {budgetWarnings.slice(0, 3).map((budget) => (
              <div key={budget.id} className="flex items-center justify-between gap-3">
                <span className="truncate font-bold">{budget.category}</span>
                <span className="shrink-0 font-black">{budget.pct}%</span>
              </div>
            ))}
            {summary.debt > 0 && (
              <div className="flex items-center justify-between gap-3 border-t border-amber-200 pt-2 dark:border-amber-900">
                <span className="font-bold">Deuda pendiente real</span>
                <span className="font-black">{formatCLP(summary.debt)}</span>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Actividad reciente</p>
            <h2 className="text-sm font-black text-slate-950 dark:text-white">Últimos movimientos</h2>
          </div>
          <span className="text-[10px] font-bold text-slate-400">{summary.activeRecurring} recurrentes · {financialGoals.length} metas</span>
        </div>
        <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
          {recent.length === 0 && <p className="py-5 text-center text-xs text-slate-500">Sin movimientos reales registrados.</p>}
          {recent.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-slate-900 dark:text-white">{tx.description}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">{tx.category} · {tx.date}</p>
              </div>
              <p className={`shrink-0 text-xs font-black ${tx.type === 'income' ? 'text-emerald-600' : tx.type === 'expense' ? 'text-rose-500' : 'text-sky-500'}`}>
                {tx.type === 'income' ? '+' : tx.type === 'expense' ? '−' : ''}{formatCLP(tx.amount)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
