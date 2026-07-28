import React, { useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { ShiftType } from '../../types';
import { generateCycleCalendar } from '../../utils/shiftUtils';
import {
  Pickaxe, Coffee, Calendar, ShieldCheck, MapPin, X, Clock, CheckCircle2,
  ChevronRight, RefreshCw, Settings, Info, ArrowRight, Sun, Moon
} from 'lucide-react';

export const ShiftCalibrationModal: React.FC = () => {
  const {
    shiftConfig,
    shiftInfo,
    isShiftCalibrationOpen,
    closeShiftCalibration,
    calibrateShift,
    updateShiftConfig
  } = useLifeOS();

  const [selectedPhase, setSelectedPhase] = useState<ShiftType>(shiftInfo.phase);
  const [selectedDay, setSelectedDay] = useState<number>(shiftInfo.dayInPhase);
  const [location, setLocation] = useState<string>(shiftConfig.locationName || 'Faena Minera / Campamento');
  const [notes, setNotes] = useState<string>(shiftConfig.notes || '');

  if (!isShiftCalibrationOpen) return null;

  const cycleDays = generateCycleCalendar(shiftConfig);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    calibrateShift(selectedDay, selectedPhase, 14, 14);
    updateShiftConfig({ locationName: location, notes });
    closeShiftCalibration();
  };

  const handleQuickPresetDay4Rest = () => {
    setSelectedPhase('rest');
    setSelectedDay(4);
    calibrateShift(4, 'rest', 14, 14);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}>
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-6 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Pickaxe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Sistema Rotación Minera 14x14</h2>
              <p className="text-xs text-slate-400">Configuración de turnos: 14 días de faena / 14 días de descanso</p>
            </div>
          </div>

          <button
            onClick={closeShiftCalibration}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Banner */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
          shiftInfo.phase === 'rest'
            ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200'
            : 'bg-amber-950/60 border-amber-800/80 text-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            {shiftInfo.phase === 'rest' ? (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Coffee className="w-6 h-6" />
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                <Pickaxe className="w-6 h-6" />
              </div>
            )}
            <div>
              <p className="text-xs uppercase font-extrabold tracking-wider opacity-80">Estado Actual de Turno</p>
              <h3 className="text-base font-bold">
                Día {shiftInfo.dayInPhase} de {shiftInfo.totalPhaseDays} — {shiftInfo.phase === 'rest' ? 'Descanso 🌿' : 'Faena Minera ⛏️'}
              </h3>
              <p className="text-xs opacity-90 mt-0.5">
                Quedan <span className="font-bold">{shiftInfo.daysRemaining} días</span> para el cambio de turno ({shiftInfo.nextChangeDate})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleQuickPresetDay4Rest}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold border border-white/20 whitespace-nowrap"
          >
            Sincronizar a Día 4 Descanso
          </button>
        </div>

        {/* Form Controls */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phase Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Fase Actual</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPhase('rest')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    selectedPhase === 'rest'
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Coffee className="w-4 h-4" />
                  <span>Descanso (14d)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPhase('work')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    selectedPhase === 'work'
                      ? 'bg-amber-600 border-amber-500 text-white shadow-lg'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Pickaxe className="w-4 h-4" />
                  <span>Faena (14d)</span>
                </button>
              </div>
            </div>

            {/* Day Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Día de la Fase (1 a 14)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={1}
                  max={14}
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(parseInt(e.target.value, 10))}
                  className="flex-1 accent-indigo-500 h-2 rounded-lg bg-slate-800"
                />
                <span className="w-12 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-center font-mono font-bold text-sm text-indigo-400">
                  {selectedDay}/14
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Ubicación / Campamento
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej. Campamento Mina Escondida / Casa"
                className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                Notas de Turno
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Cambio de turno a las 07:00 hrs"
                className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white"
              />
            </div>
          </div>

          {/* 28-Day Rotation Interactive Timeline Preview */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Calendario de Rotación (28 días)
              </span>
              <span className="text-[10px] text-slate-500">🟢 Descanso · 🟠 Faena</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-950 rounded-2xl border border-slate-800/80">
              {cycleDays.map((d, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-xl text-center border text-[11px] flex flex-col items-center justify-between ${
                    d.isToday
                      ? 'ring-2 ring-indigo-400 bg-indigo-950/80 border-indigo-500 text-white font-bold'
                      : d.phase === 'rest'
                      ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300'
                      : 'bg-amber-950/40 border-amber-900/60 text-amber-300'
                  }`}
                >
                  <span className="text-[9px] opacity-70 uppercase">{d.monthStr} {d.dayNum}</span>
                  <span className="font-extrabold text-xs my-0.5">d{d.dayInPhase}</span>
                  <span className="text-[9px] font-mono">{d.phase === 'rest' ? '🌿' : '⛏️'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={closeShiftCalibration}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
            >
              Guardar Configuración 14x14
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
