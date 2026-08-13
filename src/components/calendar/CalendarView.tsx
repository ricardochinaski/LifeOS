import { formatLocalDate, todayLocalDate } from '../../lib/dateOnly';
import { isDemoHealthLog } from '../../lib/demoData';
import { calculateShiftInfo } from '../../utils/shiftUtils';
import React, { useState, useMemo } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import {
  ChevronLeft, ChevronRight, Calendar, CheckSquare, Flame,
  HeartPulse, Briefcase, Wallet, X, List, Grid
} from 'lucide-react';

type CalendarFilter = 'tasks' | 'habits' | 'health' | 'shift' | 'finances';

export const CalendarView: React.FC = () => {
  const { tasks, habits, habitLogs, healthLogs, transactions, shiftConfig } = useLifeOS();

  const todayStr = todayLocalDate();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<CalendarFilter>>(new Set(['shift']));
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const toggleFilter = (f: CalendarFilter) => {
    const next = new Set(activeFilters);
    if (next.has(f)) next.delete(f); else next.add(f);
    setActiveFilters(next);
  };

  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = target.getFullYear();
  const month = target.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const days: (string | null)[] = [];
  for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(formatLocalDate(new Date(year, month, d)));
  }
  const monthDates = days.filter((date): date is string => Boolean(date));

  const rawMonthLabel = target.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  const monthLabel = rawMonthLabel.charAt(0).toUpperCase() + rawMonthLabel.slice(1);
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const tasksByDate = useMemo(() => {
    const map = new Map<string, string[]>();
    tasks.filter(t => t.dueDate).forEach(t => {
      const arr = map.get(t.dueDate!) || [];
      arr.push(t.title);
      map.set(t.dueDate!, arr);
    });
    return map;
  }, [tasks]);

  const habitsByDate = useMemo(() => {
    const map = new Map<string, string[]>();
    habitLogs.forEach(l => {
      const habit = habits.find(h => h.id === l.habitId);
      if (habit) {
        const arr = map.get(l.date) || [];
        arr.push(habit.title);
        map.set(l.date, arr);
      }
    });
    return map;
  }, [habitLogs, habits]);

  const healthByDate = useMemo(() => {
    const map = new Map<string, number>();
    healthLogs.filter((log) => !isDemoHealthLog(log)).forEach(l => {
      map.set(l.date, (map.get(l.date) || 0) + 1);
    });
    return map;
  }, [healthLogs]);

  const financesByDate = useMemo(() => {
    const map = new Map<string, { expense: number; income: number }>();
    transactions.forEach(t => {
      const entry = map.get(t.date) || { expense: 0, income: 0 };
      if (t.type === 'expense') entry.expense += t.amount;
      else if (t.type === 'income') entry.income += t.amount;
      map.set(t.date, entry);
    });
    return map;
  }, [transactions]);

  const isShiftWorkDay = (dateStr: string) => {
    if (!shiftConfig.enabled) return null;
    return calculateShiftInfo(shiftConfig, dateStr).phase;
  };

  const getDayIndicator = (dateStr: string) => {
    const indicators: { type: CalendarFilter; color: string }[] = [];

    if (activeFilters.has('tasks') && tasksByDate.has(dateStr)) indicators.push({ type: 'tasks', color: 'bg-blue-500' });
    if (activeFilters.has('habits') && habitsByDate.has(dateStr)) indicators.push({ type: 'habits', color: 'bg-orange-500' });
    if (activeFilters.has('health') && healthByDate.has(dateStr)) indicators.push({ type: 'health', color: 'bg-rose-500' });
    if (activeFilters.has('shift')) {
      const shift = isShiftWorkDay(dateStr);
      if (shift === 'work') indicators.push({ type: 'shift', color: 'bg-amber-500' });
      else if (shift === 'rest') indicators.push({ type: 'shift', color: 'bg-emerald-500' });
    }
    if (activeFilters.has('finances') && financesByDate.has(dateStr)) indicators.push({ type: 'finances', color: 'bg-purple-500' });

    return indicators.slice(0, 4);
  };

  const getSelectedDayData = (dateStr: string) => ({
    date: dateStr,
    tasks: tasksByDate.get(dateStr) || [],
    habits: habitsByDate.get(dateStr) || [],
    health: healthByDate.get(dateStr) || 0,
    finances: financesByDate.get(dateStr),
    shift: isShiftWorkDay(dateStr),
  });

  const selectedDayData = selectedDay ? getSelectedDayData(selectedDay) : null;

  const filterOptions: { key: CalendarFilter; label: string; icon: React.FC<{ className?: string }>; color: string }[] = [
    { key: 'shift', label: 'Turno', icon: Briefcase, color: 'bg-amber-500' },
    { key: 'tasks', label: 'Tareas', icon: CheckSquare, color: 'bg-blue-500' },
    { key: 'habits', label: 'Hábitos', icon: Flame, color: 'bg-orange-500' },
    { key: 'health', label: 'Salud', icon: HeartPulse, color: 'bg-rose-500' },
    { key: 'finances', label: 'Finanzas', icon: Wallet, color: 'bg-purple-500' },
  ];

  const renderDayDetails = (data: ReturnType<typeof getSelectedDayData>, compact = false) => (
    <div className={`${compact ? 'mt-2' : 'space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900'} animate-fade-in`}>
      {!compact && (
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {new Date(data.date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
          </div>
          <button onClick={() => setSelectedDay(null)} className="rounded-lg p-1.5 text-slate-400"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className={`grid grid-cols-1 gap-2 ${compact ? '' : 'sm:grid-cols-2'}`}>
        {data.shift && (
          <div className={`flex items-center gap-3 rounded-xl border p-2.5 ${data.shift === 'work' ? 'border-amber-500/30 bg-amber-500/10' : 'border-emerald-500/30 bg-emerald-500/10'}`}>
            <Briefcase className={`h-4 w-4 ${data.shift === 'work' ? 'text-amber-500' : 'text-emerald-500'}`} />
            <div><p className="text-[9px] font-bold text-slate-500">Turno</p><p className="text-xs font-black text-slate-900 dark:text-white">{data.shift === 'work' ? 'Faena' : 'Descanso'}</p></div>
          </div>
        )}

        {activeFilters.has('tasks') && (
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-2.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Tareas ({data.tasks.length})</span>
            {data.tasks.length > 0 ? <ul className="mt-1 space-y-1">{data.tasks.slice(0, 4).map((t, i) => <li key={i} className="truncate text-[11px] text-slate-700 dark:text-slate-300">• {t}</li>)}</ul> : <p className="mt-1 text-[11px] text-slate-400">Sin tareas</p>}
          </div>
        )}

        {activeFilters.has('habits') && (
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-2.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Hábitos ({data.habits.length})</span>
            {data.habits.length > 0 ? <ul className="mt-1 space-y-1">{data.habits.slice(0, 4).map((h, i) => <li key={i} className="truncate text-[11px] text-slate-700 dark:text-slate-300">• {h}</li>)}</ul> : <p className="mt-1 text-[11px] text-slate-400">Sin hábitos</p>}
          </div>
        )}

        {activeFilters.has('health') && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-2.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Salud · {data.health} registros reales</span>
          </div>
        )}

        {activeFilters.has('finances') && data.finances && (
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-2.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Finanzas</span>
            {data.finances.expense > 0 && <p className="mt-1 text-[11px] text-rose-400">Gastos: ${data.finances.expense.toLocaleString('es-CL')}</p>}
            {data.finances.income > 0 && <p className="text-[11px] text-emerald-400">Ingresos: ${data.finances.income.toLocaleString('es-CL')}</p>}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-3 pb-12 animate-fade-in">
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-3 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-2 text-white"><Calendar className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">Calendario</p>
            <h1 className="text-lg font-black">Calendario operativo</h1>
          </div>
          <div className="flex rounded-xl bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex min-h-8 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-black ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              aria-label="Vista de mes"
            >
              <Grid className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Mes</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex min-h-8 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-black ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              aria-label="Vista vertical"
            >
              <List className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Lista</span>
            </button>
          </div>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {filterOptions.map(f => {
            const Icon = f.icon;
            const isActive = activeFilters.has(f.key);
            return (
              <button
                key={f.key}
                onClick={() => toggleFilter(f.key)}
                className={`flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold transition-all ${
                  isActive ? `${f.color} text-white` : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {f.label}
              </button>
            );
          })}
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 p-3 dark:border-slate-800">
          <button onClick={() => { setSelectedDay(null); setMonthOffset(m => m - 1); }} className="rounded-xl p-2 text-slate-600 dark:text-slate-400"><ChevronLeft className="h-5 w-5" /></button>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">{monthLabel}</h2>
          <button onClick={() => { setSelectedDay(null); setMonthOffset(m => m + 1); }} className="rounded-xl p-2 text-slate-600 dark:text-slate-400"><ChevronRight className="h-5 w-5" /></button>
        </div>

        {viewMode === 'grid' ? (
          <>
            <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
              {dayNames.map(d => (
                <div key={d} className="p-2 text-center text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {days.map((dateStr, idx) => {
                if (!dateStr) return <div key={`empty-${idx}`} className="min-h-[62px] bg-slate-50/50 dark:bg-slate-950/20 sm:min-h-[80px]" />;
                const indicators = getDayIndicator(dateStr);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDay;
                const dayNum = parseInt(dateStr.split('-')[2], 10);

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                    className={`relative flex min-h-[62px] flex-col items-center justify-start gap-1 p-1.5 transition-all sm:min-h-[80px] ${
                      isSelected ? 'z-10 bg-blue-500/10 ring-2 ring-blue-500/50 dark:bg-blue-500/20' : isToday ? 'bg-amber-50 dark:bg-amber-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span className={`mt-1 text-xs font-bold leading-none ${isToday ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>{dayNum}</span>
                    <div className="mt-auto mb-1 flex flex-wrap justify-center gap-0.5">
                      {indicators.map((ind, i) => <span key={i} className={`h-1.5 w-1.5 rounded-full ${ind.color}`} />)}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {monthDates.map((dateStr) => {
              const data = getSelectedDayData(dateStr);
              const date = new Date(`${dateStr}T12:00:00`);
              const weekday = date.toLocaleDateString('es-CL', { weekday: 'short' }).replace('.', '');
              const day = date.getDate();
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDay;
              const indicators = getDayIndicator(dateStr);
              const eventCount =
                (activeFilters.has('tasks') ? data.tasks.length : 0) +
                (activeFilters.has('habits') ? data.habits.length : 0) +
                (activeFilters.has('health') ? data.health : 0) +
                (activeFilters.has('finances') && data.finances ? 1 : 0);

              return (
                <React.Fragment key={dateStr}>
                  <button
                    type="button"
                    onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${isToday ? 'bg-amber-500/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                  >
                    <div className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border ${isToday ? 'border-amber-500/40 bg-amber-500/10 text-amber-500' : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                      <span className="text-[9px] font-black uppercase leading-none">{weekday}</span>
                      <span className="mt-1 text-sm font-black leading-none">{day}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {data.shift && activeFilters.has('shift') && (
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${data.shift === 'work' ? 'bg-amber-500/15 text-amber-500' : 'bg-emerald-500/15 text-emerald-500'}`}>{data.shift === 'work' ? 'Faena' : 'Descanso'}</span>
                        )}
                        {eventCount > 0 && <span className="text-[10px] font-bold text-slate-500">{eventCount} registros</span>}
                        {eventCount === 0 && !activeFilters.has('shift') && <span className="text-[10px] text-slate-400">Sin registros visibles</span>}
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        {indicators.map((ind, i) => <span key={i} className={`h-1.5 w-4 rounded-full ${ind.color}`} />)}
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                  </button>
                  {isSelected && <div className="bg-slate-50 px-3 pb-3 dark:bg-slate-950/30">{renderDayDetails(data, true)}</div>}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {viewMode === 'grid' && selectedDayData && renderDayDetails(selectedDayData)}
    </div>
  );
};
