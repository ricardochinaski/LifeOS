import React, { useState, useMemo } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { Habit, HabitLog } from '../../types';
import {
  Flame, Plus, CheckCircle2, Award, Calendar, BarChart2,
  Trash2, Sparkles, ChevronLeft, ChevronRight, LayoutGrid, List,
  Edit2, X, Sun, Sunset, Moon, MessageSquare, Save, ExternalLink
} from 'lucide-react';

type ViewMode = 'cards' | 'weekly' | 'monthly';
type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export const HabitsView: React.FC = () => {
  const {
    habits, habitLogs, logHabit, addHabit, updateHabit, updateHabitLog, deleteHabit, areas
  } = useLifeOS();

  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [areaId, setAreaId] = useState('area_health');
  const [targetValue, setTargetValue] = useState('1');
  const [unit, setUnit] = useState('veces');
  const [shiftContext, setShiftContext] = useState<'all' | 'rest' | 'work'>('all');
  const [habitNotifyAt, setHabitNotifyAt] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay | ''>('');
  const [activeDays, setActiveDays] = useState<number[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'rest' | 'work'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [logNotes, setLogNotes] = useState<Record<string, string>>({});
  const [loggingHabitId, setLoggingHabitId] = useState<string | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editLogNotes, setEditLogNotes] = useState('');
  const [editLogDate, setEditLogDate] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredHabits = habits.filter((h) => {
    if (activeFilter === 'all') return true;
    return !h.shiftContext || h.shiftContext === 'all' || h.shiftContext === activeFilter;
  });

  const openNewHabit = () => {
    setEditingHabit(null);
    setTitle(''); setDesc(''); setAreaId('area_health'); setTargetValue('1');
    setUnit('veces'); setShiftContext('all'); setHabitNotifyAt(''); setTimeOfDay(''); setActiveDays([]);
    setIsAddingHabit(true);
  };

  const openEditHabit = (h: Habit) => {
    setEditingHabit(h);
    setTitle(h.title); setDesc(h.description || ''); setAreaId(h.areaId);
    setTargetValue(h.targetValue.toString()); setUnit(h.unit);
    setShiftContext(h.shiftContext || 'all'); setHabitNotifyAt(h.notifyAt || '');
    setTimeOfDay(h.timeOfDay || '');
    setActiveDays(h.activeDays || []);
    setIsAddingHabit(true);
  };

  const handleSaveHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const data = { title, description: desc, areaId, color: '#10B981', icon: 'Sparkles',
      frequency: 'daily' as const, targetValue: parseFloat(targetValue) || 1, unit,
      shiftContext, notifyAt: habitNotifyAt || undefined, timeOfDay: timeOfDay || undefined, activeDays };
    if (editingHabit) {
      updateHabit({ ...editingHabit, ...data });
    } else {
      addHabit(data);
    }
    setTitle(''); setDesc(''); setHabitNotifyAt(''); setIsAddingHabit(false); setEditingHabit(null);
  };

  const handleLogWithNotes = (habitId: string) => {
    const notes = logNotes[habitId] || '';
    logHabit(habitId, undefined, 1, notes);
    setLogNotes((prev) => ({ ...prev, [habitId]: '' }));
    setLoggingHabitId(null);
  };

  const openLogNotes = (habitId: string) => {
    const existingLog = habitLogs.find(l => l.habitId === habitId && l.date === todayStr);
    if (existingLog) {
      logHabit(habitId);
    } else {
      setLoggingHabitId(habitId);
    }
  };

  const openEditLog = (log: HabitLog) => {
    setEditingLogId(log.id);
    setEditLogNotes(log.notes || '');
    setEditLogDate(log.date);
  };

  const confirmEditLog = () => {
    if (!editingLogId) return;
    const log = habitLogs.find(l => l.id === editingLogId);
    if (!log) return;
    if (editLogDate !== log.date) {
      logHabit(log.habitId, log.date);
      logHabit(log.habitId, editLogDate, log.value, editLogNotes || undefined);
    } else {
      updateHabitLog(editingLogId, { notes: editLogNotes || undefined });
    }
    setEditingLogId(null);
  };

  // Week / Month helpers
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
    for (let i = 0; i < (firstDay.getDay() || 7) - 1; i++) days.push(null);
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
    if (!habit || count === 0) return 'bg-slate-800/40';
    const target = habit.targetValue || 1;
    if (count >= target) return 'bg-emerald-600';
    if (count >= target * 0.5) return 'bg-emerald-500';
    return 'bg-emerald-700';
  };

  const timeOfDayIcon = (t?: string) => {
    switch (t) {
      case 'morning': return <Sun className="w-3 h-3 text-amber-400" />;
      case 'afternoon': return <Sunset className="w-3 h-3 text-orange-400" />;
      case 'evening': return <Moon className="w-3 h-3 text-indigo-400" />;
      default: return null;
    }
  };

  const timeOfDayLabel = (t?: string) => {
    switch (t) {
      case 'morning': return 'Mañana';
      case 'afternoon': return 'Tarde';
      case 'evening': return 'Noche';
      default: return '';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-[calc(5rem+env(safe-area-inset-bottom,0px))] animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Seguimiento de Hábitos</h1>
            <p className="text-xs text-slate-400">Rachas, mapa de calor y consistencia</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 rounded-xl p-1">
            {(['cards', 'weekly', 'monthly'] as ViewMode[]).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === mode ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400'
                }`}
              >
                {mode === 'cards' ? <><List className="w-3 h-3 inline mr-1" /> Tarjetas</>
                  : mode === 'weekly' ? <><BarChart2 className="w-3 h-3 inline mr-1" /> Semanal</>
                  : <><Calendar className="w-3 h-3 inline mr-1" /> Mensual</>}
              </button>
            ))}
          </div>
          <button onClick={openNewHabit}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-4 h-4" /> Nuevo
          </button>
        </div>
      </div>

      {/* New / Edit Habit Form */}
      {isAddingHabit && (
        <form onSubmit={handleSaveHabit} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              {editingHabit ? `Editar: ${editingHabit.title}` : 'Configurar Nuevo Hábito'}
            </h3>
            <button type="button" onClick={() => { setIsAddingHabit(false); setEditingHabit(null); }}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" placeholder="Nombre del hábito" value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="p-2.5 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white" required />
            <input type="text" placeholder="Descripción / Motivación" value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="p-2.5 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <select value={areaId} onChange={(e) => setAreaId(e.target.value)}
              className="w-full p-2 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white">
              {areas.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
            </select>
            <div className="flex gap-1">
              <input type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white" />
              <input type="text" placeholder="veces" value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-20 p-2 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white" />
            </div>
            <select value={shiftContext} onChange={(e) => setShiftContext(e.target.value as any)}
              className="w-full p-2 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white">
              <option value="all">Siempre</option><option value="rest">Solo Descanso</option><option value="work">Solo Faena</option>
            </select>
            <select value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay | '')}
              className="w-full p-2 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white">
              <option value="">Cualquier momento</option>
              <option value="morning">🌅 Mañana</option>
              <option value="afternoon">☀️ Tarde</option>
              <option value="evening">🌙 Noche</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input type="time" value={habitNotifyAt} onChange={(e) => setHabitNotifyAt(e.target.value)}
              className="p-2 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white"
              title="Alarma diaria (opcional)" />
            <span className="text-[10px] text-slate-400">Alarma diaria (opcional)</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Días activos <span className="normal-case font-medium">(vacío = todos)</span></p>
            <div className="mt-2 flex flex-wrap gap-2">
              {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((label, day) => <button type="button" key={label} onClick={() => setActiveDays(current => current.includes(day) ? current.filter(value => value !== day) : [...current, day])} className={`h-8 w-8 rounded-full text-[11px] font-black ${activeDays.includes(day) ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>{label}</button>)}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setIsAddingHabit(false); setEditingHabit(null); }}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 cursor-pointer">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer">
              {editingHabit ? 'Guardar Cambios' : 'Guardar'}
            </button>
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeFilter === f
                ? 'bg-white text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-400'}`}>
              {labels[f]}
            </button>
          );
        })}
      </div>

      {/* VIEW: CARDS */}
      {viewMode === 'cards' && (
        <CardsView
          habits={filteredHabits}
          habitLogs={habitLogs}
          todayStr={todayStr}
          logHabit={logHabit}
          openLogNotes={openLogNotes}
          loggingHabitId={loggingHabitId}
          logNotes={logNotes}
          setLogNotes={setLogNotes}
          handleLogWithNotes={handleLogWithNotes}
          setLoggingHabitId={setLoggingHabitId}
          openEditHabit={openEditHabit}
          openEditLog={openEditLog}
          editingLogId={editingLogId}
          editLogNotes={editLogNotes}
          setEditLogNotes={setEditLogNotes}
          editLogDate={editLogDate}
          setEditLogDate={setEditLogDate}
          confirmEditLog={confirmEditLog}
          setEditingLogId={setEditingLogId}
          showDeleteConfirm={showDeleteConfirm}
          setShowDeleteConfirm={setShowDeleteConfirm}
          deleteHabit={deleteHabit}
          timeOfDayIcon={timeOfDayIcon}
          timeOfDayLabel={timeOfDayLabel}
          openNewHabit={openNewHabit}
        />
      )}

      {/* VIEW: WEEKLY HEATMAP */}
      {viewMode === 'weekly' && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 rounded-xl bg-slate-800 text-slate-300 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm font-black text-white">
              Semana del {new Date(weekDays[0] + 'T00:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' })} al {new Date(weekDays[6] + 'T00:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' })}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} disabled={weekOffset >= 0} className="p-2 rounded-xl bg-slate-800 text-slate-300 disabled:opacity-30 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left p-2 text-slate-400 font-bold">Hábito</th>
                  {dayNames.map((d, i) => (
                    <th key={d} className={`p-2 text-center font-bold ${weekDays[i] === todayStr ? 'text-amber-500' : 'text-slate-400'}`}>
                      <div>{d}</div><div className="text-[10px]">{weekDays[i]?.slice(5)}</div>
                    </th>
                  ))}
                  <th className="p-2 text-center text-slate-400 font-bold">Racha</th>
                </tr>
              </thead>
              <tbody>
                {filteredHabits.map(h => (
                  <tr key={h.id} className="border-t border-slate-800">
                    <td className="p-2 font-bold text-white flex items-center gap-1">
                      {timeOfDayIcon(h.timeOfDay)} {h.title}
                    </td>
                    {weekDays.map(dateStr => {
                      const done = habitLogs.some(l => l.habitId === h.id && l.date === dateStr);
                      return (
                        <td key={dateStr} className="p-1 text-center">
                          <button onClick={() => logHabit(h.id, dateStr)}
                            className={`w-7 h-7 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${done
                              ? 'bg-emerald-600 text-white border-emerald-400'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
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
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setMonthOffset(m => m - 1)} className="p-2 rounded-xl bg-slate-800 text-slate-300 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm font-black text-white capitalize">{monthLabel}</span>
            <button onClick={() => setMonthOffset(m => m + 1)} disabled={monthOffset >= 0} className="p-2 rounded-xl bg-slate-800 text-slate-300 disabled:opacity-30 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {dayNames.map(d => <div key={d} className="text-[10px] font-bold text-slate-400 pb-2">{d}</div>)}
            {monthDays.map((dateStr, i) => (
              <div key={i} className="aspect-square">
                {dateStr && (
                  <div className={`h-full rounded-lg border p-0.5 text-[9px] ${
                    dateStr === todayStr ? 'border-amber-400 bg-amber-950/30' : 'border-slate-800'
                  }`}>
                    <div className="font-bold text-slate-300">{new Date(dateStr + 'T00:00:00').getDate()}</div>
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                      {filteredHabits.slice(0, 4).map(h => {
                        const done = habitLogs.some(l => l.habitId === h.id && l.date === dateStr);
                        return <div key={h.id} className={`w-1.5 h-1.5 rounded-full ${done ? 'bg-emerald-500' : 'bg-slate-700'}`} />;
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

      {/* Log Notes Modal */}
      {loggingHabitId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setLoggingHabitId(null)}>
          <div className="w-full max-w-sm p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Agregar nota (opcional)</h3>
              <button onClick={() => setLoggingHabitId(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <textarea
              value={logNotes[loggingHabitId] || ''}
              onChange={(e) => setLogNotes((prev) => ({ ...prev, [loggingHabitId!]: e.target.value }))}
              placeholder="Ej: Hice 30 min de cardio, me sentí bien..."
              className="w-full p-3 text-xs rounded-2xl border border-slate-700 bg-slate-800 text-white resize-none h-24"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => { handleLogWithNotes(loggingHabitId); }} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer">
                <CheckCircle2 className="w-4 h-4 inline mr-1" />Completar Hábito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Log Modal */}
      {editingLogId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditingLogId(null)}>
          <div className="w-full max-w-sm p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Editar Registro</h3>
              <button onClick={() => setEditingLogId(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Fecha</label>
              <input type="date" value={editLogDate} onChange={(e) => setEditLogDate(e.target.value)}
                className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Notas</label>
              <textarea value={editLogNotes} onChange={(e) => setEditLogNotes(e.target.value)}
                className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white resize-none h-20" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingLogId(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer">Cancelar</button>
              <button onClick={confirmEditLog} className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs cursor-pointer">
                <Save className="w-4 h-4 inline mr-1" />Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(null)}>
          <div className="w-full max-w-sm p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-bold text-white">¿Eliminar este hábito? También se borrarán todos sus registros.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer">Cancelar</button>
              <button onClick={() => { deleteHabit(showDeleteConfirm); setShowDeleteConfirm(null); }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Card view component
const CardsView: React.FC<{
  habits: Habit[]; habitLogs: HabitLog[]; todayStr: string;
  logHabit: (id: string, date?: string, value?: number) => void;
  openLogNotes: (habitId: string) => void;
  loggingHabitId: string | null;
  logNotes: Record<string, string>;
  setLogNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleLogWithNotes: (habitId: string) => void;
  setLoggingHabitId: React.Dispatch<React.SetStateAction<string | null>>;
  openEditHabit: (h: Habit) => void;
  openEditLog: (log: HabitLog) => void;
  editingLogId: string | null;
  editLogNotes: string;
  setEditLogNotes: (v: string) => void;
  editLogDate: string;
  setEditLogDate: (v: string) => void;
  confirmEditLog: () => void;
  setEditingLogId: React.Dispatch<React.SetStateAction<string | null>>;
  showDeleteConfirm: string | null;
  setShowDeleteConfirm: React.Dispatch<React.SetStateAction<string | null>>;
  deleteHabit: (id: string) => void;
  timeOfDayIcon: (t?: string) => React.ReactNode;
  timeOfDayLabel: (t?: string) => string;
  openNewHabit: () => void;
}> = ({
  habits, habitLogs, todayStr, logHabit, openLogNotes,
  openEditHabit, openEditLog, showDeleteConfirm, setShowDeleteConfirm,
  deleteHabit, timeOfDayIcon, timeOfDayLabel, openNewHabit
}) => {
  const past30: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    past30.push(d.toISOString().split('T')[0]);
  }

  const loggedTodaySet = new Set(habitLogs.filter(l => l.date === todayStr).map(l => l.habitId));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {habits.map(h => {
        const isDoneToday = loggedTodaySet.has(h.id);
        const logsIn30 = habitLogs.filter(l => l.habitId === h.id && past30.includes(l.date));
        const consistencyPct = Math.round((logsIn30.length / 30) * 100);
        const logsByDate = new Set(logsIn30.map(l => l.date));

        return (
          <div key={h.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <button onClick={() => openLogNotes(h.id)}
                  className={`p-3 rounded-2xl transition-all cursor-pointer ${isDoneToday ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-emerald-500'}`}>
                  <CheckCircle2 className="w-6 h-6" />
                </button>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white">{h.title}</h3>
                    {timeOfDayIcon(h.timeOfDay)}
                    {h.timeOfDay && <span className="text-[10px] text-slate-400">({timeOfDayLabel(h.timeOfDay)})</span>}
                  </div>
                  <p className="text-xs text-slate-400">Meta: {h.targetValue} {h.unit}/día</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEditHabit(h)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 cursor-pointer">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => setShowDeleteConfirm(h.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-800 cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mini 30-day Trend Chart */}
            <div className="flex gap-0.5 items-end h-8">
              {past30.map(dateStr => {
                const done = logsByDate.has(dateStr);
                const isToday = dateStr === todayStr;
                return (
                  <div key={dateStr}
                    title={`${dateStr}: ${done ? '✓' : '—'}`}
                    className={`flex-1 rounded-sm transition-all cursor-pointer ${
                      done ? 'bg-emerald-500' : 'bg-slate-800'
                    } ${isToday ? 'ring-1 ring-amber-400' : ''}`}
                    style={{ height: done ? '100%' : '30%' }}
                    onClick={() => logHabit(h.id, dateStr)}
                  />
                );
              })}
            </div>

            <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl bg-slate-800/60 text-center">
              <div><p className="text-[10px] font-bold text-slate-400 uppercase">Racha</p>
                <p className="text-sm font-black text-amber-500 flex items-center justify-center gap-1"><Flame className="w-4 h-4 fill-amber-500" />{h.streak}d</p></div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase">Mejor</p>
                <p className="text-sm font-black text-purple-500 flex items-center justify-center gap-1"><Award className="w-4 h-4" />{h.bestStreak}d</p></div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase">Consist.</p>
                <p className="text-sm font-black text-emerald-500">{consistencyPct}%</p></div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase">Regs.</p>
                <p className="text-sm font-black text-sky-400">{logsIn30.length}/30</p></div>
            </div>

            {/* Log entries with edit */}
            <div className="space-y-1 max-h-28 overflow-y-auto">
              {habitLogs.filter(l => l.habitId === h.id).slice(0, 10).map(log => (
                <div key={log.id} className="flex items-center justify-between px-2 py-1 rounded-lg bg-slate-800/40 text-xs">
                  <span className="text-slate-400">{log.date}</span>
                  <div className="flex items-center gap-2">
                    {log.notes && <span className="text-slate-500 italic truncate max-w-[120px]">"{log.notes}"</span>}
                    <button onClick={() => openEditLog(log)} className="text-slate-500 hover:text-sky-400 cursor-pointer">
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {habits.length === 0 && (
        <div className="lifeos-ux-empty col-span-full rounded-3xl p-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Flame className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Sin hábitos en esta vista</h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
            Agrega uno pequeño y medible. La consistencia se construye mejor con objetivos fáciles de marcar.
          </p>
          <button
            onClick={openNewHabit}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4" />
            Crear hábito
          </button>
        </div>
      )}
    </div>
  );
};
