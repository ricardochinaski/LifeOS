import React, { useMemo, useState } from 'react';
import { Activity, BarChart3, BrainCircuit, CalendarDays, ChevronDown, Dumbbell, Plus, RefreshCw, Timer, Trash2, Trophy, X } from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';
import { differenceInDateOnlyDays, todayLocalDate } from '../../lib/dateOnly';
import { generateWorkout } from '../../lib/api';
import type { WorkoutLog, WorkoutRoutineAI, WorkoutType } from '../../types';

type LocationContext = NonNullable<WorkoutLog['locationContext']>;
type ExerciseDraft = { id: string; name: string; sets: string; reps: string; weightKg: string; restSeconds: string; rpe: string };
type WorkoutDraft = { type: WorkoutType; duration: string; calories: string; notes: string; location: LocationContext; exercises: ExerciseDraft[] };

const labels: Record<WorkoutType, string> = { strength: 'Fuerza', cardio: 'Cardio', hiit: 'HIIT', yoga: 'Yoga', mobility: 'Movilidad', sports: 'Deporte', other: 'Otro' };
const tones: Record<WorkoutType, string> = {
  strength: 'border-amber-500/25 bg-amber-500/10 text-amber-300', cardio: 'border-sky-500/25 bg-sky-500/10 text-sky-300', hiit: 'border-rose-500/25 bg-rose-500/10 text-rose-300', yoga: 'border-purple-500/25 bg-purple-500/10 text-purple-300', mobility: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300', sports: 'border-blue-500/25 bg-blue-500/10 text-blue-300', other: 'border-slate-600 bg-slate-800 text-slate-300',
};
const exerciseDraft = (): ExerciseDraft => ({ id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: '', sets: '3', reps: '8-12', weightKg: '', restSeconds: '90', rpe: '' });
const locationFor = (phase: 'work' | 'rest'): LocationContext => phase === 'work' ? 'mine_camp' : 'rest_home';
const blankDraft = (phase: 'work' | 'rest', type: WorkoutType = 'strength'): WorkoutDraft => ({ type, duration: '45', calories: '', notes: '', location: locationFor(phase), exercises: [exerciseDraft()] });
const timeNow = () => new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
const dateLabel = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '');

export const TrainingView: React.FC = () => {
  const { workoutLogs, addWorkoutLog, deleteWorkoutLog, shiftInfo, shiftConfig, currentUser, showToast } = useLifeOS();
  const today = todayLocalDate();
  const [draft, setDraft] = useState<WorkoutDraft>(() => blankDraft(shiftInfo.phase));
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | WorkoutType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [routine, setRoutine] = useState<WorkoutRoutineAI | null>(null);
  const [routineLoading, setRoutineLoading] = useState(false);
  const [goal, setGoal] = useState('fuerza general');
  const [duration, setDuration] = useState('45');
  const [equipment, setEquipment] = useState('peso corporal, mancuernas o bandas disponibles');

  const sorted = useMemo(() => [...workoutLogs].sort((a, b) => `${b.date}T${b.time || '00:00'}`.localeCompare(`${a.date}T${a.time || '00:00'}`)), [workoutLogs]);
  const recent7 = useMemo(() => sorted.filter((log) => { const d = differenceInDateOnlyDays(today, log.date); return d >= 0 && d <= 6; }), [sorted, today]);
  const recent30 = useMemo(() => sorted.filter((log) => { const d = differenceInDateOnlyDays(today, log.date); return d >= 0 && d <= 29; }), [sorted, today]);
  const visible = filter === 'all' ? sorted : sorted.filter((log) => log.type === filter);
  const minutes7 = recent7.reduce((sum, log) => sum + log.durationMinutes, 0);
  const minutes30 = recent30.reduce((sum, log) => sum + log.durationMinutes, 0);
  const sets30 = recent30.reduce((sum, log) => sum + log.exercises.reduce((total, exercise) => total + (exercise.sets || 0), 0), 0);
  const todayMinutes = sorted.filter((log) => log.date === today).reduce((sum, log) => sum + log.durationMinutes, 0);
  const longest30 = recent30.reduce((max, log) => Math.max(max, log.durationMinutes), 0);

  const openLog = (type: WorkoutType = 'strength') => {
    setDraft(blankDraft(shiftInfo.phase, type));
    setError('');
    setIsLogOpen(true);
  };

  const updateExercise = (id: string, patch: Partial<ExerciseDraft>) => setDraft((current) => ({ ...current, exercises: current.exercises.map((exercise) => exercise.id === id ? { ...exercise, ...patch } : exercise) }));

  const saveWorkout = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const durationMinutes = Number(draft.duration);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return setError('Ingresa una duración válida mayor que 0 minutos.');
    const exercises = draft.exercises.filter((exercise) => exercise.name.trim()).map((exercise) => ({
      name: exercise.name.trim(),
      sets: Math.max(1, Number(exercise.sets) || 1),
      reps: exercise.reps.trim() || '—',
      weightKg: exercise.weightKg ? Number(exercise.weightKg) : undefined,
      restSeconds: exercise.restSeconds ? Number(exercise.restSeconds) : undefined,
      rpe: exercise.rpe ? Number(exercise.rpe) : undefined,
    }));
    if (exercises.some((exercise) => exercise.rpe !== undefined && (exercise.rpe < 1 || exercise.rpe > 10))) return setError('El RPE debe estar entre 1 y 10.');
    addWorkoutLog({ date: today, time: timeNow(), type: draft.type, durationMinutes, caloriesBurned: draft.calories ? Number(draft.calories) : undefined, locationContext: draft.location, notes: draft.notes.trim() || undefined, exercises });
    setIsLogOpen(false);
    showToast(`${labels[draft.type]} · ${durationMinutes} min registrado.`);
  };

  const buildRoutine = async () => {
    setRoutineLoading(true);
    try {
      const generated = await generateWorkout({
        focusGoal: goal.trim() || 'general',
        durationMinutes: Math.max(10, Number(duration) || 45),
        equipment: equipment.trim() || 'no informado',
        shiftInfo: { phase: shiftInfo.phase, dayInPhase: shiftInfo.dayInPhase, workDays: shiftConfig.workDays, restDays: shiftConfig.restDays },
      });
      setRoutine(generated as WorkoutRoutineAI);
    } catch (err) {
      console.error(err);
      showToast('No fue posible generar la rutina.');
    } finally {
      setRoutineLoading(false);
    }
  };

  const useRoutine = () => {
    if (!routine) return;
    setDraft({
      type: 'strength', duration: String(routine.durationMinutes || Number(duration) || 45), calories: '', notes: `Rutina: ${routine.title}`, location: locationFor(shiftInfo.phase),
      exercises: routine.exercises.map((exercise) => ({ id: `routine-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: exercise.name, sets: String(exercise.sets), reps: exercise.reps, weightKg: '', restSeconds: String(exercise.restSeconds || 90), rpe: '' })),
    });
    setError('');
    setIsLogOpen(true);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-3 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] animate-fade-in">
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
        <div className="flex items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400"><Dumbbell className="h-6 w-6" /></div><div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-400">Entrenamientos · {shiftInfo.phase === 'work' ? 'Faena' : 'Descanso'}</p><h1 className="text-xl font-black text-white">Entrenar, registrar y progresar</h1><p className="mt-0.5 hidden text-[11px] text-slate-400 sm:block">Sesiones, ejercicios, carga, historial y planificación en una sola pantalla.</p></div><button type="button" onClick={() => openLog()} className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-slate-950"><Plus className="h-4 w-4" /> Registrar</button></div>
      </section>

      <section className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        {[
          [CalendarDays, 'Sesiones · 7 días', recent7.length, 'text-emerald-400'],
          [Timer, 'Minutos · 7 días', minutes7, 'text-sky-400'],
          [Activity, 'Minutos · 30 días', minutes30, 'text-amber-400'],
          [BarChart3, 'Series · 30 días', sets30, 'text-purple-400'],
          [Trophy, 'Sesión más larga', `${longest30} min`, 'text-rose-400'],
        ].map(([Icon, label, value, tone], index) => {
          const MetricIcon = Icon as React.FC<{ className?: string }>;
          return <div key={String(label)} className={`rounded-2xl border border-slate-800 bg-slate-900 p-3 ${index === 4 ? 'col-span-2 lg:col-span-1' : ''}`}><MetricIcon className={`h-4 w-4 ${tone}`} /><p className="mt-2 text-[9px] font-black uppercase text-slate-500">{String(label)}</p><p className="mt-1 text-2xl font-black text-white">{String(value)}</p></div>;
        })}
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center justify-between gap-2"><div><p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Hoy</p><h2 className="text-base font-black text-white">Estado de entrenamiento</h2></div><span className={`rounded-full px-3 py-1 text-[10px] font-black ${todayMinutes ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>{todayMinutes ? `${todayMinutes} min registrados` : 'Sin sesión hoy'}</span></div>
          <div className="mt-3 grid grid-cols-3 gap-2">{(['strength', 'cardio', 'mobility'] as WorkoutType[]).map((type) => <button key={type} type="button" onClick={() => openLog(type)} className={`rounded-xl border p-3 text-left ${tones[type]}`}><p className="text-[9px] font-black uppercase opacity-70">Inicio rápido</p><p className="mt-1 text-xs font-black">{labels[type]}</p></button>)}</div>
          <p className="mt-3 text-[11px] leading-5 text-slate-500">Faena/Descanso se guarda como contexto de la sesión. LifeOS no necesita biometría para registrar o analizar tus entrenamientos.</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-purple-400" /><div><p className="text-[9px] font-black uppercase tracking-widest text-purple-400">Planificador</p><h2 className="text-base font-black text-white">Rutina con IA</h2></div></div>
          <div className="mt-3 grid grid-cols-2 gap-2"><input value={goal} onChange={(e) => setGoal(e.target.value)} className="col-span-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white" placeholder="Objetivo" /><input value={duration} onChange={(e) => setDuration(e.target.value)} inputMode="numeric" className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white" placeholder="Minutos" /><input value={equipment} onChange={(e) => setEquipment(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white" placeholder="Equipamiento" /></div>
          <button type="button" onClick={buildRoutine} disabled={routineLoading || !currentUser} className="mt-2 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-xl bg-purple-500 px-3 py-2 text-xs font-black text-white disabled:opacity-40">{routineLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />} {currentUser ? 'Generar rutina' : 'Inicia sesión para usar IA'}</button>
          {routine && <div className="mt-3 rounded-xl border border-purple-500/20 bg-purple-500/5 p-3"><p className="text-sm font-black text-white">{routine.title}</p><p className="mt-1 text-[11px] leading-5 text-slate-400">{routine.summary}</p><div className="mt-2 space-y-1">{routine.exercises.slice(0, 6).map((exercise) => <p key={exercise.name} className="text-[11px] text-slate-300"><strong>{exercise.name}</strong> · {exercise.sets} × {exercise.reps}</p>)}</div><button type="button" onClick={useRoutine} className="mt-3 rounded-lg bg-emerald-500 px-3 py-2 text-[10px] font-black text-slate-950">Usar como sesión</button></div>}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Historial</p><h2 className="text-base font-black text-white">Entrenamientos · {visible.length}</h2></div><div className="no-scrollbar flex gap-1.5 overflow-x-auto"><button type="button" onClick={() => setFilter('all')} className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-black ${filter === 'all' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>Todos</button>{(Object.keys(labels) as WorkoutType[]).map((type) => <button key={type} type="button" onClick={() => setFilter(type)} className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-black ${filter === type ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>{labels[type]}</button>)}</div></div>
        <div className="mt-3 space-y-2">{visible.map((log) => { const expanded = expandedId === log.id; return <article key={log.id} className="rounded-xl border border-slate-800 bg-slate-950/40"><button type="button" onClick={() => setExpandedId(expanded ? null : log.id)} className="flex w-full items-center gap-3 p-3 text-left"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${tones[log.type]}`}><Dumbbell className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="text-xs font-black text-white">{labels[log.type]} · {log.durationMinutes} min</p><p className="mt-0.5 truncate text-[10px] text-slate-500">{dateLabel(log.date)}{log.time ? ` · ${log.time}` : ''} · {log.locationContext === 'mine_camp' ? 'Faena' : log.locationContext === 'transit' ? 'Tránsito' : 'Descanso'}{log.exercises.length ? ` · ${log.exercises.length} ejercicios` : ''}</p></div><ChevronDown className={`h-4 w-4 text-slate-500 transition ${expanded ? 'rotate-180' : ''}`} /></button>{expanded && <div className="border-t border-slate-800 px-3 pb-3 pt-2">{log.exercises.length ? <div className="space-y-1.5">{log.exercises.map((exercise, index) => <div key={`${exercise.name}-${index}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-slate-900 px-2.5 py-2 text-[10px]"><strong className="text-white">{exercise.name}</strong><span className="text-slate-400">{exercise.sets} series · {exercise.reps}</span>{exercise.weightKg !== undefined && <span className="text-amber-300">{exercise.weightKg} kg</span>}{exercise.rpe !== undefined && <span className="text-purple-300">RPE {exercise.rpe}</span>}{exercise.restSeconds !== undefined && <span className="text-slate-500">desc. {exercise.restSeconds}s</span>}</div>)}</div> : <p className="text-[11px] text-slate-500">Sesión sin detalle de ejercicios.</p>}{log.notes && <p className="mt-2 text-[11px] text-slate-400">{log.notes}</p>}<div className="mt-2 flex justify-end"><button type="button" onClick={() => { if (window.confirm(`¿Eliminar entrenamiento del ${dateLabel(log.date)}?`)) deleteWorkoutLog(log.id); }} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-900 bg-rose-950/30 px-2.5 py-1.5 text-[10px] font-black text-rose-300"><Trash2 className="h-3.5 w-3.5" /> Eliminar</button></div></div>}</article>; })}{visible.length === 0 && <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center"><Dumbbell className="mx-auto h-7 w-7 text-slate-600" /><p className="mt-2 text-sm font-black text-white">Sin entrenamientos en esta vista</p><p className="mt-1 text-xs text-slate-500">Registra tu primera sesión.</p></div>}</div>
      </section>

      {isLogOpen && <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/80 backdrop-blur-sm sm:items-center sm:p-4"><form onSubmit={saveWorkout} className="max-h-[94dvh] w-full max-w-3xl overflow-y-auto rounded-t-[2rem] border border-slate-700 bg-slate-900 p-4 text-white shadow-2xl sm:rounded-[2rem] sm:p-5"><div className="flex items-center justify-between border-b border-slate-800 pb-3"><div><p className="text-[9px] font-black uppercase tracking-widest text-amber-400">Registro</p><h2 className="text-base font-black">Entrenamiento</h2></div><button type="button" onClick={() => setIsLogOpen(false)} className="rounded-xl p-2 text-slate-400"><X className="h-5 w-5" /></button></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><label className="text-[10px] font-bold text-slate-400">Tipo<select value={draft.type} onChange={(e) => setDraft((current) => ({ ...current, type: e.target.value as WorkoutType }))} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs text-white">{(Object.keys(labels) as WorkoutType[]).map((type) => <option key={type} value={type}>{labels[type]}</option>)}</select></label><label className="text-[10px] font-bold text-slate-400">Duración<input type="number" min="1" value={draft.duration} onChange={(e) => setDraft((current) => ({ ...current, duration: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs text-white" /></label><label className="text-[10px] font-bold text-slate-400">Calorías opc.<input type="number" min="0" value={draft.calories} onChange={(e) => setDraft((current) => ({ ...current, calories: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs text-white" /></label><label className="text-[10px] font-bold text-slate-400">Contexto<select value={draft.location} onChange={(e) => setDraft((current) => ({ ...current, location: e.target.value as LocationContext }))} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs text-white"><option value="mine_camp">Faena</option><option value="rest_home">Casa / descanso</option><option value="transit">Tránsito</option></select></label></div><div className="mt-4 flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Ejercicios</p><p className="text-xs text-slate-400">Series, reps, carga, descanso y RPE.</p></div><button type="button" onClick={() => setDraft((current) => ({ ...current, exercises: [...current.exercises, exerciseDraft()] }))} className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-[10px] font-black text-emerald-300">+ Ejercicio</button></div><div className="mt-2 space-y-2">{draft.exercises.map((exercise, index) => <div key={exercise.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3"><div className="flex items-center gap-2"><input value={exercise.name} onChange={(e) => updateExercise(exercise.id, { name: e.target.value })} placeholder={`Ejercicio ${index + 1}`} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white" />{draft.exercises.length > 1 && <button type="button" onClick={() => setDraft((current) => ({ ...current, exercises: current.exercises.filter((item) => item.id !== exercise.id) }))} className="rounded-lg p-2 text-rose-400"><Trash2 className="h-4 w-4" /></button>}</div><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5"><input value={exercise.sets} onChange={(e) => updateExercise(exercise.id, { sets: e.target.value })} placeholder="Series" className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-[11px] text-white" /><input value={exercise.reps} onChange={(e) => updateExercise(exercise.id, { reps: e.target.value })} placeholder="Reps" className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-[11px] text-white" /><input value={exercise.weightKg} onChange={(e) => updateExercise(exercise.id, { weightKg: e.target.value })} placeholder="kg" className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-[11px] text-white" /><input value={exercise.restSeconds} onChange={(e) => updateExercise(exercise.id, { restSeconds: e.target.value })} placeholder="Descanso s" className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-[11px] text-white" /><input value={exercise.rpe} onChange={(e) => updateExercise(exercise.id, { rpe: e.target.value })} placeholder="RPE 1-10" className="col-span-2 rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-[11px] text-white sm:col-span-1" /></div></div>)}</div><textarea value={draft.notes} onChange={(e) => setDraft((current) => ({ ...current, notes: e.target.value }))} rows={2} placeholder="Notas opcionales" className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-xs text-white" />{error && <p className="mt-3 rounded-xl border border-rose-900 bg-rose-950/30 p-3 text-xs font-bold text-rose-300">{error}</p>}<div className="mt-4 flex justify-end gap-2 border-t border-slate-800 pt-3"><button type="button" onClick={() => setIsLogOpen(false)} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-400">Cancelar</button><button type="submit" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-black text-slate-950">Guardar entrenamiento</button></div></form></div>}
    </div>
  );
};