import { formatLocalDate, todayLocalDate } from '../../lib/dateOnly';
import React, { useState, useMemo } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import {
  ChevronLeft, ChevronRight, Calendar, CheckSquare, Flame,
  HeartPulse, Briefcase, Wallet, Filter, X, List, Grid
} from 'lucide-react';

type CalendarFilter = 'tasks' | 'habits' | 'health' | 'shift' | 'finances';

export const CalendarView: React.FC = () => {
  const { tasks, habits, habitLogs, healthLogs, transactions, shiftConfig, shiftInfo } = useLifeOS();

  const todayStr = todayLocalDate();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<CalendarFilter>>(new Set(['tasks', 'habits', 'health', 'shift']));
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
  const today = new Date(todayStr);

  const days: (string | null)[] = [];
  for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(formatLocalDate(new Date(year, month, d)));
  }

  const monthLabel = target.toLocaleDateString('es', { month: 'long', year: 'numeric' });
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
    healthLogs.forEach(l => {
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
    const anchor = new Date(shiftConfig.anchorDate);
    const date = new Date(dateStr);
    const diffDays = Math.round((date.getTime() - anchor.getTime()) / 86400000);
    const cycleLen = shiftConfig.workDays + shiftConfig.restDays;
    const dayInCycle = ((diffDays % cycleLen) + cycleLen) % cycleLen;
    if (dayInCycle < shiftConfig.workDays) return 'work';
    return 'rest';
  };

  const getDayIndicator = (dateStr: string) => {
    const indicators: { type: CalendarFilter; color: string }[] = [];

    if (activeFilters.has('tasks') && tasksByDate.has(dateStr)) {
      indicators.push({ type: 'tasks', color: 'bg-blue-500' });
    }
    if (activeFilters.has('habits') && habitsByDate.has(dateStr)) {
      indicators.push({ type: 'habits', color: 'bg-orange-500' });
    }
    if (activeFilters.has('health') && healthByDate.has(dateStr)) {
      indicators.push({ type: 'health', color: 'bg-rose-500' });
    }
    if (activeFilters.has('shift')) {
      const shift = isShiftWorkDay(dateStr);
      if (shift === 'work') indicators.push({ type: 'shift', color: 'bg-amber-500' });
      else if (shift === 'rest') indicators.push({ type: 'shift', color: 'bg-emerald-500' });
    }
    if (activeFilters.has('finances') && financesByDate.has(dateStr)) {
      indicators.push({ type: 'finances', color: 'bg-purple-500' });
    }

    return indicators.slice(0, 4);
  };

  const selectedDayData = selectedDay ? {
    date: selectedDay,
    tasks: tasksByDate.get(selectedDay) || [],
    habits: habitsByDate.get(selectedDay) || [],
    health: healthByDate.get(selectedDay) || 0,
    finances: financesByDate.get(selectedDay),
    shift: isShiftWorkDay(selectedDay),
  } : null;

  const filterOptions: { key: CalendarFilter; label: string; icon: React.FC<{ className?: string }>; color: string }[] = [
    { key: 'tasks', label: 'Tareas', icon: CheckSquare, color: 'bg-blue-500' },
    { key: 'habits', label: 'Hábitos', icon: Flame, color: 'bg-orange-500' },
    { key: 'health', label: 'Salud', icon: HeartPulse, color: 'bg-rose-500' },
    { key: 'shift', label: 'Turno', icon: Briefcase, color: 'bg-amber-500' },
    { key: 'finances', label: 'Finanzas', icon: Wallet, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-4 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400">Calendario</span>
            <h1 className="text-2xl font-black tracking-tight">Vista Mensual</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <Filter className="w-4 h-4 text-slate-400 mr-1" />
        {filterOptions.map(f => {
          const Icon = f.icon;
          const isActive = activeFilters.has(f.key);
          return (
            <button
              key={f.key}
              onClick={() => toggleFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? `${f.color} text-white shadow-sm`
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Calendar Grid */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Month Nav */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setMonthOffset(m => m - 1)}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-black text-slate-900 dark:text-white capitalize">{monthLabel}</h2>
          <button
            onClick={() => setMonthOffset(m => m + 1)}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
          {dayNames.map(d => (
            <div key={d} className="p-2 text-center text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7">
          {days.map((dateStr, idx) => {
            if (!dateStr) {
              return <div key={`empty-${idx}`} className="min-h-[70px] sm:min-h-[85px] bg-slate-50/50 dark:bg-slate-950/20" />;
            }
            const indicators = getDayIndicator(dateStr);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDay;
            const isCurrentMonth = dateStr.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`);
            const dayNum = parseInt(dateStr.split('-')[2], 10);

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                className={`min-h-[70px] sm:min-h-[85px] p-1.5 flex flex-col items-center justify-start gap-1 transition-all relative cursor-pointer ${
                  isSelected
                    ? 'bg-blue-500/10 dark:bg-blue-500/20 ring-2 ring-blue-500/50 z-10'
                    : isToday
                      ? 'bg-amber-50 dark:bg-amber-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                } ${!isCurrentMonth ? 'opacity-30' : ''}`}
              >
                <span className={`text-xs font-bold leading-none mt-1 ${
                  isToday ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {dayNum}
                </span>
                <div className="flex flex-wrap justify-center gap-0.5 mt-auto mb-1">
                  {indicators.map((ind, i) => (
                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${ind.color} shadow-sm`} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Detail Panel */}
      {selectedDayData && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {new Date(selectedDayData.date + 'T12:00:00').toLocaleDateString('es', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                })}
              </h3>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedDayData.shift && (
              <div className={`p-3 rounded-2xl flex items-center gap-3 ${
                selectedDayData.shift === 'work'
                  ? 'bg-amber-500/10 border border-amber-500/30'
                  : 'bg-emerald-500/10 border border-emerald-500/30'
              }`}>
                <div className={`p-2 rounded-xl ${
                  selectedDayData.shift === 'work' ? 'bg-amber-500/20' : 'bg-emerald-500/20'
                }`}>
                  <Briefcase className={`w-5 h-5 ${
                    selectedDayData.shift === 'work' ? 'text-amber-500' : 'text-emerald-500'
                  }`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Turno</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white capitalize">
                    {selectedDayData.shift === 'work' ? '⛏️ Faena Minera' : '🏠 Descanso'}
                  </p>
                </div>
              </div>
            )}

            {activeFilters.has('tasks') && (
              <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckSquare className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Tareas ({selectedDayData.tasks.length})
                  </span>
                </div>
                {selectedDayData.tasks.length > 0 ? (
                  <ul className="space-y-1">
                    {selectedDayData.tasks.map((t, i) => (
                      <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-blue-500" />
                        {t}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400">Sin tareas</p>
                )}
              </div>
            )}

            {activeFilters.has('habits') && (
              <div className="p-3 rounded-2xl bg-orange-500/5 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Hábitos ({selectedDayData.habits.length})
                  </span>
                </div>
                {selectedDayData.habits.length > 0 ? (
                  <ul className="space-y-1">
                    {selectedDayData.habits.map((h, i) => (
                      <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-orange-500" />
                        {h}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400">Sin hábitos</p>
                )}
              </div>
            )}

            {activeFilters.has('health') && (
              <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <HeartPulse className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Salud ({selectedDayData.health} registros)
                  </span>
                </div>
                {selectedDayData.health > 0 ? (
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {selectedDayData.health} registro(s) biométrico(s)
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">Sin registros</p>
                )}
              </div>
            )}

            {activeFilters.has('finances') && selectedDayData.finances && (
              <div className="p-3 rounded-2xl bg-purple-500/5 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Finanzas</span>
                </div>
                {selectedDayData.finances.expense > 0 && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    Gastos: ${selectedDayData.finances.expense.toLocaleString('es-CL')}
                  </p>
                )}
                {selectedDayData.finances.income > 0 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    Ingresos: ${selectedDayData.finances.income.toLocaleString('es-CL')}
                  </p>
                )}
                {selectedDayData.finances.expuse === 0 && selectedDayData.finances.income === 0 && (
                  <p className="text-xs text-slate-400">Sin movimiento</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">Leyenda</p>
        <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Tareas</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Hábitos</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Salud</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Faena</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Descanso</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Finanzas</span>
        </div>
      </div>
    </div>
  );
};
