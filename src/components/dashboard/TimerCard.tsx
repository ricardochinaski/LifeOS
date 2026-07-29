import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus, Brain, Heart, Dumbbell } from 'lucide-react';

type TimerMode = 'pomodoro' | 'meditation' | 'exercise';

interface TimerPreset {
  label: string;
  minutes: number;
  icon: React.FC<{ className?: string }>;
  color: string;
  bg: string;
}

const PRESETS: Record<TimerMode, TimerPreset> = {
  pomodoro: { label: 'Pomodoro', minutes: 25, icon: Brain, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/30' },
  meditation: { label: 'Meditación', minutes: 10, icon: Heart, color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/30' },
  exercise: { label: 'Ejercicio', minutes: 15, icon: Dumbbell, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30' },
};

export const TimerCard: React.FC = () => {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [secondsLeft, setSecondsLeft] = useState(PRESETS[mode].minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [totalSeconds, setTotalSeconds] = useState(PRESETS[mode].minutes * 60);

  const preset = PRESETS[mode];
  const TimerIcon = preset.icon;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearTimer();
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  const handleStartPause = () => {
    if (isRunning) {
      clearTimer();
      setIsRunning(false);
    } else {
      if (secondsLeft === 0) {
        const total = totalSeconds;
        setSecondsLeft(total);
      }
      setIsRunning(true);
      startTimer();
    }
  };

  const handleReset = () => {
    clearTimer();
    setIsRunning(false);
    const total = totalSeconds;
    setSecondsLeft(total);
  };

  const handleAdjustTime = (delta: number) => {
    const newVal = Math.max(60, Math.min(3600, secondsLeft + delta * 60));
    setSecondsLeft(newVal);
    setTotalSeconds(newVal);
  };

  const switchMode = (newMode: TimerMode) => {
    clearTimer();
    setIsRunning(false);
    setMode(newMode);
    const total = PRESETS[newMode].minutes * 60;
    setSecondsLeft(total);
    setTotalSeconds(total);
  };

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;
  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference * (1 - progress);
  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${mode === 'pomodoro' ? 'bg-rose-100 dark:bg-rose-950' : mode === 'meditation' ? 'bg-indigo-100 dark:bg-indigo-950' : 'bg-emerald-100 dark:bg-emerald-950'}`}>
            <TimerIcon className={`w-5 h-5 ${preset.color}`} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Temporizadores</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Enfoque & Descanso</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {(Object.entries(PRESETS) as [TimerMode, TimerPreset][]).map(([key, p]) => {
          const Icon = p.icon;
          const isActive = mode === key;
          return (
            <button
              key={key}
              onClick={() => switchMode(key)}
              className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? `${p.bg} ${p.color} shadow-sm`
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center py-2">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="60" fill="none" stroke="currentColor" strokeWidth="8"
              className="text-slate-100 dark:text-slate-800" />
            <circle cx="70" cy="70" r="60" fill="none" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`transition-all duration-500 ${
                mode === 'pomodoro' ? 'stroke-rose-500' : mode === 'meditation' ? 'stroke-indigo-500' : 'stroke-emerald-500'
              }`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
              {isRunning ? 'Corriendo...' : secondsLeft === 0 ? 'Terminado' : 'Detenido'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => handleAdjustTime(-5)}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>

        <button
          onClick={handleStartPause}
          className={`p-3.5 rounded-full transition-all shadow-lg cursor-pointer ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-400 text-white'
              : `${
                  mode === 'pomodoro' ? 'bg-rose-500 hover:bg-rose-400' : mode === 'meditation' ? 'bg-indigo-500 hover:bg-indigo-400' : 'bg-emerald-500 hover:bg-emerald-400'
                } text-white`
          }`}
        >
          {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </button>

        <button
          onClick={handleReset}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleAdjustTime(5)}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400">
        <button onClick={() => handleAdjustTime(-5)} className="font-semibold hover:text-slate-600 dark:hover:text-slate-300">-5 min</button>
        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        <button onClick={() => handleAdjustTime(5)} className="font-semibold hover:text-slate-600 dark:hover:text-slate-300">+5 min</button>
      </div>
    </div>
  );
};
