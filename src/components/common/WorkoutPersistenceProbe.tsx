import React, { useEffect, useRef, useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';

const PARAM = 'workoutTest';
const VALUE = '30';
const MARKER = 'LifeOS · prueba persistencia 30 min';

type Status = 'idle' | 'waiting' | 'created' | 'existing' | 'error';

const clearParam = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete(PARAM);
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
};

export const WorkoutPersistenceProbe: React.FC = () => {
  const {
    currentUser,
    isSyncing,
    workoutLogs,
    addWorkoutLog,
    setActiveTab,
  } = useLifeOS();

  const requested = new URLSearchParams(window.location.search).get(PARAM) === VALUE;
  const attemptedRef = useRef(false);
  const [status, setStatus] = useState<Status>(requested ? 'waiting' : 'idle');
  const [detail, setDetail] = useState('Esperando autenticación y carga de entrenamientos…');

  useEffect(() => {
    if (!requested || attemptedRef.current) return;
    if (!currentUser || isSyncing) {
      setStatus('waiting');
      setDetail('Esperando autenticación y carga desde Firestore…');
      return;
    }

    attemptedRef.current = true;
    const today = new Date().toISOString().split('T')[0];
    const existing = workoutLogs.find(
      (log) => log.date === today && (log.notes === MARKER || log.exercises.some((exercise) => exercise.name === MARKER)),
    );

    try {
      if (!existing) {
        addWorkoutLog({
          date: today,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'other',
          durationMinutes: 30,
          exercises: [
            {
              name: MARKER,
              sets: 1,
              reps: '30 min',
            },
          ],
          notes: MARKER,
          locationContext: 'rest_home',
        });
        setStatus('created');
        setDetail('Entrenamiento de 30 minutos creado con el flujo normal de LifeOS. Recarga la página para validar persistencia.');
      } else {
        setStatus('existing');
        setDetail('El entrenamiento de prueba ya existe. No se creó un duplicado.');
      }

      setActiveTab('health');
      clearParam();
    } catch (error) {
      console.error('Workout persistence probe failed:', error);
      setStatus('error');
      setDetail(error instanceof Error ? error.message : String(error));
    }
  }, [requested, currentUser, isSyncing, workoutLogs, addWorkoutLog, setActiveTab]);

  useEffect(() => {
    if (status !== 'created' && status !== 'existing') return;
    const timeout = window.setTimeout(() => setStatus('idle'), 10000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  if (status === 'idle') return null;

  const ok = status === 'created' || status === 'existing';
  const failure = status === 'error';

  return (
    <div className="fixed left-3 right-3 top-20 z-[101] mx-auto max-w-xl rounded-2xl border border-slate-700 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${ok ? 'bg-emerald-400' : failure ? 'bg-rose-400' : 'bg-amber-400 animate-pulse'}`} />
        <div>
          <p className="text-sm font-black">Prueba de entrenamiento · 30 min</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">{detail}</p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Estado: {status}</p>
        </div>
      </div>
    </div>
  );
};
