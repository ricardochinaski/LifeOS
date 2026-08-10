import { todayLocalDate } from '../../lib/dateOnly';
import React, { useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { syncFromHealthConnect, HealthConnectData } from '../../lib/healthConnect';
import { hasAnyHealthMetric } from '../../lib/healthMetrics';
import { isNative } from '../../lib/native';
import type { HealthLog } from '../../types';
import {
  Activity, Heart, Moon, CheckCircle2, RefreshCw, X, ShieldCheck, Footprints, Flame
} from 'lucide-react';

interface GoogleFitSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMPTY_METRICS: HealthConnectData = {
  stepsCount: null,
  heartRateBpm: null,
  spO2Pct: null,
  sleepHours: null,
  calories: null,
  bloodPressureSys: null,
  bloodPressureDia: null,
};

export const GoogleFitSyncModal: React.FC<GoogleFitSyncModalProps> = ({ isOpen, onClose }) => {
  const { addHealthLog, showToast, shiftInfo } = useLifeOS();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [metrics, setMetrics] = useState<HealthConnectData>(EMPTY_METRICS);

  if (!isOpen) return null;

  const hasData = (data: HealthConnectData) => hasAnyHealthMetric([
    data.stepsCount,
    data.heartRateBpm,
    data.spO2Pct,
    data.sleepHours,
    data.calories,
    data.bloodPressureSys,
    data.bloodPressureDia,
  ]);

  const persistRealMetrics = (data: HealthConnectData) => {
    if (!hasData(data)) return false;

    const log: Omit<HealthLog, 'id'> = {
      date: todayLocalDate(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      locationContext: shiftInfo.phase === 'work' ? 'mine_camp' : 'rest_home',
      notes: 'Sincronizado desde Health Connect. Se guardaron únicamente métricas entregadas por Health Connect.',
    };

    if (data.spO2Pct !== null) log.spO2Pct = data.spO2Pct;
    if (data.heartRateBpm !== null) log.heartRateBpm = data.heartRateBpm;
    if (data.sleepHours !== null) log.sleepHours = data.sleepHours;
    if (data.stepsCount !== null) log.steps = data.stepsCount;
    if (data.calories !== null) log.calories = data.calories;
    if (data.bloodPressureSys !== null && data.bloodPressureDia !== null) {
      log.bloodPressureSys = data.bloodPressureSys;
      log.bloodPressureDia = data.bloodPressureDia;
    }

    addHealthLog(log);
    return true;
  };

  const handleSyncHealthConnect = async () => {
    if (!isNative()) {
      showToast('Health Connect solo está disponible en Android. No se generaron datos simulados.');
      return;
    }

    setIsSyncing(true);
    setSyncSuccess(false);

    try {
      const healthData = await syncFromHealthConnect();
      if (!healthData) {
        showToast('Health Connect no devolvió datos.');
        return;
      }

      setMetrics(healthData);
      if (!persistRealMetrics(healthData)) {
        showToast('No hay métricas disponibles hoy. Revisa permisos y fuentes en Health Connect.');
        return;
      }

      setSyncSuccess(true);
      showToast('Datos reales importados desde Health Connect');
    } catch (e: any) {
      showToast(e.message || 'Error al leer Health Connect');
    } finally {
      setIsSyncing(false);
    }
  };

  const displayNumber = (value: number | null, suffix = '', decimals?: number) => {
    if (value === null || !Number.isFinite(value)) return '—';
    const formatted = decimals === undefined
      ? Math.round(value).toLocaleString('es-CL')
      : value.toFixed(decimals);
    return `${formatted}${suffix}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5 text-white animate-scale-in">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Health Connect</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Android
                </span>
              </div>
              <h2 className="text-lg font-black text-white">Sincronización de salud</h2>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5 text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Fuente: Health Connect
          </p>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            LifeOS lee únicamente métricas disponibles en Health Connect. Google Fit, Xiaomi Mi Fitness, Samsung Health u otras apps pueden ser fuentes si escriben datos allí.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center space-y-1">
            <Footprints className="w-4 h-4 text-emerald-400 mx-auto" />
            <p className="text-[10px] font-bold uppercase text-slate-400">Pasos Hoy</p>
            <p className="text-base font-black text-emerald-400">{displayNumber(metrics.stepsCount)}</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center space-y-1">
            <Heart className="w-4 h-4 text-rose-400 mx-auto" />
            <p className="text-[10px] font-bold uppercase text-slate-400">Pulso</p>
            <p className="text-base font-black text-rose-400">{displayNumber(metrics.heartRateBpm, ' bpm')}</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center space-y-1">
            <Activity className="w-4 h-4 text-cyan-400 mx-auto" />
            <p className="text-[10px] font-bold uppercase text-slate-400">SpO₂</p>
            <p className="text-base font-black text-cyan-400">{displayNumber(metrics.spO2Pct, '%')}</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center space-y-1">
            <Moon className="w-4 h-4 text-indigo-400 mx-auto" />
            <p className="text-[10px] font-bold uppercase text-slate-400">Sueño</p>
            <p className="text-base font-black text-indigo-400">{displayNumber(metrics.sleepHours, ' h', 2)}</p>
          </div>
          <div className="col-span-2 p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center flex items-center justify-around">
            <div className="text-center">
              <Flame className="w-4 h-4 text-amber-400 mx-auto" />
              <p className="text-[10px] font-bold uppercase text-slate-400">Calorías activas</p>
              <p className="text-base font-black text-amber-400">{displayNumber(metrics.calories, ' kcal')}</p>
            </div>
            <div className="text-center border-l border-slate-700 pl-4">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto" />
              <p className="text-[10px] font-bold uppercase text-slate-400">Estado</p>
              <p className="text-xs font-black text-slate-300">{hasData(metrics) ? 'Leído' : 'Sin leer'}</p>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-500">
          Los campos muestran “—” hasta recibir una lectura real. Las métricas ausentes no se rellenan con valores de ejemplo.
        </p>

        <button onClick={handleSyncHealthConnect} disabled={isSyncing}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
        >
          {isSyncing ? (
            <><RefreshCw className="w-4 h-4 animate-spin text-slate-950" /><span>Leyendo Health Connect...</span></>
          ) : (
            <><Activity className="w-4 h-4 text-slate-950" /><span>Sincronizar datos reales</span></>
          )}
        </button>

        {syncSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>Datos reales importados y guardados en tu ficha de salud.</span>
          </div>
        )}

        <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>Health Connect · sin datos simulados</span>
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold">Cerrar</button>
        </div>
      </div>
    </div>
  );
};
