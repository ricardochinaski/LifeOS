import React, { useMemo, useState } from 'react';
import { CheckCircle2, Flame, Moon, Plus, SlidersHorizontal, Sun, Sunset } from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';
import { todayLocalDate } from '../../lib/dateOnly';
import { buildDailyPlan } from '../../lib/dailyPlan';
import { FullModeBackButton } from '../common/OperationalModeHeader';
import { HabitsView } from './HabitsView';

const DAILY_HABIT_LIMIT = 6;

export const HabitsOperationalView: React.FC = () => {
  const { habits, habitLogs, logHabit, shiftInfo } = useLifeOS();
  const [fullMode, setFullMode] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const today = todayLocalDate();

  const plan = useMemo(() => buildDailyPlan({
    tasks: [],
    habits,
    habitLogs,
    today,
    phase: shiftInfo.phase,
  }), [habits, habitLogs, shiftInfo.phase, today]);

  const orderedHabits = useMemo(() => [...plan.dueHabits].sort((a, b) => {
    const aDone = plan.completedHabitIds.has(a.id) ? 1 : 0;
    const bDone = plan.completedHabitIds.has(b.id) ? 1 : 0;
    return aDone - bDone;
  }), [plan.dueHabits, plan.completedHabitIds]);

  const displayedHabits = showAll ? orderedHabits : orderedHabits.slice(0, DAILY_HABIT_LIMIT);
  const remainingCount = Math.max(0, orderedHabits.length - displayedHabits.length);
  const completionPct = plan.dueHabits.length ? Math.round((plan.habitsCompleted / plan.dueHabits.length) * 100) : 0;
  const pendingCount = Math.max(0, plan.dueHabits.length - plan.habitsCompleted);

  if (fullMode) {
    return (
      <div>
        <FullModeBackButton onBack={() => setFullMode(false)} label="modo operativo" />
        <HabitsView />
      </div>
    );
  }

  const iconForTime = (time?: string) => {
    if (time === 'morning') return <Sun className="h-4 w-4 text-amber-500" />;
    if (time === 'afternoon') return <Sunset className="h-4 w-4 text-orange-500" />;
    if (time === 'evening') return <Moon className="h-4 w-4 text-indigo-400" />;
    return <Flame className="h-4 w-4 text-emerald-500" />;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-3 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] animate-fade-in">
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-emerald-400 dark:bg-slate-800"><Flame className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-500">Hábitos · {shiftInfo.phase === 'work' ? 'Faena' : 'Descanso'}</p>
            <div className="flex items-baseline gap-2">
              <h1 className="text-lg font-black text-slate-950 dark:text-white">Rutina de hoy</h1>
              <span className="text-xs font-black text-slate-400">{plan.habitsCompleted}/{plan.dueHabits.length}</span>
            </div>
          </div>
          <button type="button" onClick={() => setFullMode(true)} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-[11px] font-black text-slate-950"><Plus className="h-3.5 w-3.5" /><span className="hidden sm:inline">Nuevo hábito</span><span className="sm:hidden">Nuevo</span></button>
          <button type="button" onClick={() => setFullMode(true)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300" aria-label="Vista completa"><SlidersHorizontal className="h-4 w-4" /></button>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${completionPct}%` }} /></div>
          <span className="shrink-0 text-[10px] font-black text-emerald-500">{completionPct}%</span>
          <span className="hidden shrink-0 text-[10px] font-bold text-slate-400 sm:inline">{pendingCount ? `${pendingCount} pendientes` : 'Rutina completada'}</span>
        </div>
      </section>

      <section className="space-y-2">
        {plan.dueHabits.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
            <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500" />
            <h2 className="mt-2 text-sm font-black text-slate-900 dark:text-white">Sin hábitos programados hoy</h2>
            <p className="mt-1 text-xs text-slate-500">La vista completa mantiene calendario, rachas y edición.</p>
          </div>
        )}

        {displayedHabits.map((habit) => {
          const completed = plan.completedHabitIds.has(habit.id);
          return (
            <article key={habit.id} className={`rounded-2xl border px-3 py-2.5 shadow-sm ${completed ? 'border-emerald-800/60 bg-emerald-950/20' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => logHabit(habit.id)} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all ${completed ? 'border-emerald-500 bg-emerald-500 text-slate-950' : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800'}`} aria-label={`${completed ? 'Desmarcar' : 'Completar'} ${habit.title}`}><CheckCircle2 className="h-4 w-4" /></button>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    {iconForTime(habit.timeOfDay)}
                    <h2 className={`truncate text-sm font-black ${completed ? 'text-emerald-700 line-through dark:text-emerald-300' : 'text-slate-950 dark:text-white'}`} title={habit.title}>{habit.title}</h2>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">{habit.targetValue} {habit.unit}{habit.streak ? ` · racha ${habit.streak}d` : ''}</p>
                </div>
                <span className="shrink-0 text-[10px] font-bold text-slate-500">{completed ? 'Hecho' : 'Pendiente'}</span>
              </div>
            </article>
          );
        })}

        {remainingCount > 0 && <button type="button" onClick={() => setShowAll(true)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">Ver {remainingCount} hábitos restantes</button>}
        {showAll && orderedHabits.length > DAILY_HABIT_LIMIT && <button type="button" onClick={() => setShowAll(false)} className="w-full px-4 py-2 text-xs font-bold text-slate-400">Mostrar solo los primeros</button>}
      </section>
    </div>
  );
};
