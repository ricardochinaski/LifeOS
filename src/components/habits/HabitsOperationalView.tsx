import React, { useMemo, useState } from 'react';
import { CheckCircle2, Flame, Moon, Plus, Sun, Sunset } from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';
import { todayLocalDate } from '../../lib/dateOnly';
import { buildDailyPlan } from '../../lib/dailyPlan';
import { OperationalModeHeader, FullModeBackButton } from '../common/OperationalModeHeader';
import { HabitsView } from './HabitsView';

export const HabitsOperationalView: React.FC = () => {
  const { habits, habitLogs, logHabit, shiftInfo } = useLifeOS();
  const [fullMode, setFullMode] = useState(false);
  const today = todayLocalDate();

  const plan = useMemo(() => buildDailyPlan({
    tasks: [],
    habits,
    habitLogs,
    today,
    phase: shiftInfo.phase,
  }), [habits, habitLogs, shiftInfo.phase, today]);

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
    if (time === 'evening') return <Moon className="h-4 w-4 text-indigo-500" />;
    return <Flame className="h-4 w-4 text-emerald-500" />;
  };

  const completionPct = plan.dueHabits.length ? Math.round((plan.habitsCompleted / plan.dueHabits.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] animate-fade-in">
      <OperationalModeHeader
        eyebrow="Hábitos · modo operativo"
        title="Rutina de hoy"
        description={`Solo aparecen los hábitos que corresponden a este día y al contexto de ${shiftInfo.phase === 'work' ? 'faena' : 'descanso'}.`}
        icon={<Flame className="h-6 w-6" />}
        onOpenFull={() => setFullMode(true)}
        action={(
          <button
            type="button"
            onClick={() => setFullMode(true)}
            className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-emerald-500 px-3.5 py-2 text-xs font-black text-slate-950"
          >
            <Plus className="h-4 w-4" /> Nuevo hábito
          </button>
        )}
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Progreso diario</p>
            <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{plan.habitsCompleted}/{plan.dueHabits.length}</p>
          </div>
          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{completionPct}%</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${completionPct}%` }} />
        </div>
      </section>

      <section className="space-y-2">
        {plan.dueHabits.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
            <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500" />
            <h2 className="mt-3 text-sm font-black text-slate-900 dark:text-white">Sin hábitos programados hoy</h2>
            <p className="mt-1 text-xs text-slate-500">La vista completa mantiene calendario, rachas y edición.</p>
          </div>
        )}

        {plan.dueHabits.map((habit) => {
          const completed = plan.completedHabitIds.has(habit.id);
          return (
            <article key={habit.id} className={`rounded-3xl border p-4 shadow-sm ${completed ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => logHabit(habit.id)}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all ${completed ? 'border-emerald-500 bg-emerald-500 text-slate-950' : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800'}`}
                  aria-label={`${completed ? 'Desmarcar' : 'Completar'} ${habit.title}`}
                >
                  <CheckCircle2 className="h-5 w-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {iconForTime(habit.timeOfDay)}
                    <h2 className={`text-sm font-black ${completed ? 'text-emerald-800 line-through dark:text-emerald-300' : 'text-slate-950 dark:text-white'}`}>{habit.title}</h2>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Meta: {habit.targetValue} {habit.unit}{habit.streak ? ` · Racha ${habit.streak}d` : ''}</p>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
};
