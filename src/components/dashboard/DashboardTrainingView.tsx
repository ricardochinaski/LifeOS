import React, { useMemo } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Circle,
  Dumbbell,
  Flame,
  ListTodo,
  Wallet,
} from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';
import { buildDailyPlan } from '../../lib/dailyPlan';
import { dateOnlyToLocalDate, differenceInDateOnlyDays, todayLocalDate } from '../../lib/dateOnly';
import { isDemoBook, isDemoBudget } from '../../lib/demoData';
import { ShiftDashboardCard } from './ShiftDashboardCard';
import { TimerCard } from './TimerCard';

const priorityClass: Record<string, string> = {
  p1: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  p2: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  p3: 'bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300',
  p4: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

const formatMoney = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: currency === 'CLP' ? 0 : 2 }).format(value);
  } catch {
    return `${value.toLocaleString('es-CL')} ${currency}`;
  }
};

export const DashboardTrainingView: React.FC = () => {
  const {
    tasks,
    toggleTaskStatus,
    habits,
    habitLogs,
    logHabit,
    budgets,
    transactions,
    books,
    workoutLogs,
    shiftInfo,
    appSettings,
    setActiveTab,
  } = useLifeOS();

  const today = todayLocalDate();
  const plan = useMemo(
    () => buildDailyPlan({ tasks, habits, habitLogs, today, phase: shiftInfo.phase, maxTasks: 3 }),
    [tasks, habits, habitLogs, today, shiftInfo.phase],
  );
  const dateRaw = dateOnlyToLocalDate(today).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
  const dateLabel = dateRaw.charAt(0).toUpperCase() + dateRaw.slice(1);
  const month = today.slice(0, 7);
  const realBudgets = budgets.filter((budget) => !isDemoBudget(budget));
  const monthExpenses = transactions.filter((transaction) => transaction.type === 'expense' && transaction.date.startsWith(month)).reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthBudget = realBudgets.filter((budget) => budget.period === month).reduce((sum, budget) => sum + budget.monthlyLimit, 0);
  const budgetPct = monthBudget > 0 ? Math.min(999, Math.round((monthExpenses / monthBudget) * 100)) : null;
  const workoutMinutesToday = workoutLogs.filter((workout) => workout.date === today).reduce((sum, workout) => sum + workout.durationMinutes, 0);
  const workouts7 = workoutLogs.filter((workout) => {
    const diff = differenceInDateOnlyDays(today, workout.date);
    return diff >= 0 && diff <= 6;
  });
  const workoutMinutes7 = workouts7.reduce((sum, workout) => sum + workout.durationMinutes, 0);
  const activeBook = books.find((book) => book.status === 'reading' && !isDemoBook(book));
  const openTasks = tasks.filter((task) => task.status !== 'completed').length;
  const remainingHabits = Math.max(0, plan.dueHabits.length - plan.habitsCompleted);
  const nextTask = plan.focusTasks[0];
  const contextTitle = plan.overdueCount > 0 ? 'Hoy requiere atención' : nextTask ? 'Día enfocado' : 'Día bajo control';
  const contextSummary = [
    `${plan.focusTasks.length}/3 prioridades`,
    remainingHabits > 0 ? `${remainingHabits} hábitos pendientes` : 'hábitos al día',
    workouts7.length ? `${workouts7.length} entreno${workouts7.length === 1 ? '' : 's'} en 7 días` : 'sin entrenos esta semana',
  ].join(' · ');

  const dueLabel = (dueDate?: string) => {
    if (!dueDate) return 'Sin fecha';
    if (dueDate < today) return 'Atrasada';
    if (dueDate === today) return 'Hoy';
    return dateOnlyToLocalDate(dueDate).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-3 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] animate-fade-in sm:space-y-5">
      <header className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-xl">
        <div className="p-4 sm:p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-400">LifeOS · Mi día</p>
          <h1 className="mt-0.5 text-2xl font-black tracking-tight sm:text-3xl">{dateLabel}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span className="rounded-full bg-white/5 px-2.5 py-1 font-bold">{shiftInfo.phase === 'work' ? 'Faena' : 'Descanso'} · día {shiftInfo.dayInPhase}/{shiftInfo.totalPhaseDays}</span>
            <span>{shiftInfo.daysRemaining} días para el cambio</span>
          </div>
          <div className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 ${plan.overdueCount > 0 ? 'bg-rose-500/10 text-rose-200' : 'bg-emerald-500/10 text-emerald-200'}`}>
            {plan.overdueCount > 0 ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
            <p className="min-w-0 flex-1 text-xs"><span className="font-black">{contextTitle}</span> · {contextSummary}</p>
            <button onClick={() => setActiveTab('tasks')} className="shrink-0 text-[10px] font-black text-white/80">Tareas</button>
          </div>
        </div>
        <div className="grid grid-cols-4 border-t border-slate-800 bg-slate-900/80 text-center">
          <div className="p-2.5"><p className="text-[9px] font-bold uppercase text-slate-500">Atrasadas</p><p className={`mt-0.5 text-lg font-black ${plan.overdueCount ? 'text-rose-400' : 'text-white'}`}>{plan.overdueCount}</p></div>
          <div className="border-l border-slate-800 p-2.5"><p className="text-[9px] font-bold uppercase text-slate-500">Hoy</p><p className="mt-0.5 text-lg font-black text-amber-300">{plan.todayCount}</p></div>
          <div className="border-l border-slate-800 p-2.5"><p className="text-[9px] font-bold uppercase text-slate-500">Hábitos</p><p className="mt-0.5 text-lg font-black text-emerald-300">{plan.habitsCompleted}/{plan.dueHabits.length}</p></div>
          <button onClick={() => setActiveTab('health')} className="border-l border-slate-800 p-2.5"><p className="text-[9px] font-bold uppercase text-slate-500">Entreno</p><p className="mt-0.5 text-lg font-black text-sky-300">{workoutMinutesToday} min</p></button>
        </div>
      </header>

      <section className="grid gap-3 lg:grid-cols-[1.45fr_0.85fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-500">Prioridad ejecutable</p><h2 className="text-lg font-black text-slate-950 dark:text-white">Plan del día</h2></div><button onClick={() => setActiveTab('tasks')} className="flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-400">Todas <ChevronRight className="h-4 w-4" /></button></div>
          <div className="space-y-2">
            {plan.focusTasks.length === 0 ? <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 p-5 text-center dark:border-emerald-900 dark:bg-emerald-950/20"><CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500" /><p className="mt-2 text-sm font-black text-slate-900 dark:text-white">Sin tareas críticas ahora</p></div> : plan.focusTasks.map((task) => {
              const overdue = Boolean(task.dueDate && task.dueDate < today);
              return <div key={task.id} className={`flex items-start gap-3 rounded-xl border p-3 ${overdue ? 'border-rose-200 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/20' : 'border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40'}`}><button onClick={() => toggleTaskStatus(task.id)} className="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-500"><Circle className="h-5 w-5" /></button><div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-950 dark:text-white">{task.title}</p><div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-bold"><span className={`rounded-full px-2 py-1 ${priorityClass[task.priority]}`}>{task.priority.toUpperCase()}</span><span className={`rounded-full px-2 py-1 ${overdue ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200'}`}>{dueLabel(task.dueDate)}</span>{task.dueTime && <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-600 dark:bg-slate-700 dark:text-slate-200">{task.dueTime}</span>}</div></div></div>;
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
            <div className="mb-2 flex items-center justify-between"><div className="flex items-center gap-2"><Flame className="h-5 w-5 text-amber-500" /><h2 className="font-black text-slate-950 dark:text-white">Hábitos de hoy</h2></div><button onClick={() => setActiveTab('habits')} className="text-xs font-bold text-slate-400">Abrir</button></div>
            <div className="space-y-1.5">{plan.dueHabits.length === 0 ? <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/50">No hay hábitos programados.</p> : plan.dueHabits.slice(0, 5).map((habit) => {
              const done = plan.completedHabitIds.has(habit.id);
              return <button key={habit.id} onClick={() => logHabit(habit.id)} className={`flex min-h-10 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left ${done ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30' : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40'}`}>{done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> : <Circle className="h-4 w-4 shrink-0 text-slate-400" />}<span className={`min-w-0 flex-1 truncate text-xs font-bold ${done ? 'text-emerald-700 line-through dark:text-emerald-300' : 'text-slate-800 dark:text-slate-100'}`}>{habit.title}</span><span className="text-[10px] font-bold text-slate-400">{habit.targetValue} {habit.unit}</span></button>;
            })}</div>
          </div>

          <button onClick={() => setActiveTab('health')} className="w-full rounded-2xl border border-sky-500/20 bg-sky-500/5 p-3 text-left shadow-sm">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Dumbbell className="h-5 w-5 text-sky-400" /><div><p className="text-[9px] font-black uppercase tracking-widest text-sky-400">Entrenamientos</p><p className="text-sm font-black text-slate-950 dark:text-white">{workouts7.length} sesiones · {workoutMinutes7} min</p></div></div><ChevronRight className="h-5 w-5 text-slate-500" /></div>
          </button>
        </div>
      </section>

      <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3 sm:p-4"><div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Divulgación progresiva</p><p className="text-sm font-black text-slate-900 dark:text-white">Estado y módulos</p></div><ChevronRight className="h-5 w-5 text-slate-400 transition group-open:rotate-90" /></summary>
        <div className="grid grid-cols-2 gap-3 border-t border-slate-200 p-3 dark:border-slate-800 sm:grid-cols-4 sm:p-4">
          <button onClick={() => setActiveTab('finances')} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left dark:border-slate-800 dark:bg-slate-950/40"><Wallet className="h-5 w-5 text-sky-500" /><p className="mt-2 text-[10px] font-black uppercase text-slate-400">Finanzas</p><p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{formatMoney(monthExpenses, appSettings.currency)}</p><p className="mt-1 text-[10px] text-slate-500">{budgetPct === null ? 'Sin presupuesto real' : `${budgetPct}% del presupuesto`}</p></button>
          <button onClick={() => setActiveTab('health')} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left dark:border-slate-800 dark:bg-slate-950/40"><Dumbbell className="h-5 w-5 text-amber-500" /><p className="mt-2 text-[10px] font-black uppercase text-slate-400">Entrenamientos</p><p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{workouts7.length} sesiones / 7d</p><p className="mt-1 text-[10px] text-slate-500">{workoutMinutes7} min acumulados</p></button>
          <button onClick={() => setActiveTab('library')} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left dark:border-slate-800 dark:bg-slate-950/40"><BookOpen className="h-5 w-5 text-violet-500" /><p className="mt-2 text-[10px] font-black uppercase text-slate-400">Lectura</p><p className="mt-1 truncate text-sm font-black text-slate-900 dark:text-white">{activeBook?.title || 'Sin lectura real activa'}</p><p className="mt-1 text-[10px] text-slate-500">{activeBook ? `Página ${activeBook.currentPage}/${activeBook.totalPages}` : 'Elegir próxima lectura'}</p></button>
          <button onClick={() => setActiveTab('tasks')} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left dark:border-slate-800 dark:bg-slate-950/40"><ListTodo className="h-5 w-5 text-amber-500" /><p className="mt-2 text-[10px] font-black uppercase text-slate-400">Pendientes</p><p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{openTasks} abiertos</p><p className="mt-1 text-[10px] text-slate-500">{plan.upcomingCount} con fecha futura</p></button>
        </div>
      </details>

      <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3 sm:p-4"><div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Herramientas secundarias</p><p className="text-sm font-black text-slate-900 dark:text-white">Turno y temporizador de foco</p></div><ChevronRight className="h-5 w-5 text-slate-400 transition group-open:rotate-90" /></summary>
        <div className="grid gap-4 border-t border-slate-200 p-3 dark:border-slate-800 sm:p-4 lg:grid-cols-2"><ShiftDashboardCard /><TimerCard /></div>
      </details>
    </div>
  );
};