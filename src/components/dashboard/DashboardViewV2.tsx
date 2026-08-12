import React, { useMemo } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Circle,
  Cloud,
  Dumbbell,
  Flame,
  HeartPulse,
  ListTodo,
  Plus,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';
import { buildDailyPlan } from '../../lib/dailyPlan';
import { dateOnlyToLocalDate, todayLocalDate } from '../../lib/dateOnly';
import { ShiftDashboardCard } from './ShiftDashboardCard';
import { TimerCard } from './TimerCard';

const priorityClass: Record<string, string> = {
  p1: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  p2: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  p3: 'bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300',
  p4: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'CLP' ? 0 : 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString('es-CL')} ${currency}`;
  }
}

export const DashboardViewV2: React.FC = () => {
  const {
    tasks,
    toggleTaskStatus,
    habits,
    habitLogs,
    logHabit,
    budgets,
    transactions,
    books,
    healthLogs,
    workoutLogs,
    shiftInfo,
    syncState,
    lastSyncedAt,
    currentUser,
    appSettings,
    setActiveTab,
    openQuickCapture,
  } = useLifeOS();

  const today = todayLocalDate();
  const plan = useMemo(
    () => buildDailyPlan({ tasks, habits, habitLogs, today, phase: shiftInfo.phase, maxTasks: 3 }),
    [tasks, habits, habitLogs, today, shiftInfo.phase],
  );

  const dateLabel = dateOnlyToLocalDate(today).toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const month = today.slice(0, 7);
  const monthExpenses = transactions
    .filter((transaction) => transaction.type === 'expense' && transaction.date.startsWith(month))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthBudget = budgets
    .filter((budget) => budget.period === month)
    .reduce((sum, budget) => sum + budget.monthlyLimit, 0);
  const budgetPct = monthBudget > 0 ? Math.min(999, Math.round((monthExpenses / monthBudget) * 100)) : null;

  const latestHealthLog = useMemo(
    () => [...healthLogs].sort((a, b) => `${b.date} ${b.time || ''}`.localeCompare(`${a.date} ${a.time || ''}`))[0],
    [healthLogs],
  );
  const workoutMinutesToday = workoutLogs
    .filter((workout) => workout.date === today)
    .reduce((sum, workout) => sum + workout.durationMinutes, 0);
  const activeBook = books.find((book) => book.status === 'reading');
  const syncHasError = Object.values(syncState).some((state) => state === 'error');
  const syncIsBusy = Object.values(syncState).some((state) => state === 'syncing');
  const openTasks = tasks.filter((task) => task.status !== 'completed').length;
  const nextTask = plan.focusTasks[0];
  const remainingHabits = Math.max(0, plan.dueHabits.length - plan.habitsCompleted);

  const contextTitle = plan.overdueCount > 0
    ? 'Hoy requiere atención'
    : nextTask
      ? 'Día enfocado'
      : 'Día bajo control';

  const contextSummary = plan.overdueCount > 0
    ? `${plan.overdueCount} tarea${plan.overdueCount === 1 ? '' : 's'} atrasada${plan.overdueCount === 1 ? '' : 's'}.${nextTask ? ` Empieza por “${nextTask.title}”.` : ''}`
    : nextTask
      ? `${plan.focusTasks.length} prioridad${plan.focusTasks.length === 1 ? '' : 'es'} visible${plan.focusTasks.length === 1 ? '' : 's'}. Empieza por “${nextTask.title}”.`
      : remainingHabits > 0
        ? `Sin tareas críticas ahora. Quedan ${remainingHabits} hábito${remainingHabits === 1 ? '' : 's'} por registrar.`
        : 'No hay tareas críticas ni hábitos pendientes para este contexto.';

  const dueLabel = (dueDate?: string) => {
    if (!dueDate) return 'Sin fecha';
    if (dueDate < today) return 'Atrasada';
    if (dueDate === today) return 'Hoy';
    return dateOnlyToLocalDate(dueDate).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] animate-fade-in sm:space-y-6">
      <header className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-xl">
        <div className="p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-400">LifeOS · Mi día</p>
              <h1 className="mt-1 text-2xl font-black capitalize tracking-tight sm:text-3xl">{dateLabel}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span className="rounded-full bg-white/5 px-2.5 py-1 font-bold">
                  {shiftInfo.phase === 'work' ? 'Faena' : 'Descanso'} · día {shiftInfo.dayInPhase}/{shiftInfo.totalPhaseDays}
                </span>
                <span>{shiftInfo.daysRemaining} días para el cambio</span>
              </div>
            </div>
            <button
              onClick={openQuickCapture}
              className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-emerald-300 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Capturar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 border-t border-slate-800 bg-slate-900/80 text-center">
          <div className="p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">Atrasadas</p>
            <p className={`mt-1 text-lg font-black ${plan.overdueCount ? 'text-rose-400' : 'text-white'}`}>{plan.overdueCount}</p>
          </div>
          <div className="border-l border-slate-800 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">Hoy</p>
            <p className="mt-1 text-lg font-black text-amber-300">{plan.todayCount}</p>
          </div>
          <div className="border-l border-slate-800 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">Hábitos</p>
            <p className="mt-1 text-lg font-black text-emerald-300">{plan.habitsCompleted}/{plan.dueHabits.length}</p>
          </div>
          <div className="border-l border-slate-800 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">Entreno</p>
            <p className="mt-1 text-lg font-black text-sky-300">{workoutMinutesToday}m</p>
          </div>
        </div>
      </header>

      <section className={`rounded-3xl border p-4 shadow-sm sm:p-5 ${plan.overdueCount > 0 ? 'border-rose-200 bg-rose-50/80 dark:border-rose-900 dark:bg-rose-950/20' : 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20'}`}>
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 rounded-2xl p-2.5 ${plan.overdueCount > 0 ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300'}`}>
            {plan.overdueCount > 0 ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Contexto de hoy</p>
            <h2 className="mt-0.5 text-lg font-black text-slate-950 dark:text-white">{contextTitle}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{contextSummary}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <span className="rounded-full bg-white/70 px-2.5 py-1 dark:bg-slate-900/60">{shiftInfo.phase === 'work' ? 'Faena' : 'Descanso'} · día {shiftInfo.dayInPhase}/{shiftInfo.totalPhaseDays}</span>
              <span className="rounded-full bg-white/70 px-2.5 py-1 dark:bg-slate-900/60">{plan.focusTasks.length}/3 prioridades visibles</span>
              {remainingHabits > 0 && <span className="rounded-full bg-white/70 px-2.5 py-1 dark:bg-slate-900/60">{remainingHabits} hábitos pendientes</span>}
            </div>
          </div>
          <button onClick={() => setActiveTab('tasks')} className="shrink-0 rounded-xl px-2 py-1 text-xs font-black text-emerald-700 hover:bg-white/70 dark:text-emerald-300 dark:hover:bg-slate-900/50">
            Ver tareas
          </button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.45fr_0.85fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-500">Prioridad ejecutable</p>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">Plan del día</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">Máximo 3 prioridades para mantener foco.</p>
            </div>
            <button onClick={() => setActiveTab('tasks')} className="flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-400">
              Todas <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2.5">
            {plan.focusTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/60 p-6 text-center dark:border-emerald-900 dark:bg-emerald-950/20">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">Sin tareas críticas ahora</p>
                <p className="mt-1 text-xs text-slate-500">Puedes planificar la siguiente acción o concentrarte en tus hábitos.</p>
              </div>
            ) : plan.focusTasks.map((task) => {
              const overdue = Boolean(task.dueDate && task.dueDate < today);
              return (
                <div key={task.id} className={`flex items-start gap-3 rounded-2xl border p-3.5 ${overdue ? 'border-rose-200 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/20' : 'border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40'}`}>
                  <button onClick={() => toggleTaskStatus(task.id)} className="mt-0.5 shrink-0 text-slate-400 transition hover:text-emerald-500" aria-label={`Completar ${task.title}`}>
                    <Circle className="h-5 w-5" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-950 dark:text-white">{task.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                      <span className={`rounded-full px-2 py-1 ${priorityClass[task.priority]}`}>{task.priority.toUpperCase()}</span>
                      <span className={`rounded-full px-2 py-1 ${overdue ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200'}`}>{dueLabel(task.dueDate)}</span>
                      {task.dueTime && <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-600 dark:bg-slate-700 dark:text-slate-200">{task.dueTime}</span>}
                      {task.estimatedMinutes && <span className="text-slate-400">~{task.estimatedMinutes} min</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={openQuickCapture} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 text-xs font-bold text-slate-500 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-400">
            <Plus className="h-4 w-4" /> Nueva acción rápida
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-500" />
                <h2 className="font-black text-slate-950 dark:text-white">Hábitos de hoy</h2>
              </div>
              <button onClick={() => setActiveTab('habits')} className="text-xs font-bold text-slate-400">Abrir</button>
            </div>
            <div className="space-y-2">
              {plan.dueHabits.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-500 dark:bg-slate-800/50">No hay hábitos programados para este contexto.</p>
              ) : plan.dueHabits.slice(0, 5).map((habit) => {
                const done = plan.completedHabitIds.has(habit.id);
                return (
                  <button key={habit.id} onClick={() => logHabit(habit.id)} className={`flex min-h-11 w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${done ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30' : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40'}`}>
                    {done ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" /> : <Circle className="h-5 w-5 shrink-0 text-slate-400" />}
                    <span className={`min-w-0 flex-1 truncate text-xs font-bold ${done ? 'text-emerald-700 line-through dark:text-emerald-300' : 'text-slate-800 dark:text-slate-100'}`}>{habit.title}</span>
                    <span className="text-[10px] font-bold text-slate-400">{habit.targetValue} {habit.unit}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {(syncHasError || !currentUser || syncIsBusy) && (
            <div className={`rounded-3xl border p-4 shadow-sm ${syncHasError ? 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30' : 'border-slate-800 bg-slate-900 text-white'}`}>
              <div className="flex items-center gap-2">
                {syncIsBusy ? <RefreshCw className="h-4 w-4 animate-spin text-sky-400" /> : <Cloud className={`h-4 w-4 ${syncHasError ? 'text-rose-500' : 'text-emerald-400'}`} />}
                <p className={`text-xs font-black ${syncHasError ? 'text-rose-800 dark:text-rose-200' : ''}`}>Datos y sincronización</p>
              </div>
              <p className={`mt-2 text-sm font-bold ${syncHasError ? 'text-rose-700 dark:text-rose-300' : 'text-slate-200'}`}>
                {syncHasError ? 'Hay un módulo con error de sincronización.' : currentUser ? 'Sincronizando cambios.' : 'Datos locales activos. Inicia sesión para respaldo cloud.'}
              </p>
              {lastSyncedAt && <p className={`mt-1 text-[10px] ${syncHasError ? 'text-rose-500' : 'text-slate-500'}`}>Último sync: {new Date(lastSyncedAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>}
            </div>
          )}
        </div>
      </section>

      <details className="group rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Divulgación progresiva</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">Estado y módulos</p>
            <p className="mt-1 text-[11px] text-slate-500">Consulta detalles cuando los necesites sin cargar el Inicio.</p>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400 transition group-open:rotate-90" />
        </summary>
        <div className="grid grid-cols-2 gap-3 border-t border-slate-200 p-4 dark:border-slate-800 sm:grid-cols-4 sm:p-5">
          <button onClick={() => setActiveTab('finances')} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-950/40">
            <Wallet className="h-5 w-5 text-sky-500" />
            <p className="mt-2 text-[10px] font-black uppercase text-slate-400">Finanzas</p>
            <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{formatMoney(monthExpenses, appSettings.currency)}</p>
            <p className="mt-1 text-[10px] text-slate-500">{budgetPct === null ? 'Sin presupuesto mensual' : `${budgetPct}% del presupuesto`}</p>
          </button>

          <button onClick={() => setActiveTab('health')} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-950/40">
            <HeartPulse className="h-5 w-5 text-rose-500" />
            <p className="mt-2 text-[10px] font-black uppercase text-slate-400">Salud</p>
            <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{latestHealthLog?.spO2Pct ? `SpO₂ ${latestHealthLog.spO2Pct}%` : 'Sin biometría hoy'}</p>
            <p className="mt-1 text-[10px] text-slate-500">{workoutMinutesToday ? `${workoutMinutesToday} min entrenados` : 'Registrar o entrenar'}</p>
          </button>

          <button onClick={() => setActiveTab('library')} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-950/40">
            <BookOpen className="h-5 w-5 text-violet-500" />
            <p className="mt-2 text-[10px] font-black uppercase text-slate-400">Lectura</p>
            <p className="mt-1 truncate text-sm font-black text-slate-900 dark:text-white">{activeBook?.title || 'Sin libro activo'}</p>
            <p className="mt-1 text-[10px] text-slate-500">{activeBook ? `Página ${activeBook.currentPage}/${activeBook.totalPages}` : 'Elegir próxima lectura'}</p>
          </button>

          <button onClick={() => setActiveTab('tasks')} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-950/40">
            <ListTodo className="h-5 w-5 text-amber-500" />
            <p className="mt-2 text-[10px] font-black uppercase text-slate-400">Pendientes</p>
            <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{openTasks} abiertos</p>
            <p className="mt-1 text-[10px] text-slate-500">{plan.upcomingCount} con fecha futura</p>
          </button>
        </div>
      </details>

      <details className="group rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Herramientas secundarias</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">Turno y temporizador de foco</p>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400 transition group-open:rotate-90" />
        </summary>
        <div className="grid gap-4 border-t border-slate-200 p-4 dark:border-slate-800 sm:p-5 lg:grid-cols-2">
          <ShiftDashboardCard />
          <TimerCard />
        </div>
      </details>

      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 sm:flex sm:items-center sm:justify-between">
        {currentUser && !syncHasError && !syncIsBusy && <span className="flex items-center gap-1"><Cloud className="h-3.5 w-3.5 text-emerald-500" /> Respaldo activo</span>}
        {plan.overdueCount > 0 && <span className="flex items-center justify-end gap-1 text-rose-500"><AlertTriangle className="h-3.5 w-3.5" /> {plan.overdueCount} pendiente{plan.overdueCount === 1 ? '' : 's'} atrasado{plan.overdueCount === 1 ? '' : 's'}</span>}
        {workoutMinutesToday > 0 && <span className="hidden items-center gap-1 sm:flex"><Dumbbell className="h-3.5 w-3.5" /> Entrenamiento registrado</span>}
      </div>
    </div>
  );
};