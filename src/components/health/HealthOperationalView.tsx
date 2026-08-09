import React, { useMemo, useState } from 'react';
import { Activity, Dumbbell, HeartPulse, Moon, Plus, Weight } from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';
import { differenceInDateOnlyDays, todayLocalDate } from '../../lib/dateOnly';
import { OperationalModeHeader, FullModeBackButton } from '../common/OperationalModeHeader';
import { HealthView } from './HealthView';

export const HealthOperationalView: React.FC = () => {
  const { healthProfile, healthLogs, workoutLogs, shiftInfo } = useLifeOS();
  const [fullMode, setFullMode] = useState(false);
  const today = todayLocalDate();
  const latest = [...healthLogs].sort((a, b) => b.date.localeCompare(a.date))[0];

  const weeklyWorkouts = useMemo(() => workoutLogs.filter((log) => {
    const diff = differenceInDateOnlyDays(today, log.date);
    return diff >= 0 && diff < 7;
  }), [today, workoutLogs]);

  const weeklyMinutes = weeklyWorkouts.reduce((sum, log) => sum + log.durationMinutes, 0);

  if (fullMode) {
    return (
      <div>
        <FullModeBackButton onBack={() => setFullMode(false)} label="modo operativo" />
        <HealthView />
      </div>
    );
  }

  const metric = (label: string, value: string, icon: React.ReactNode) => (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 text-slate-400">{icon}<span className="text-[10px] font-black uppercase">{label}</span></div>
      <p className="mt-2 text-xl font-black text-slate-950 dark:text-white">{value}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] animate-fade-in">
      <OperationalModeHeader
        eyebrow="Salud · modo operativo"
        title="Estado registrado y actividad"
        description={`Lectura rápida de tus últimos datos y entrenamiento durante ${shiftInfo.phase === 'work' ? 'faena' : 'descanso'}. No interpreta clínicamente los valores.`}
        icon={<HeartPulse className="h-6 w-6" />}
        onOpenFull={() => setFullMode(true)}
        action={(
          <button
            type="button"
            onClick={() => setFullMode(true)}
            className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-emerald-500 px-3.5 py-2 text-xs font-black text-slate-950"
          >
            <Plus className="h-4 w-4" /> Registrar
          </button>
        )}
      />

      <section className="rounded-3xl bg-slate-950 p-4 text-white">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Último registro</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <p className="text-lg font-black">{latest?.date || 'Sin registros'}</p>
            <p className="mt-1 text-xs text-slate-400">Peso de perfil: {healthProfile.weightKg ? `${healthProfile.weightKg} kg` : 'sin dato'}</p>
          </div>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-[10px] font-black uppercase text-emerald-300">
            {shiftInfo.phase === 'work' ? `Faena · día ${shiftInfo.dayInPhase}` : `Descanso · día ${shiftInfo.dayInPhase}`}
          </span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {metric('SpO₂', latest?.spO2Pct !== undefined ? `${latest.spO2Pct}%` : '—', <Activity className="h-4 w-4" />)}
        {metric('Pulso', latest?.heartRateBpm !== undefined ? `${latest.heartRateBpm} bpm` : '—', <HeartPulse className="h-4 w-4" />)}
        {metric('Sueño', latest?.sleepHours !== undefined ? `${latest.sleepHours} h` : '—', <Moon className="h-4 w-4" />)}
        {metric('Peso', latest?.weightKg !== undefined ? `${latest.weightKg} kg` : healthProfile.weightKg ? `${healthProfile.weightKg} kg` : '—', <Weight className="h-4 w-4" />)}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Últimos 7 días</p>
            <h2 className="mt-1 text-sm font-black text-slate-950 dark:text-white">Entrenamiento</h2>
          </div>
          <Dumbbell className="h-5 w-5 text-emerald-500" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-400">Sesiones</p>
            <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{weeklyWorkouts.length}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-400">Minutos</p>
            <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{weeklyMinutes}</p>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {weeklyWorkouts.slice(0, 4).map((workout) => (
            <div key={workout.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 px-3 py-2 dark:border-slate-800">
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-white">{workout.type}</p>
                <p className="text-[10px] text-slate-400">{workout.date}</p>
              </div>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{workout.durationMinutes} min</span>
            </div>
          ))}
          {weeklyWorkouts.length === 0 && <p className="py-4 text-center text-xs text-slate-500">Sin entrenamientos registrados en los últimos 7 días.</p>}
        </div>
      </section>
    </div>
  );
};
