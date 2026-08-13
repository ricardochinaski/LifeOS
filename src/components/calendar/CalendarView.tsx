import React, { useMemo, useState } from 'react';
import {
  Briefcase,
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  Grid,
  List,
  Wallet,
} from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';
import { formatLocalDate, todayLocalDate } from '../../lib/dateOnly';
import { calculateShiftInfo } from '../../utils/shiftUtils';
import type { WorkoutType } from '../../types';

type CalendarFilter = 'tasks' | 'habits' | 'training' | 'shift' | 'finances';

type FinanceDay = { expense: number; income: number };

const workoutLabel = (type: WorkoutType) => ({
  strength: 'Fuerza', cardio: 'Cardio', hiit: 'HIIT', yoga: 'Yoga', mobility: 'Movilidad', sports: 'Deporte', other: 'Otro',
}[type]);

export const CalendarView: React.FC = () => {
  const { tasks, habits, habitLogs, workoutLogs, transactions, shiftConfig } = useLifeOS();
  const today = todayLocalDate();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeFilters, setActiveFilters] = useState<Set<CalendarFilter>>(new Set(['shift']));

  const target = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  }, [monthOffset]);
  const year = target.getFullYear();
  const month = target.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leadingEmpty = firstDay.getDay();
  const monthDates = useMemo(
    () => Array.from({ length: lastDay.getDate() }, (_, index) => formatLocalDate(new Date(year, month, index + 1))),
    [year, month, lastDay],
  );
  const gridDates: (string | null)[] = [...Array.from({ length: leadingEmpty }, () => null), ...monthDates];
  const monthLabelRaw = target.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  const monthLabel = monthLabelRaw.charAt(0).toUpperCase() + monthLabelRaw.slice(1);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, string[]>();
    tasks.filter((task) => task.dueDate).forEach((task) => {
      const current = map.get(task.dueDate!) || [];
      current.push(task.title);
      map.set(task.dueDate!, current);
    });
    return map;
  }, [tasks]);

  const habitsByDate = useMemo(() => {
    const map = new Map<string, string[]>();
    habitLogs.forEach((log) => {
      const habit = habits.find((item) => item.id === log.habitId);
      if (!habit) return;
      const current = map.get(log.date) || [];
      current.push(habit.title);
      map.set(log.date, current);
    });
    return map;
  }, [habitLogs, habits]);

  const trainingByDate = useMemo(() => {
    const map = new Map<string, typeof workoutLogs>();
    workoutLogs.forEach((workout) => {
      const current = map.get(workout.date) || [];
      current.push(workout);
      map.set(workout.date, current);
    });
    return map;
  }, [workoutLogs]);

  const financesByDate = useMemo(() => {
    const map = new Map<string, FinanceDay>();
    transactions.forEach((transaction) => {
      const current = map.get(transaction.date) || { expense: 0, income: 0 };
      if (transaction.type === 'expense') current.expense += transaction.amount;
      if (transaction.type === 'income') current.income += transaction.amount;
      map.set(transaction.date, current);
    });
    return map;
  }, [transactions]);

  const shiftFor = (date: string) => shiftConfig.enabled ? calculateShiftInfo(shiftConfig, date) : null;

  const toggleFilter = (filter: CalendarFilter) => {
    setActiveFilters((current) => {
      const next = new Set(current);
      if (next.has(filter)) next.delete(filter); else next.add(filter);
      return next;
    });
  };

  const dataFor = (date: string) => ({
    date,
    shift: shiftFor(date),
    tasks: tasksByDate.get(date) || [],
    habits: habitsByDate.get(date) || [],
    training: trainingByDate.get(date) || [],
    finances: financesByDate.get(date),
  });

  const indicatorsFor = (date: string) => {
    const indicators: string[] = [];
    const shift = shiftFor(date);
    if (activeFilters.has('shift') && shift) indicators.push(shift.phase === 'work' ? 'bg-amber-500' : 'bg-emerald-500');
    if (activeFilters.has('tasks') && tasksByDate.has(date)) indicators.push('bg-blue-500');
    if (activeFilters.has('habits') && habitsByDate.has(date)) indicators.push('bg-orange-500');
    if (activeFilters.has('training') && trainingByDate.has(date)) indicators.push('bg-sky-400');
    if (activeFilters.has('finances') && financesByDate.has(date)) indicators.push('bg-purple-500');
    return indicators.slice(0, 5);
  };

  const visibleCount = (date: string) => {
    let count = 0;
    if (activeFilters.has('tasks')) count += tasksByDate.get(date)?.length || 0;
    if (activeFilters.has('habits')) count += habitsByDate.get(date)?.length || 0;
    if (activeFilters.has('training')) count += trainingByDate.get(date)?.length || 0;
    if (activeFilters.has('finances') && financesByDate.has(date)) count += 1;
    return count;
  };

  const filterOptions = [
    { key: 'shift' as const, label: 'Turno', icon: Briefcase, active: 'bg-amber-500' },
    { key: 'tasks' as const, label: 'Tareas', icon: CheckSquare, active: 'bg-blue-500' },
    { key: 'habits' as const, label: 'Hábitos', icon: Flame, active: 'bg-orange-500' },
    { key: 'training' as const, label: 'Entrenos', icon: Dumbbell, active: 'bg-sky-500' },
    { key: 'finances' as const, label: 'Finanzas', icon: Wallet, active: 'bg-purple-500' },
  ];

  const details = (date: string, compact = false) => {
    const data = dataFor(date);
    return (
      <div className={`${compact ? 'mt-2' : 'rounded-2xl border border-slate-800 bg-slate-900 p-3'} space-y-2`}>
        {data.shift && activeFilters.has('shift') && (
          <div className={`flex items-center justify-between rounded-xl border px-3 py-2 ${data.shift.phase === 'work' ? 'border-amber-500/25 bg-amber-500/10' : 'border-emerald-500/25 bg-emerald-500/10'}`}>
            <span className="text-[10px] font-black uppercase text-slate-400">Turno</span>
            <span className={`text-xs font-black ${data.shift.phase === 'work' ? 'text-amber-300' : 'text-emerald-300'}`}>{data.shift.phase === 'work' ? 'Faena' : 'Descanso'} · día {data.shift.dayInPhase}/{data.shift.totalPhaseDays}</span>
          </div>
        )}
        {activeFilters.has('training') && (
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-2.5">
            <div className="flex items-center justify-between"><span className="text-[10px] font-black text-sky-300">Entrenamientos</span><span className="text-[10px] text-slate-500">{data.training.length}</span></div>
            {data.training.length > 0 ? data.training.map((workout) => (
              <p key={workout.id} className="mt-1 text-[11px] text-slate-300">• {workoutLabel(workout.type)} · {workout.durationMinutes} min{workout.exercises.length ? ` · ${workout.exercises.length} ejercicios` : ''}</p>
            )) : <p className="mt-1 text-[11px] text-slate-500">Sin entrenamiento registrado</p>}
          </div>
        )}
        {activeFilters.has('tasks') && (
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-2.5">
            <span className="text-[10px] font-black text-blue-300">Tareas · {data.tasks.length}</span>
            {data.tasks.slice(0, 5).map((task) => <p key={task} className="mt-1 truncate text-[11px] text-slate-300">• {task}</p>)}
          </div>
        )}
        {activeFilters.has('habits') && (
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-2.5">
            <span className="text-[10px] font-black text-orange-300">Hábitos · {data.habits.length}</span>
            {data.habits.slice(0, 5).map((habit) => <p key={habit} className="mt-1 truncate text-[11px] text-slate-300">• {habit}</p>)}
          </div>
        )}
        {activeFilters.has('finances') && data.finances && (
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-2.5">
            <span className="text-[10px] font-black text-purple-300">Finanzas</span>
            {data.finances.expense > 0 && <p className="mt-1 text-[11px] text-rose-300">Gastos ${data.finances.expense.toLocaleString('es-CL')}</p>}
            {data.finances.income > 0 && <p className="text-[11px] text-emerald-300">Ingresos ${data.finances.income.toLocaleString('es-CL')}</p>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3 pb-12 animate-fade-in">
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-3 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-2"><Calendar className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-widest text-blue-400">Calendario</p><h1 className="text-lg font-black">Calendario operativo</h1></div>
          <div className="flex rounded-xl bg-slate-800 p-1">
            <button type="button" onClick={() => setViewMode('grid')} className={`inline-flex min-h-8 items-center gap-1 rounded-lg px-2.5 text-[10px] font-black ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}><Grid className="h-3.5 w-3.5" /><span className="hidden sm:inline">Mes</span></button>
            <button type="button" onClick={() => setViewMode('list')} className={`inline-flex min-h-8 items-center gap-1 rounded-lg px-2.5 text-[10px] font-black ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}><List className="h-3.5 w-3.5" /><span className="hidden sm:inline">Lista</span></button>
          </div>
        </div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {filterOptions.map((filter) => {
            const Icon = filter.icon;
            const active = activeFilters.has(filter.key);
            return <button key={filter.key} type="button" onClick={() => toggleFilter(filter.key)} className={`flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold ${active ? `${filter.active} text-white` : 'bg-slate-800 text-slate-400'}`}><Icon className="h-3.5 w-3.5" />{filter.label}</button>;
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 p-3">
          <button type="button" onClick={() => { setSelectedDay(null); setMonthOffset((value) => value - 1); }} className="rounded-xl p-2 text-slate-400"><ChevronLeft className="h-5 w-5" /></button>
          <h2 className="text-lg font-black text-white">{monthLabel}</h2>
          <button type="button" onClick={() => { setSelectedDay(null); setMonthOffset((value) => value + 1); }} className="rounded-xl p-2 text-slate-400"><ChevronRight className="h-5 w-5" /></button>
        </div>

        {viewMode === 'grid' ? (
          <>
            <div className="grid grid-cols-7 border-b border-slate-800">{['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map((name) => <div key={name} className="p-2 text-center text-[9px] font-black uppercase text-slate-500">{name}</div>)}</div>
            <div className="grid grid-cols-7">
              {gridDates.map((date, index) => {
                if (!date) return <div key={`empty-${index}`} className="min-h-[62px] bg-slate-950/20 sm:min-h-[78px]" />;
                const selected = date === selectedDay;
                const current = date === today;
                return (
                  <button key={date} type="button" onClick={() => setSelectedDay(selected ? null : date)} className={`relative flex min-h-[62px] flex-col items-center p-1.5 sm:min-h-[78px] ${selected ? 'bg-blue-500/15 ring-1 ring-inset ring-blue-500/50' : current ? 'bg-amber-500/10' : 'hover:bg-slate-800/50'}`}>
                    <span className={`mt-1 text-xs font-black ${current ? 'text-amber-300' : 'text-slate-300'}`}>{Number(date.slice(-2))}</span>
                    <div className="mt-auto mb-1 flex flex-wrap justify-center gap-1">{indicatorsFor(date).map((color, dot) => <span key={`${date}-${dot}`} className={`h-1.5 w-1.5 rounded-full ${color}`} />)}</div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="divide-y divide-slate-800">
            {monthDates.map((date) => {
              const data = dataFor(date);
              const expanded = selectedDay === date;
              const current = date === today;
              const count = visibleCount(date);
              return (
                <article key={date} className={current ? 'bg-amber-500/5' : ''}>
                  <button type="button" onClick={() => setSelectedDay(expanded ? null : date)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
                    <div className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl ${current ? 'bg-amber-500/15 text-amber-300' : 'bg-slate-800 text-slate-300'}`}><span className="text-sm font-black leading-none">{Number(date.slice(-2))}</span><span className="mt-0.5 text-[8px] uppercase">{new Date(`${date}T12:00:00`).toLocaleDateString('es-CL',{weekday:'short'}).replace('.','')}</span></div>
                    <div className="min-w-0 flex-1"><p className="text-xs font-black text-white">{data.shift ? `${data.shift.phase === 'work' ? 'Faena' : 'Descanso'} · día ${data.shift.dayInPhase}` : 'Sin turno'}</p><div className="mt-1 flex items-center gap-1">{indicatorsFor(date).map((color, dot) => <span key={`${date}-list-${dot}`} className={`h-1.5 w-1.5 rounded-full ${color}`} />)}{count > 0 && <span className="ml-1 text-[9px] text-slate-500">{count} registros visibles</span>}</div></div>
                    <ChevronDown className={`h-4 w-4 text-slate-500 transition ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                  {expanded && <div className="px-3 pb-3">{details(date, true)}</div>}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {viewMode === 'grid' && selectedDay && details(selectedDay)}
    </div>
  );
};