import React from 'react';
import { useLifeOS } from '../../../context/LifeOSContext';
import { Briefcase, Sliders, Calendar, CheckCircle2 } from 'lucide-react';

export const ShiftSection: React.FC = () => {
  const { shiftConfig, updateShiftConfig, openShiftCalibration, shiftInfo } = useLifeOS();

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Briefcase className="w-6 h-6 text-emerald-500" />
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Sistema de Turnos Roster</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Configura la rotación de días de trabajo y descanso en faena.</p>
          </div>
        </div>

        <button
          onClick={openShiftCalibration}
          className="px-3.5 py-2 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
        >
          <Sliders className="w-4 h-4" /> Recalibrar Turno
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
          <span className="text-[10px] font-extrabold uppercase text-slate-400">Esquema Actual</span>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            {shiftConfig.workDays} x {shiftConfig.restDays}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {shiftConfig.workDays} Días de Faena / {shiftConfig.restDays} Días de Descanso
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
          <span className="text-[10px] font-extrabold uppercase text-slate-400">Fase Actual</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 capitalize">
            Día {shiftConfig.currentDayInPhase} ({shiftConfig.currentPhase === 'rest' ? 'Descanso' : 'Faena Minera'})
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Fecha Ancla: {shiftConfig.anchorDate}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Ubicación o Campamento Minero
        </label>
        <input
          type="text"
          value={shiftConfig.locationName || 'Mina / Campamento Doña Inés'}
          onChange={(e) => updateShiftConfig({ locationName: e.target.value })}
          className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
        />
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
          <div>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Próximo Cambio de Fase</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{shiftInfo.nextChangeDate}</p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
            <p className="text-[10px] font-bold text-slate-500">Días Restantes</p>
            <p className="text-lg font-black text-slate-900 dark:text-white">{shiftInfo.daysRemaining}</p>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
            <p className="text-[10px] font-bold text-slate-500">Progreso Fase</p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{shiftInfo.cycleProgressPct}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};