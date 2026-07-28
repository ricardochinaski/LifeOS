import React, { useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { generateWorkout } from '../../lib/api';
import { WorkoutRoutineAI } from '../../types';
import {
  Dumbbell, Sparkles, HeartPulse, ShieldAlert, Timer, CheckCircle2,
  Play, RotateCcw, Flame, Activity, Info, RefreshCw, Zap, Sliders
} from 'lucide-react';

export const AiWorkoutPlanner: React.FC = () => {
  const { healthProfile, healthLogs, shiftInfo, logHabit, habits } = useLifeOS();

  const [equipment, setEquipment] = useState('Autocarga (En habitación de campamento)');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [focusGoal, setFocusGoal] = useState('Aclimatación y Movilidad en Altura (4,200m)');
  const [userPrompt, setUserPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [workout, setWorkout] = useState<WorkoutRoutineAI | null>(null);

  // Rest Timer State
  const [activeTimerSeconds, setActiveTimerSeconds] = useState<number | null>(null);
  const [timerIntervalId, setTimerIntervalId] = useState<any>(null);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [workoutDoneLogged, setWorkoutDoneLogged] = useState(false);

  const latestLog = healthLogs.length > 0 ? healthLogs[0] : null;

  const handleGenerateWorkout = async () => {
    setIsGenerating(true);
    try {
      const data = await generateWorkout({
        healthProfile,
        latestLog,
        shiftInfo,
        equipment,
        durationMinutes,
        focusGoal,
        userPrompt
      });
      if (data.title) {
        setWorkout(data);
        setCompletedExercises([]);
        setWorkoutDoneLogged(false);
      }
    } catch (err) {
      console.error('Error in workout generation:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const startRestTimer = (seconds: number) => {
    if (timerIntervalId) clearInterval(timerIntervalId);
    setActiveTimerSeconds(seconds);

    const interval = setInterval(() => {
      setActiveTimerSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimerIntervalId(interval);
  };

  const toggleExerciseComplete = (name: string) => {
    if (completedExercises.includes(name)) {
      setCompletedExercises(completedExercises.filter((e) => e !== name));
    } else {
      setCompletedExercises([...completedExercises, name]);
    }
  };

  const handleFinishWorkout = () => {
    setWorkoutDoneLogged(true);
    // Find exercise or fitness habit if present
    const exerciseHabit = habits.find(
      (h) => h.title.toLowerCase().includes('ejercicio') || h.title.toLowerCase().includes('entreno')
    );
    if (exerciseHabit) {
      logHabit(exerciseHabit.id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner & Health Context */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/30 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                  Generador de Rutinas Adaptativas
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  IA + Medicina en Altura
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white">Rutina Integrada con Biometría</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700 text-xs">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300 font-semibold">
              SpO2: <strong className="text-emerald-400">{latestLog?.spO2Pct || 96}%</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300 font-semibold">
              Altitud: <strong className="text-amber-400">{healthProfile.miningAltitudeMeters} msnm</strong>
            </span>
          </div>
        </div>

        {/* Input Configuration Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Equipamiento:</label>
            <select
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Autocarga (En habitación de campamento)">Autocarga / Habitación</option>
              <option value="Gimnasio de Campamento (Pesas, poleas y cardio)">Gimnasio de Campamento</option>
              <option value="Mancuernas ligeras y bandas elásticas">Mancuernas + Bandas</option>
              <option value="Sin equipamiento / Movilidad y estiramiento">Solo Movilidad / Estiramientos</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Duración:</label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={15}>15 minutos (Exprés en Habitación)</option>
              <option value={30}>30 minutos (Recomendado Altitud)</option>
              <option value={45}>45 minutos (Completo)</option>
              <option value={60}>60 minutos (Avanzado Descanso)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Enfoque Principal:</label>
            <select
              value={focusGoal}
              onChange={(e) => setFocusGoal(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Aclimatación y Movilidad en Altura (4,200m)">Aclimatación y Respiración</option>
              <option value="Fuerza y Mantenimiento Muscular">Fuerza Muscular</option>
              <option value="Alivio de Fatiga y Postura de Manejo Minero">Postura y Espalda (Manejo/Mina)</option>
              <option value="Cardio Moderado Oxigenante">Cardio Suave Oxigenante</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase">
            Nota Opcional para la IA (ej. molestia lumbar, fatiga de turno noche):
          </label>
          <input
            type="text"
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Ej: Tengo tensión en los hombros tras el turno de conducion de 12 horas."
            className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleGenerateWorkout}
            disabled={isGenerating}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Analizando Biometría y Diseñando Rutina...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Generar Rutina Personalizada con IA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Workout Routine Display */}
      {workout && (
        <div className="space-y-6 animate-fade-in">
          {/* Routine Header */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-emerald-400 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>{workout.title}</span>
              </h3>
              <span className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300">
                ⏱ {durationMinutes} mins
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{workout.summary}</p>

            {/* Precautions Box */}
            {workout.precautions && workout.precautions.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5 text-xs text-amber-200">
                <p className="font-extrabold uppercase text-[10px] tracking-wider text-amber-400 flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4" /> Precauciones de Seguridad en Altitud ({healthProfile.miningAltitudeMeters}m):
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                  {workout.precautions.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Rest Timer Widget */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-indigo-500/40 flex items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Temporizador de Descanso</p>
                <p className="text-[10px] text-slate-400">
                  {activeTimerSeconds !== null && activeTimerSeconds > 0
                    ? `Descansando... Quedan ${activeTimerSeconds} segundos`
                    : activeTimerSeconds === 0
                    ? '¡Tiempo terminado! Listo para la siguiente serie'
                    : 'Selecciona los segundos de descanso según el ejercicio'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {[30, 60, 90].map((sec) => (
                <button
                  key={sec}
                  onClick={() => startRestTimer(sec)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-indigo-300"
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Warmup Section */}
          {workout.warmup && workout.warmup.length > 0 && (
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                1. Calentamiento & Acondicionamiento (5 mins)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {workout.warmup.map((w, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>{w.exercise}</span>
                      <span className="text-amber-400 text-[11px]">{w.duration}</span>
                    </div>
                    {w.notes && <p className="text-[11px] text-slate-400">{w.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exercises Grid */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                2. Bloque Principal de Ejercicios ({completedExercises.length}/{workout.exercises.length} Listos)
              </h4>
            </div>

            <div className="space-y-3">
              {workout.exercises.map((ex, idx) => {
                const isDone = completedExercises.includes(ex.name);
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all space-y-2 ${
                      isDone
                        ? 'bg-emerald-950/20 border-emerald-800 opacity-75'
                        : 'bg-slate-800/60 border-slate-700 hover:border-emerald-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleExerciseComplete(ex.name)}
                          className={`mt-0.5 p-1 rounded-lg border transition-colors ${
                            isDone
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                              : 'border-slate-600 text-slate-400 hover:text-emerald-400'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <div>
                          <p className={`text-sm font-bold ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                            {ex.name}
                          </p>
                          <p className="text-xs text-emerald-400 font-semibold">{ex.targetMuscle}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 font-bold text-amber-300">
                          {ex.sets} series x {ex.reps}
                        </span>
                        <button
                          onClick={() => startRestTimer(ex.restSeconds || 60)}
                          className="px-2.5 py-1 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 font-bold text-indigo-300 flex items-center gap-1"
                        >
                          <Timer className="w-3.5 h-3.5" />
                          <span>{ex.restSeconds}s</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 text-[11px] leading-relaxed pl-8">
                      {ex.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cooldown Section */}
          {workout.cooldown && workout.cooldown.length > 0 && (
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-sky-400" />
                3. Enfriamiento & Oxigenación Diafragmática (5 mins)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {workout.cooldown.map((c, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>{c.exercise}</span>
                      <span className="text-sky-400 text-[11px]">{c.duration}</span>
                    </div>
                    {c.notes && <p className="text-[11px] text-slate-400">{c.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Finish & Log Workout */}
          <div className="flex justify-end p-2">
            <button
              onClick={handleFinishWorkout}
              disabled={workoutDoneLogged}
              className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg ${
                workoutDoneLogged
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 cursor-default'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 cursor-pointer'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{workoutDoneLogged ? '¡Entrenamiento Registrado con Éxito!' : 'Marcar Entrenamiento Completado'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
