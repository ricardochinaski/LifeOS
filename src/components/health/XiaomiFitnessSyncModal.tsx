import { todayLocalDate } from '../../lib/dateOnly';
import React, { useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { syncFromHealthConnect, HealthConnectData } from '../../lib/healthConnect';
import { hasAnyHealthMetric } from '../../lib/healthMetrics';
import { isNative } from '../../lib/native';
import type { HealthLog } from '../../types';
import {
  Watch,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  Activity,
  Heart,
  Moon,
  Footprints,
  Info,
  X,
  ShieldCheck,
} from 'lucide-react';

interface XiaomiFitnessSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SyncMethod = 'live' | 'manual';

const emptyHealthData = (): HealthConnectData => ({
  spO2Pct: null,
  heartRateBpm: null,
  sleepHours: null,
  stepsCount: null,
  calories: null,
  bloodPressureSys: null,
  bloodPressureDia: null,
});

const parseOptionalNumber = (value: string): number | null => {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

export const XiaomiFitnessSyncModal: React.FC<XiaomiFitnessSyncModalProps> = ({ isOpen, onClose }) => {
  const { addHealthLog, showToast, shiftInfo } = useLifeOS();
  const [syncMethod, setSyncMethod] = useState<SyncMethod>('live');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [liveData, setLiveData] = useState<HealthConnectData | null>(null);

  const [manualSpO2, setManualSpO2] = useState('');
  const [manualHeartRate, setManualHeartRate] = useState('');
  const [manualSleep, setManualSleep] = useState('');
  const [manualSteps, setManualSteps] = useState('');

  if (!isOpen) return null;

  const locationContext: HealthLog['locationContext'] = shiftInfo.phase === 'work' ? 'mine_camp' : 'rest_home';

  const hasData = (data: HealthConnectData) =>
    hasAnyHealthMetric([
      data.spO2Pct,
      data.heartRateBpm,
      data.sleepHours,
      data.stepsCount,
      data.calories,
      data.bloodPressureSys,
      data.bloodPressureDia,
    ]);

  const saveHealthLog = (data: HealthConnectData, source: 'Health Connect' | 'Manual') => {
    if (!hasData(data)) return false;

    const log: Omit<HealthLog, 'id'> = {
      date: todayLocalDate(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      locationContext,
      notes: source === 'Health Connect'
        ? 'Sincronizado desde Health Connect. Solo se guardaron métricas realmente entregadas por el dispositivo.'
        : 'Registro manual de salud.',
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

  const handleSyncFromHealthConnect = async () => {
    if (!isNative()) {
      showToast('Health Connect solo está disponible en Android.');
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

      setLiveData(healthData);
      if (!saveHealthLog(healthData, 'Health Connect')) {
        showToast('No hay métricas disponibles hoy. Revisa los permisos y las fuentes de Health Connect.');
        return;
      }

      setSyncSuccess(true);
      showToast('Datos reales guardados desde Health Connect');
    } catch (e: any) {
      showToast(e.message || 'Error al conectar con Health Connect');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSave = () => {
    const data: HealthConnectData = {
      ...emptyHealthData(),
      spO2Pct: parseOptionalNumber(manualSpO2),
      heartRateBpm: parseOptionalNumber(manualHeartRate),
      sleepHours: parseOptionalNumber(manualSleep),
      stepsCount: parseOptionalNumber(manualSteps),
    };

    if (!saveHealthLog(data, 'Manual')) {
      showToast('Ingresa al menos una métrica antes de guardar.');
      return;
    }

    setSyncSuccess(true);
    showToast('Registro manual guardado');
  };

  const display = (value: number | null | undefined, suffix = '', digits?: number) => {
    if (value === null || value === undefined || !Number.isFinite(value)) return '—';
    const shown = typeof digits === 'number' ? value.toFixed(digits) : Math.round(value).toLocaleString('es-CL');
    return `${shown}${suffix}`;
  };

  const current = liveData ?? emptyHealthData();

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="w-full max-w-xl p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5 animate-scale-in text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Health Connect</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Android
                </span>
              </div>
              <h2 className="text-lg font-black text-white">Sincronización de salud</h2>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800/80 rounded-2xl border border-slate-700/80">
          <button
            onClick={() => { setSyncMethod('live'); setSyncSuccess(false); }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${syncMethod === 'live' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'text-slate-300 hover:text-white'}`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Health Connect
          </button>
          <button
            onClick={() => { setSyncMethod('manual'); setSyncSuccess(false); }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${syncMethod === 'manual' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'text-slate-300 hover:text-white'}`}
          >
            <Smartphone className="w-3.5 h-3.5" /> Manual
          </button>
        </div>

        {syncMethod === 'live' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
              <p className="font-bold flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-4 h-4" /> Fuente: Health Connect
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                LifeOS leerá únicamente los datos que Health Connect tenga disponibles y para los que hayas concedido permiso. Google Fit, Mi Fitness, Samsung Health u otras apps pueden actuar como fuentes si escriben allí.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Pasos hoy', value: display(current.stepsCount), color: 'text-emerald-400', icon: Footprints },
                { label: 'Pulso', value: display(current.heartRateBpm, ' bpm'), color: 'text-rose-400', icon: Heart },
                { label: 'SpO₂', value: display(current.spO2Pct, '%'), color: 'text-cyan-400', icon: Activity },
                { label: 'Sueño', value: display(current.sleepHours, ' h', 2), color: 'text-indigo-400', icon: Moon },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center space-y-1">
                  <item.icon className={`w-4 h-4 ${item.color} mx-auto`} />
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{item.label}</p>
                  <p className={`text-base font-black ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-slate-500">
              Antes de sincronizar se muestra “—”. LifeOS ya no completa métricas ausentes con valores simulados.
            </p>

            <button
              onClick={handleSyncFromHealthConnect}
              disabled={isSyncing}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isSyncing
                ? <><RefreshCw className="w-4 h-4 animate-spin" /><span>Leyendo Health Connect...</span></>
                : <><Watch className="w-4 h-4" /><span>Sincronizar datos reales</span></>}
            </button>
          </div>
        )}

        {syncMethod === 'manual' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-300">Ingresa solo valores medidos. Los campos pueden quedar vacíos.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">SpO₂ (%)</label>
                <input type="number" value={manualSpO2} onChange={(e) => setManualSpO2(e.target.value)} placeholder="—" className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Pulso (bpm)</label>
                <input type="number" value={manualHeartRate} onChange={(e) => setManualHeartRate(e.target.value)} placeholder="—" className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Sueño (horas)</label>
                <input type="number" step="0.1" value={manualSleep} onChange={(e) => setManualSleep(e.target.value)} placeholder="—" className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Pasos</label>
                <input type="number" value={manualSteps} onChange={(e) => setManualSteps(e.target.value)} placeholder="—" className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white" />
              </div>
            </div>
            <button onClick={handleManualSave} className="w-full mt-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase">
              Guardar lectura manual
            </button>
          </div>
        )}

        {syncSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>Datos guardados en tu ficha de salud.</span>
          </div>
        )}

        <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><Info className="w-3.5 h-3.5" /> Sin valores simulados</span>
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold">Cerrar</button>
        </div>
      </div>
    </div>
  );
};
