import React from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import {
  Pickaxe, Coffee, Calendar, Clock, SlidersHorizontal, CheckCircle2,
  MapPin, Sparkles, AlertCircle, ArrowRight, Sun, Moon, ShieldAlert
} from 'lucide-react';

export const ShiftDashboardCard: React.FC = () => {
  const { shiftInfo, shiftConfig, openShiftCalibration } = useLifeOS();

  const isRest = shiftInfo.phase === 'rest';

  // Format shift change date nicely
  const getFormattedDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={`p-6 rounded-3xl border shadow-lg transition-all relative overflow-hidden ${
      isRest
        ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/70 border-emerald-800/80'
        : 'bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/70 border-amber-800/80'
    }`}>
      {/* Background Subtle Pattern Glow */}
      <div className={`absolute -right-10 -bottom-10 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
        isRest ? 'bg-emerald-500' : 'bg-amber-500'
      }`} />

      <div className="relative z-10 space-y-5">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl border ${
              isRest
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}>
              {isRest ? <Coffee className="w-6 h-6" /> : <Pickaxe className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Rotación Minera 14x14
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isRest
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {isRest ? 'En Descanso 🌿' : 'En Faena ⛏️'}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white">
                Día {shiftInfo.dayInPhase} de {shiftInfo.totalPhaseDays} — {isRest ? 'Descanso' : 'Faena Minera'}
              </h2>
            </div>
          </div>

          <button
            onClick={openShiftCalibration}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm"
            title="Ajustar día o calibrar turno"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Calibrar Turno</span>
          </button>
        </div>

        {/* 14-Step Visual Day Nodes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Progreso de Fase ({shiftInfo.dayInPhase}/14 días)</span>
            <span className={isRest ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {shiftInfo.daysRemaining} días restantes
            </span>
          </div>

          <div className="grid grid-cols-7 sm:grid-cols-14 gap-1 sm:gap-1.5 pt-1">
            {Array.from({ length: 14 }).map((_, idx) => {
              const dayNum = idx + 1;
              const isPast = dayNum < shiftInfo.dayInPhase;
              const isCurrent = dayNum === shiftInfo.dayInPhase;

              return (
                <div
                  key={dayNum}
                  className={`h-8 rounded-lg flex flex-col items-center justify-center font-mono font-bold text-[10px] transition-all ${
                    isCurrent
                      ? isRest
                        ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 scale-110 shadow-md font-black'
                        : 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 scale-110 shadow-md font-black'
                      : isPast
                      ? isRest
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                        : 'bg-amber-950/80 text-amber-400 border border-amber-800/80'
                      : 'bg-slate-800/60 text-slate-500 border border-slate-800'
                  }`}
                  title={`Día ${dayNum} de ${shiftInfo.totalPhaseDays}`}
                >
                  {isPast ? '✓' : dayNum}
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestones & Advice Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Milestone 1: Shift Change Date */}
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-700/60 text-slate-300">
                <Calendar className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">
                  {isRest ? 'Próxima Subida a Faena Minera' : 'Próxima Bajada a Descanso'}
                </p>
                <p className="text-sm font-bold text-white">
                  {getFormattedDate(shiftInfo.nextChangeDate)}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className={`text-xs font-extrabold px-2.5 py-1 rounded-xl border ${
                isRest
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              }`}>
                en {shiftInfo.daysRemaining + 1}d
              </span>
            </div>
          </div>

          {/* Shift Context Advice */}
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 mt-0.5 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Recomendación LifeOS para Día {shiftInfo.dayInPhase}
              </p>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                {isRest
                  ? 'Fase de recuperación y hogar: excelente momento para tus hábitos de salud, pasar tiempo libre de calidad, avanzar en lecturas y trámites personales.'
                  : 'Fase de concentración en campamento: prioriza tareas laborales de alto impacto, hábitos rígidamente agendados (sueño e hidratación) y optimización de energía.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
