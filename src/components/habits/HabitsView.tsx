import React, { useState, useMemo } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { Habit } from '../../types';
import {
  Flame, Plus, CheckCircle2, Award, Calendar, BarChart2,
  Trash2, Sparkles, ChevronLeft, ChevronRight, LayoutGrid, List
} from 'lucide-react';

type ViewMode = 'cards' | 'weekly' | 'monthly';

export const HabitsView: React.FC = () => {
  const {
    habits, habitLogs, logHabit, addHabit, deleteHabit, areas
  } = useLifeOS();

  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [areaId, setAreaId] = useState('area_health');
  const [targetValue, setTargetValue] = useState('1');
  const [unit, setUnit] = useState('veces');
  const [shiftContext, setShiftContext] = useState<'all' | 'rest' | 'work'>('all');
  const [habitNotifyAt, setHabitNotifyAt] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'rest' | 'work'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  const todayStr = new Date().toISOString().split('T')[0];
  const loggedToday = habitLogs.filter((l) => l.date === todayStr).map((l) => l.habitId);

  const filteredHabits = habits.filter((h) => {
    if (activeFilter === 'all') return true;
    return !h.shiftContext || h.shiftContext === 'all' || h.shiftContext === activeFilter;
  });

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addHabit({ title, description: desc, areaId, color: '#10B981', icon: 'Sparkles', frequency: 'daily', targetValue: parseFloat(targetValue) || 1, unit, shiftContext, notifyAt: habitNotifyAt || undefined });
    setTitle(''); setDesc(''); setHabitNotifyAt(''); setIsAddingHabit(false);
  };

  // Week days helpers
  const getWeekDates = (offset: number) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7) + offset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  };

  const getMonthDays = (offset: number) => {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const firstDay = new Date(target.getFullYear(), target.getMonth(), 1);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0);
    const days: (string | null)[] = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(target.getFullYear(), target.getMonth(), d).toISOString().split('T')[0]);
    }
    return days;
  };

  const weekDays = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const monthDays = useMemo(() => getMonthDays(monthOffset), [monthOffset]);
  const monthLabel = useMemo(() => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    return d.toLocaleDateString('es', { month: 'long', year: 'numeric' });
  }, [monthOffset]);

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const getHabitColor = (habitId: string, dateStr: string): string => {
    const count = habitLogs.filter(l => l.habitId === habitId && l.date === dateStr).length;
    const habit = habits.find(h => h.id === habitId);
    if (!habit || count === 0) return 'bg-slate-100 dark:bg-slate-800/40';
    const target = habit.targetValue || 1;
    if (count >= target) return 'bg-emerald-500 dark:bg-emerald-600';
    if (count >= target * 0.5) return 'bg-emerald-400 dark:bg-emerald-500';
    return 'bg-emerald-300 dark:bg-emerald-700';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-[calc(5rem+env(safe-area-inset-bottom,0px))] animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Seguimiento de Hábitos</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Rachas, mapa de calor y consistencia</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            {(['cards', 'weekly', 'monthly'] as ViewMode[]).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === mode ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {mode === 'cards' ? <><List className="w-3 h-3 inline mr-1" /> Tarjetas</>
                  : mode === 'weekly' ? <><BarChart2 className="w-3 h-3 inline mr-1" /> Semanal</>
                  : <><Calendar className="w-3 h-3 inline mr-1" /> Mensual</>}
              </button>
            ))}
          </div>
          <button onClick={() => setIsAddingHabit(!isAddingHabit)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Nuevo
          </button>
        </div>
      </div>

      {/* New Habit Form */}
      {isAddingHabit && (
        <form onSubmit={handleCreateHabit} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Configurar Nuevo Hábito</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" placeholder="Nombre del hábito" value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" required />
            <input type="text" placeholder="Descripción / Motivación" value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <select value={areaId} onChange={(e) => setAreaId(e.target.value)}
              className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
              {areas.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
            </select>
            <input type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)}
              className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
            <input type="text" placeholder="veces, ml, min" value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
            <select value={shiftContext} onChange={(e) => setShiftContext(e.target.value as any)}
              className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
              <option value="all">Siempre</option><option value="rest">Solo Descanso</option><option value="work">Solo Faena</option>
            </select>
            <input type="time" value={habitNotifyAt} onChange={(e) => setHabitNotifyAt(e.target.value)}
              className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              title="Alarma diaria (opcional)" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsAddingHabit(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">Guardar</button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['all','rest','work'] as const).map((f) => {
          const count = habits.filter(h => f === 'all' || !h.shiftContext || h.shiftContext === 'all' || h.shiftContext === f).length;
          const labels = { all: `Todos (${count})`, rest: '🌿 Descanso', work: '⛏️ Faena' };
          return (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeFilter === f
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              {labels[f]}
            </button>
          );
        })}
      </div>

      {/* VIEW: CARDS */}
      {viewMode === 'cards' && <CardsView habits={filteredHabits} habitLogs={habitLogs} todayStr={todayStr} loggedToday={loggedToday} logHabit={logHabit} deleteHabit={deleteHabit} />}

      {/* VIEW: WEEKLY HEATMAP */}
      {viewMode === 'weekly' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm font-black text-slate-900 dark:text-white">
              Semana del {new Date(weekDays[0] + 'T00:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' })} al {new Date(weekDays[6] + 'T00:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' })}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} disabled={weekOffset >= 0} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left p-2 text-slate-500 dark:text-slate-400 font-bold">Hábito</th>
                  {dayNames.map((d, i) => (
                    <th key={d} className={`p-2 text-center font-bold ${weekDays[i] === todayStr ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'}`}>
                      <div>{d}</div><div className="text-[10px]">{weekDays[i]?.slice(5)}</div>
                    </th>
                  ))}
                  <th className="p-2 text-center text-slate-500 dark:text-slate-400 font-bold">Racha</th>
                </tr>
              </thead>
              <tbody>
                {filteredHabits.map(h => (
                  <tr key={h.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="p-2 font-bold text-slate-900 dark:text-white">{h.title}</td>
                    {weekDays.map(dateStr => {
                      const done = habitLogs.some(l => l.habitId === h.id && l.date === dateStr);
                      return (
                        <td key={dateStr} className="p-1 text-center">
                          <button onClick={() => logHabit(h.id, dateStr)}
                            className={`w-7 h-7 rounded-lg text-[10px] font-bold border transition-all ${done
                              ? 'bg-emerald-500 text-white border-emerald-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                            } ${dateStr === todayStr ? 'ring-2 ring-amber-400' : ''}`}>
                            {done ? '✓' : ''}
                          </button>
                        </td>
                      );
                    })}
                    <td className="p-2 text-center">
                      <span className="text-amber-500 font-black flex items-center justify-center gap-0.5">
                        <Flame className="w-3 h-3 fill-amber-500" />{h.streak}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: MONTHLY CALENDAR */}
      {viewMode === 'monthly' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setMonthOffset(m => m - 1)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm font-black text-slate-900 dark:text-white capitalize">{monthLabel}</span>
            <button onClick={() => setMonthOffset(m => m + 1)} disabled={monthOffset >= 0} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {dayNames.map(d => <div key={d} className="text-[10px] font-bold text-slate-400 pb-2">{d}</div>)}
            {monthDays.map((dateStr, i) => (
              <div key={i} className="aspect-square">
                {dateStr && (
                  <div className={`h-full rounded-lg border p-0.5 text-[9px] ${
                    dateStr === todayStr ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30' : 'border-slate-100 dark:border-slate-800'
                  }`}>
                    <div className="font-bold text-slate-600 dark:text-slate-300">{new Date(dateStr + 'T00:00:00').getDate()}</div>
                    <div className="flex gap-0.5 mt-0.5">
                      {filteredHabits.slice(0, 4).map(h => {
                        const done = habitLogs.some(l => l.habitId === h.id && l.date === dateStr);
                        return <div key={h.id} className={`w-1.5 h-1.5 rounded-full ${done ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />;
                      })}
                      {filteredHabits.length > 4 && <div className="text-[7px] text-slate-400 leading-none">+{filteredHabits.length - 4}</div>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Card view component
const CardsView: React.FC<{
  habits: Habit[]; habitLogs: any[]; todayStr: string; loggedToday: string[];
  logHabit: (id: string, date?: string) => void; deleteHabit: (id: string) => void;
}> = ({ habits, habitLogs, todayStr, loggedToday, logHabit, deleteHabit }) => {
  const pastDays: string[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    pastDays.push(d.toISOString().split('T')[0]);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {habits.map(h => {
        const isDoneToday = loggedToday.includes(h.id);
        const logsIn28 = habitLogs.filter((l: any) => l.habitId === h.id && pastDays.includes(l.date));
        const consistencyPct = Math.round((logsIn28.length / 28) * 100);
        return (
          <div key={h.id} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <button onClick={() => logHabit(h.id)}
                  className={`p-3 rounded-2xl transition-all ${isDoneToday ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-emerald-500'}`}>
                  <CheckCircle2 className="w-6 h-6" />
                </button>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{h.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Meta: {h.targetValue} {h.unit}/día</p>
                </div>
              </div>
              <button onClick={() => deleteHabit(h.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-center">
              <div><p className="text-[10px] font-bold text-slate-400 uppercase">Racha</p>
                <p className="text-sm font-black text-amber-500 flex items-center justify-center gap-1"><Flame className="w-4 h-4 fill-amber-500" />{h.streak}d</p></div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase">Mejor</p>
                <p className="text-sm font-black text-purple-500 flex items-center justify-center gap-1"><Award className="w-4 h-4" />{h.bestStreak}d</p></div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase">Consist.</p>
                <p className="text-sm font-black text-emerald-500">{consistencyPct}%</p></div>
            </div>
            <div className="grid grid-cols-14 gap-1.5">
              {pastDays.map(dateStr => {
                const isLogged = habitLogs.some((l: any) => l.habitId === h.id && l.date === dateStr);
                return <div key={dateStr} onClick={() => logHabit(h.id, dateStr)}
                  className={`h-4 rounded cursor-pointer transition-all ${isLogged ? 'bg-emerald-500 border border-emerald-400' : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700'} ${dateStr === todayStr ? 'ring-1 ring-amber-400' : ''}`} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
