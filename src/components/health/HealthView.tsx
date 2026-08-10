import React, { useMemo, useState } from 'react';
import {
  Activity,
  Dumbbell,
  Edit3,
  Flame,
  Footprints,
  HeartPulse,
  Moon,
  PhoneCall,
  Plus,
  Trash2,
  Weight,
  X,
} from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';
import { todayLocalDate } from '../../lib/dateOnly';
import {
  formatMeasuredNumber,
  latestHealthLogWith,
  parseOptionalNumber,
  sortHealthLogsNewestFirst,
} from '../../lib/healthSafety';
import type { HealthLog, WorkoutType } from '../../types';
import { GoogleFitSyncModal } from '../integrations/GoogleFitSyncModal';

type SleepQuality = NonNullable<HealthLog['sleepQuality']>;
type LocationContext = NonNullable<HealthLog['locationContext']>;

type ProfileDraft = {
  bloodType: string;
  heightCm: string;
  weightKg: string;
  altitude: string;
  emergencyName: string;
  emergencyKinship: string;
  emergencyPhone: string;
  insuranceProvider: string;
};

type HealthLogDraft = {
  spO2: string;
  heartRate: string;
  systolic: string;
  diastolic: string;
  weight: string;
  sleepHours: string;
  sleepQuality: '' | SleepQuality;
  steps: string;
  calories: string;
  energy: string;
  location: LocationContext;
  symptoms: string;
  notes: string;
};

type WorkoutDraft = {
  type: WorkoutType;
  duration: string;
  calories: string;
  exerciseName: string;
  sets: string;
  reps: string;
  weightKg: string;
  notes: string;
  location: LocationContext;
};

const emptyProfileDraft = (): ProfileDraft => ({
  bloodType: '',
  heightCm: '',
  weightKg: '',
  altitude: '',
  emergencyName: '',
  emergencyKinship: '',
  emergencyPhone: '',
  insuranceProvider: '',
});

const emptyHealthLogDraft = (location: LocationContext): HealthLogDraft => ({
  spO2: '',
  heartRate: '',
  systolic: '',
  diastolic: '',
  weight: '',
  sleepHours: '',
  sleepQuality: '',
  steps: '',
  calories: '',
  energy: '',
  location,
  symptoms: '',
  notes: '',
});

const emptyWorkoutDraft = (location: LocationContext): WorkoutDraft => ({
  type: 'strength',
  duration: '',
  calories: '',
  exerciseName: '',
  sets: '',
  reps: '',
  weightKg: '',
  notes: '',
  location,
});

const workoutLabel = (type: WorkoutType) => {
  switch (type) {
    case 'strength': return 'Fuerza';
    case 'cardio': return 'Cardio';
    case 'hiit': return 'HIIT';
    case 'yoga': return 'Yoga';
    case 'mobility': return 'Movilidad';
    case 'sports': return 'Deportes';
    default: return 'Otro';
  }
};

const positiveOrUndefined = (value: number) => value > 0 && Number.isFinite(value) ? value : undefined;

export const HealthView: React.FC = () => {
  const {
    healthProfile,
    healthLogs,
    workoutLogs,
    updateHealthProfile,
    addHealthLog,
    deleteHealthLog,
    addWorkoutLog,
    deleteWorkoutLog,
    shiftInfo,
  } = useLifeOS();

  const defaultLocation: LocationContext = shiftInfo.phase === 'work' ? 'mine_camp' : 'rest_home';
  const [isFitModalOpen, setIsFitModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isWorkoutOpen, setIsWorkoutOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(emptyProfileDraft);
  const [logDraft, setLogDraft] = useState<HealthLogDraft>(() => emptyHealthLogDraft(defaultLocation));
  const [workoutDraft, setWorkoutDraft] = useState<WorkoutDraft>(() => emptyWorkoutDraft(defaultLocation));
  const [logError, setLogError] = useState('');
  const [workoutError, setWorkoutError] = useState('');

  const sortedLogs = useMemo(() => sortHealthLogsNewestFirst(healthLogs), [healthLogs]);
  const sortedWorkouts = useMemo(
    () => [...workoutLogs].sort((a, b) => `${b.date}T${b.time || '00:00'}`.localeCompare(`${a.date}T${a.time || '00:00'}`)),
    [workoutLogs],
  );

  const latestOverall = sortedLogs[0];
  const latestSpO2 = latestHealthLogWith(healthLogs, 'spO2Pct');
  const latestHeartRate = latestHealthLogWith(healthLogs, 'heartRateBpm');
  const latestSleep = latestHealthLogWith(healthLogs, 'sleepHours');
  const latestWeight = latestHealthLogWith(healthLogs, 'weightKg');
  const latestSteps = latestHealthLogWith(healthLogs, 'steps');
  const latestCalories = latestHealthLogWith(healthLogs, 'calories');

  const profileHeight = positiveOrUndefined(healthProfile.heightCm);
  const profileWeight = positiveOrUndefined(healthProfile.weightKg);
  const bmi = profileHeight && profileWeight
    ? profileWeight / Math.pow(profileHeight / 100, 2)
    : undefined;

  const openProfile = () => {
    setProfileDraft({
      bloodType: healthProfile.bloodType || '',
      heightCm: profileHeight !== undefined ? String(profileHeight) : '',
      weightKg: profileWeight !== undefined ? String(profileWeight) : '',
      altitude: positiveOrUndefined(healthProfile.miningAltitudeMeters) !== undefined ? String(healthProfile.miningAltitudeMeters) : '',
      emergencyName: healthProfile.emergencyContact.name || '',
      emergencyKinship: healthProfile.emergencyContact.kinship || '',
      emergencyPhone: healthProfile.emergencyContact.phone || '',
      insuranceProvider: healthProfile.emergencyContact.insuranceProvider || '',
    });
    setIsProfileOpen(true);
  };

  const openHealthLog = () => {
    setLogDraft(emptyHealthLogDraft(defaultLocation));
    setLogError('');
    setIsLogOpen(true);
  };

  const openWorkout = () => {
    setWorkoutDraft(emptyWorkoutDraft(defaultLocation));
    setWorkoutError('');
    setIsWorkoutOpen(true);
  };

  const saveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    updateHealthProfile({
      bloodType: profileDraft.bloodType.trim(),
      heightCm: parseOptionalNumber(profileDraft.heightCm) ?? 0,
      weightKg: parseOptionalNumber(profileDraft.weightKg) ?? 0,
      miningAltitudeMeters: parseOptionalNumber(profileDraft.altitude) ?? 0,
      emergencyContact: {
        name: profileDraft.emergencyName.trim(),
        kinship: profileDraft.emergencyKinship.trim(),
        phone: profileDraft.emergencyPhone.trim(),
        insuranceProvider: profileDraft.insuranceProvider.trim(),
      },
    });
    setIsProfileOpen(false);
  };

  const saveHealthLog = (event: React.FormEvent) => {
    event.preventDefault();
    setLogError('');

    const spO2Pct = parseOptionalNumber(logDraft.spO2);
    const heartRateBpm = parseOptionalNumber(logDraft.heartRate);
    const bloodPressureSys = parseOptionalNumber(logDraft.systolic);
    const bloodPressureDia = parseOptionalNumber(logDraft.diastolic);
    const weightKg = parseOptionalNumber(logDraft.weight);
    const sleepHours = parseOptionalNumber(logDraft.sleepHours);
    const steps = parseOptionalNumber(logDraft.steps);
    const calories = parseOptionalNumber(logDraft.calories);
    const energyLevel = parseOptionalNumber(logDraft.energy);
    const symptoms = logDraft.symptoms
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const notes = logDraft.notes.trim();

    if ((bloodPressureSys === undefined) !== (bloodPressureDia === undefined)) {
      setLogError('Para presión arterial completa ambos campos o deja ambos vacíos.');
      return;
    }

    const hasRealContent = [
      spO2Pct,
      heartRateBpm,
      bloodPressureSys,
      bloodPressureDia,
      weightKg,
      sleepHours,
      steps,
      calories,
      energyLevel,
    ].some((value) => value !== undefined) || Boolean(logDraft.sleepQuality) || symptoms.length > 0 || Boolean(notes);

    if (!hasRealContent) {
      setLogError('Ingresa al menos un dato real antes de guardar.');
      return;
    }

    addHealthLog({
      date: todayLocalDate(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      spO2Pct,
      heartRateBpm,
      bloodPressureSys,
      bloodPressureDia,
      weightKg,
      sleepHours,
      sleepQuality: logDraft.sleepQuality || undefined,
      steps,
      calories,
      energyLevel,
      altitudeSymptoms: symptoms.length ? symptoms : undefined,
      locationContext: logDraft.location,
      notes: notes || undefined,
    });

    setIsLogOpen(false);
  };

  const saveWorkout = (event: React.FormEvent) => {
    event.preventDefault();
    setWorkoutError('');

    const durationMinutes = parseOptionalNumber(workoutDraft.duration);
    const caloriesBurned = parseOptionalNumber(workoutDraft.calories);
    const sets = parseOptionalNumber(workoutDraft.sets);
    const weightKg = parseOptionalNumber(workoutDraft.weightKg);
    const exerciseName = workoutDraft.exerciseName.trim();
    const reps = workoutDraft.reps.trim();

    if (!durationMinutes || durationMinutes <= 0) {
      setWorkoutError('Ingresa la duración real del entrenamiento.');
      return;
    }

    if (exerciseName && (!sets || !reps)) {
      setWorkoutError('Si registras un ejercicio, completa también series y repeticiones.');
      return;
    }

    addWorkoutLog({
      date: todayLocalDate(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: workoutDraft.type,
      durationMinutes,
      caloriesBurned,
      locationContext: workoutDraft.location,
      notes: workoutDraft.notes.trim() || undefined,
      exercises: exerciseName
        ? [{ name: exerciseName, sets: Number(sets), reps, weightKg }]
        : [],
    });

    setIsWorkoutOpen(false);
  };

  const confirmDeleteHealthLog = (id: string, date: string) => {
    if (window.confirm(`¿Eliminar el registro de salud del ${date}? Esta acción no se puede deshacer.`)) {
      deleteHealthLog(id);
    }
  };

  const confirmDeleteWorkout = (id: string, date: string) => {
    if (window.confirm(`¿Eliminar el entrenamiento del ${date}? Esta acción no se puede deshacer.`)) {
      deleteWorkoutLog(id);
    }
  };

  const metricCard = (label: string, value: string, meta: string, icon: React.ReactNode) => (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 text-slate-400">{icon}<span className="text-[10px] font-black uppercase tracking-wide">{label}</span></div>
      <p className="mt-2 text-xl font-black text-slate-950 dark:text-white">{value}</p>
      <p className="mt-1 text-[10px] text-slate-400">{meta}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] animate-fade-in">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-500"><HeartPulse className="h-6 w-6" /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-500">Salud · datos reales</p>
              <h1 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Salud y actividad</h1>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">
                Registra y sincroniza mediciones sin completar valores faltantes ni interpretar clínicamente los resultados.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button type="button" onClick={() => setIsFitModalOpen(true)} className="min-h-11 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-600 dark:text-emerald-300">
              Sincronizar salud
            </button>
            <button type="button" onClick={openProfile} className="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <span className="inline-flex items-center gap-1.5"><Edit3 className="h-4 w-4" /> Editar ficha</span>
            </button>
            <button type="button" onClick={openHealthLog} className="min-h-11 rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-black text-slate-950">
              <span className="inline-flex items-center gap-1.5"><Plus className="h-4 w-4" /> Registrar datos</span>
            </button>
            <button type="button" onClick={openWorkout} className="min-h-11 rounded-2xl bg-amber-400 px-3 py-2 text-xs font-black text-slate-950">
              <span className="inline-flex items-center gap-1.5"><Dumbbell className="h-4 w-4" /> Entrenamiento</span>
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {metricCard('SpO₂', latestSpO2?.spO2Pct !== undefined ? `${formatMeasuredNumber(latestSpO2.spO2Pct, 1)}%` : '—', latestSpO2 ? `Medido ${latestSpO2.date}` : 'Sin medición', <Activity className="h-4 w-4" />)}
        {metricCard('Pulso', latestHeartRate?.heartRateBpm !== undefined ? `${formatMeasuredNumber(latestHeartRate.heartRateBpm, 0)} bpm` : '—', latestHeartRate ? `Medido ${latestHeartRate.date}` : 'Sin medición', <HeartPulse className="h-4 w-4" />)}
        {metricCard('Sueño', latestSleep?.sleepHours !== undefined ? `${formatMeasuredNumber(latestSleep.sleepHours, 2)} h` : '—', latestSleep ? `Registrado ${latestSleep.date}` : 'Sin registro', <Moon className="h-4 w-4" />)}
        {metricCard('Peso', latestWeight?.weightKg !== undefined ? `${formatMeasuredNumber(latestWeight.weightKg, 1)} kg` : profileWeight !== undefined ? `${formatMeasuredNumber(profileWeight, 1)} kg` : '—', latestWeight ? `Medido ${latestWeight.date}` : profileWeight !== undefined ? 'Dato de ficha' : 'Sin dato', <Weight className="h-4 w-4" />)}
        {metricCard('Pasos', latestSteps?.steps !== undefined ? formatMeasuredNumber(latestSteps.steps, 0) : '—', latestSteps ? `Registrado ${latestSteps.date}` : 'Sin registro', <Footprints className="h-4 w-4" />)}
        {metricCard('Calorías', latestCalories?.calories !== undefined ? `${formatMeasuredNumber(latestCalories.calories, 0)} kcal` : '—', latestCalories ? `Registrado ${latestCalories.date}` : 'Sin registro', <Flame className="h-4 w-4" />)}
        {metricCard('IMC calculado', bmi !== undefined ? formatMeasuredNumber(bmi, 1) : '—', profileHeight && profileWeight ? `${formatMeasuredNumber(profileWeight, 1)} kg · ${formatMeasuredNumber(profileHeight, 1)} cm` : 'Completa peso y estatura', <Activity className="h-4 w-4" />)}
        {metricCard('Contacto', healthProfile.emergencyContact.name?.trim() || '—', healthProfile.emergencyContact.phone?.trim() || 'Sin teléfono', <PhoneCall className="h-4 w-4" />)}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Historial</p>
            <h2 className="mt-1 text-sm font-black text-slate-950 dark:text-white">Registros de salud · {sortedLogs.length}</h2>
          </div>
          <button type="button" onClick={openHealthLog} className="min-h-11 rounded-2xl border border-slate-200 px-3 text-xs font-black text-slate-700 dark:border-slate-700 dark:text-slate-200">+ Nuevo</button>
        </div>

        <div className="mt-4 space-y-2">
          {sortedLogs.map((log) => (
            <article key={log.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-black text-slate-950 dark:text-white">{log.date}{log.time ? ` · ${log.time}` : ''}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      {log.locationContext === 'mine_camp' ? 'Faena' : log.locationContext === 'transit' ? 'Tránsito' : 'Descanso'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {log.spO2Pct !== undefined && <span>SpO₂ <strong className="text-slate-900 dark:text-white">{formatMeasuredNumber(log.spO2Pct, 1)}%</strong></span>}
                    {log.heartRateBpm !== undefined && <span>Pulso <strong className="text-slate-900 dark:text-white">{formatMeasuredNumber(log.heartRateBpm, 0)} bpm</strong></span>}
                    {log.bloodPressureSys !== undefined && log.bloodPressureDia !== undefined && <span>P.A. <strong className="text-slate-900 dark:text-white">{formatMeasuredNumber(log.bloodPressureSys, 0)}/{formatMeasuredNumber(log.bloodPressureDia, 0)}</strong></span>}
                    {log.sleepHours !== undefined && <span>Sueño <strong className="text-slate-900 dark:text-white">{formatMeasuredNumber(log.sleepHours, 2)} h</strong></span>}
                    {log.weightKg !== undefined && <span>Peso <strong className="text-slate-900 dark:text-white">{formatMeasuredNumber(log.weightKg, 1)} kg</strong></span>}
                    {log.steps !== undefined && <span>Pasos <strong className="text-slate-900 dark:text-white">{formatMeasuredNumber(log.steps, 0)}</strong></span>}
                    {log.calories !== undefined && <span>Calorías <strong className="text-slate-900 dark:text-white">{formatMeasuredNumber(log.calories, 0)}</strong></span>}
                  </div>
                  {log.notes && <p className="mt-2 text-xs text-slate-500">{log.notes}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => confirmDeleteHealthLog(log.id, log.date)}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 text-xs font-black text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                >
                  <Trash2 className="h-4 w-4" /> Eliminar
                </button>
              </div>
            </article>
          ))}
          {sortedLogs.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500 dark:border-slate-700">Sin registros de salud guardados.</div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Actividad</p>
            <h2 className="mt-1 text-sm font-black text-slate-950 dark:text-white">Entrenamientos · {sortedWorkouts.length}</h2>
          </div>
          <button type="button" onClick={openWorkout} className="min-h-11 rounded-2xl border border-amber-300 bg-amber-50 px-3 text-xs font-black text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">+ Entreno</button>
        </div>

        <div className="mt-4 space-y-2">
          {sortedWorkouts.map((workout) => (
            <article key={workout.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black text-slate-950 dark:text-white">{workoutLabel(workout.type)} · {workout.durationMinutes} min</p>
                <p className="mt-1 text-[10px] text-slate-400">{workout.date}{workout.time ? ` · ${workout.time}` : ''}{workout.caloriesBurned !== undefined ? ` · ${formatMeasuredNumber(workout.caloriesBurned, 0)} kcal` : ''}</p>
                {workout.exercises.length > 0 && <p className="mt-1 text-[10px] text-slate-500">{workout.exercises.map((exercise) => exercise.name).join(', ')}</p>}
                {workout.notes && <p className="mt-1 text-xs text-slate-500">{workout.notes}</p>}
              </div>
              <button type="button" onClick={() => confirmDeleteWorkout(workout.id, workout.date)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 text-xs font-black text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                <Trash2 className="h-4 w-4" /> Eliminar
              </button>
            </article>
          ))}
          {sortedWorkouts.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500 dark:border-slate-700">Sin entrenamientos registrados.</div>}
        </div>
      </section>

      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm">
          <form onSubmit={saveProfile} className="my-8 w-full max-w-2xl space-y-4 rounded-3xl border border-slate-700 bg-slate-900 p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div><h2 className="text-base font-black">Editar ficha</h2><p className="mt-1 text-[10px] text-slate-400">Deja en blanco cualquier dato que no quieras conservar.</p></div>
              <button type="button" onClick={() => setIsProfileOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-300">Grupo sanguíneo<input value={profileDraft.bloodType} onChange={(e) => setProfileDraft((draft) => ({ ...draft, bloodType: e.target.value }))} placeholder="Sin registrar" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white" /></label>
              <label className="text-xs font-bold text-slate-300">Estatura (cm)<input type="number" step="0.1" value={profileDraft.heightCm} onChange={(e) => setProfileDraft((draft) => ({ ...draft, heightCm: e.target.value }))} placeholder="Sin registrar" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white" /></label>
              <label className="text-xs font-bold text-slate-300">Peso de ficha (kg)<input type="number" step="0.1" value={profileDraft.weightKg} onChange={(e) => setProfileDraft((draft) => ({ ...draft, weightKg: e.target.value }))} placeholder="Sin registrar" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white" /></label>
              <label className="text-xs font-bold text-slate-300">Altitud de faena (msnm)<input type="number" value={profileDraft.altitude} onChange={(e) => setProfileDraft((draft) => ({ ...draft, altitude: e.target.value }))} placeholder="Sin registrar" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white" /></label>
            </div>
            <div className="grid grid-cols-1 gap-3 border-t border-slate-800 pt-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-300">Contacto de emergencia<input value={profileDraft.emergencyName} onChange={(e) => setProfileDraft((draft) => ({ ...draft, emergencyName: e.target.value }))} placeholder="Sin registrar" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white" /></label>
              <label className="text-xs font-bold text-slate-300">Parentesco<input value={profileDraft.emergencyKinship} onChange={(e) => setProfileDraft((draft) => ({ ...draft, emergencyKinship: e.target.value }))} placeholder="Sin registrar" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white" /></label>
              <label className="text-xs font-bold text-slate-300">Teléfono<input value={profileDraft.emergencyPhone} onChange={(e) => setProfileDraft((draft) => ({ ...draft, emergencyPhone: e.target.value }))} placeholder="Sin registrar" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white" /></label>
              <label className="text-xs font-bold text-slate-300">Previsión / seguro<input value={profileDraft.insuranceProvider} onChange={(e) => setProfileDraft((draft) => ({ ...draft, insuranceProvider: e.target.value }))} placeholder="Sin registrar" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white" /></label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-800 pt-3"><button type="button" onClick={() => setIsProfileOpen(false)} className="min-h-11 rounded-xl px-4 text-xs font-bold text-slate-300">Cancelar</button><button type="submit" className="min-h-11 rounded-xl bg-emerald-500 px-5 text-xs font-black text-slate-950">Guardar ficha</button></div>
          </form>
        </div>
      )}

      {isLogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm">
          <form onSubmit={saveHealthLog} className="my-8 w-full max-w-2xl space-y-4 rounded-3xl border border-slate-700 bg-slate-900 p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3"><div><h2 className="text-base font-black">Registrar datos de salud</h2><p className="mt-1 text-[10px] text-slate-400">Todos los campos son opcionales. LifeOS guarda solo lo que completas.</p></div><button type="button" onClick={() => setIsLogOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button></div>

            <label className="block text-xs font-bold text-slate-300">Contexto<select value={logDraft.location} onChange={(e) => setLogDraft((draft) => ({ ...draft, location: e.target.value as LocationContext }))} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white"><option value="mine_camp">Faena</option><option value="rest_home">Casa / descanso</option><option value="transit">Tránsito</option></select></label>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <label className="text-xs font-bold text-slate-300">SpO₂ (%)<input type="number" step="0.1" value={logDraft.spO2} onChange={(e) => setLogDraft((draft) => ({ ...draft, spO2: e.target.value }))} placeholder="Sin registrar" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white" /></label>
              <label className="text-xs font-bold text-slate-300">Pulso (bpm)<input type="number" value={logDraft.heartRate} onChange={(e) => setLogDraft((draft) => ({ ...draft, heartRate: e.target.value }))} placeholder="Sin registrar" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white" /></label>
              <label className="text-xs font-bold text-slate-300">Peso (kg)<input type="number" step="0.1" value={logDraft.weight} onChange={(e) => setLogDraft((draft) => ({ ...draft, weight: e.target.value }))} placeholder="Sin registrar" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white" /></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-bold text-slate-300">P.A. sistólica<input type="number" value={logDraft.systolic} onChange={(e) => setLogDraft((draft) => ({ ...draft, systolic: e.target.value }))} placeholder="Sin registrar" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white" /></label>
              <label className="text-xs font-bold text-slate-300">P.A. diastólica<input type="number" value={logDraft.diastolic} onChange={(e) => setLogDraft((draft) => ({ ...draft, diastolic: e.target.value }))} placeholder="Sin registrar" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white" /></label>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <label className="text-xs font-bold text-slate-300">Sueño (h)<input type="number" step="0.25" value={logDraft.sleepHours} onChange={(e) => setLogDraft((draft) => ({ ...draft, sleepHours: e.target.value }))} placeholder="Sin registrar" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white" /></label>
              <label className="text-xs font-bold text-slate-300">Calidad del sueño<select value={logDraft.sleepQuality} onChange={(e) => setLogDraft((draft) => ({ ...draft, sleepQuality: e.target.value as '' | SleepQuality }))} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white"><option value="">Sin registrar</option><option value="excelente">Excelente</option><option value="buena">Buena</option><option value="regular">Regular</option><option value="mala">Mala</option></select></label>
              <label className="text-xs font-bold text-slate-300">Energía 1–10<select value={logDraft.energy} onChange={(e) => setLogDraft((draft) => ({ ...draft, energy: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white"><option value="">Sin registrar</option>{Array.from({ length: 10 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-bold text-slate-300">Pasos<input type="number" value={logDraft.steps} onChange={(e) => setLogDraft((draft) => ({ ...draft, steps: e.target.value }))} placeholder="Sin registrar" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white" /></label>
              <label className="text-xs font-bold text-slate-300">Calorías<input type="number" value={logDraft.calories} onChange={(e) => setLogDraft((draft) => ({ ...draft, calories: e.target.value }))} placeholder="Sin registrar" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white" /></label>
            </div>
            <label className="block text-xs font-bold text-slate-300">Síntomas / observaciones de altura<input value={logDraft.symptoms} onChange={(e) => setLogDraft((draft) => ({ ...draft, symptoms: e.target.value }))} placeholder="Separados por coma; opcional" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white" /></label>
            <label className="block text-xs font-bold text-slate-300">Notas<textarea value={logDraft.notes} onChange={(e) => setLogDraft((draft) => ({ ...draft, notes: e.target.value }))} placeholder="Opcional" rows={2} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white" /></label>
            {logError && <p className="rounded-xl border border-rose-900 bg-rose-950/40 p-3 text-xs font-bold text-rose-300">{logError}</p>}
            <div className="flex justify-end gap-2 border-t border-slate-800 pt-3"><button type="button" onClick={() => setIsLogOpen(false)} className="min-h-11 rounded-xl px-4 text-xs font-bold text-slate-300">Cancelar</button><button type="submit" className="min-h-11 rounded-xl bg-emerald-500 px-5 text-xs font-black text-slate-950">Guardar registro</button></div>
          </form>
        </div>
      )}

      {isWorkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm">
          <form onSubmit={saveWorkout} className="my-8 w-full max-w-2xl space-y-4 rounded-3xl border border-slate-700 bg-slate-900 p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3"><div><h2 className="text-base font-black">Registrar entrenamiento</h2><p className="mt-1 text-[10px] text-slate-400">Duración real obligatoria; el resto es opcional.</p></div><button type="button" onClick={() => setIsWorkoutOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <label className="text-xs font-bold text-slate-300">Tipo<select value={workoutDraft.type} onChange={(e) => setWorkoutDraft((draft) => ({ ...draft, type: e.target.value as WorkoutType }))} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white"><option value="strength">Fuerza</option><option value="cardio">Cardio</option><option value="hiit">HIIT</option><option value="yoga">Yoga</option><option value="mobility">Movilidad</option><option value="sports">Deportes</option><option value="other">Otro</option></select></label>
              <label className="text-xs font-bold text-slate-300">Duración (min)<input type="number" min="1" value={workoutDraft.duration} onChange={(e) => setWorkoutDraft((draft) => ({ ...draft, duration: e.target.value }))} placeholder="Obligatorio" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white" /></label>
              <label className="text-xs font-bold text-slate-300">Contexto<select value={workoutDraft.location} onChange={(e) => setWorkoutDraft((draft) => ({ ...draft, location: e.target.value as LocationContext }))} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white"><option value="mine_camp">Faena</option><option value="rest_home">Casa / descanso</option><option value="transit">Tránsito</option></select></label>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-300">Ejercicio principal<input value={workoutDraft.exerciseName} onChange={(e) => setWorkoutDraft((draft) => ({ ...draft, exerciseName: e.target.value }))} placeholder="Opcional" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white" /></label>
              <label className="text-xs font-bold text-slate-300">Calorías<input type="number" value={workoutDraft.calories} onChange={(e) => setWorkoutDraft((draft) => ({ ...draft, calories: e.target.value }))} placeholder="Opcional" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white" /></label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <label className="text-xs font-bold text-slate-300">Series<input type="number" min="1" value={workoutDraft.sets} onChange={(e) => setWorkoutDraft((draft) => ({ ...draft, sets: e.target.value }))} placeholder="Opcional" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white" /></label>
              <label className="text-xs font-bold text-slate-300">Reps<input value={workoutDraft.reps} onChange={(e) => setWorkoutDraft((draft) => ({ ...draft, reps: e.target.value }))} placeholder="Opcional" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white" /></label>
              <label className="text-xs font-bold text-slate-300">Peso (kg)<input type="number" step="0.5" value={workoutDraft.weightKg} onChange={(e) => setWorkoutDraft((draft) => ({ ...draft, weightKg: e.target.value }))} placeholder="Opcional" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white" /></label>
            </div>
            <label className="block text-xs font-bold text-slate-300">Notas<textarea value={workoutDraft.notes} onChange={(e) => setWorkoutDraft((draft) => ({ ...draft, notes: e.target.value }))} placeholder="Opcional" rows={2} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white" /></label>
            {workoutError && <p className="rounded-xl border border-rose-900 bg-rose-950/40 p-3 text-xs font-bold text-rose-300">{workoutError}</p>}
            <div className="flex justify-end gap-2 border-t border-slate-800 pt-3"><button type="button" onClick={() => setIsWorkoutOpen(false)} className="min-h-11 rounded-xl px-4 text-xs font-bold text-slate-300">Cancelar</button><button type="submit" className="min-h-11 rounded-xl bg-amber-400 px-5 text-xs font-black text-slate-950">Guardar entrenamiento</button></div>
          </form>
        </div>
      )}

      <GoogleFitSyncModal isOpen={isFitModalOpen} onClose={() => setIsFitModalOpen(false)} />

      {latestOverall && (
        <p className="text-center text-[10px] text-slate-400">Último registro guardado: {latestOverall.date}{latestOverall.time ? ` · ${latestOverall.time}` : ''}</p>
      )}
    </div>
  );
};
