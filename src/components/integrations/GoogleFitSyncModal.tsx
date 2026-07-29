import React, { useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { syncFromHealthConnect, HealthConnectData } from '../../lib/healthConnect';
import { isNative } from '../../lib/native';
import {
  Activity, Heart, Moon, Zap, CheckCircle2, RefreshCw, X, ShieldCheck, Footprints, Sparkles, Flame
} from 'lucide-react';

interface GoogleFitSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleFitSyncModal: React.FC<GoogleFitSyncModalProps> = ({ isOpen, onClose }) => {
  const { addHealthLog, showToast } = useLifeOS();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const [metrics, setMetrics] = useState({
    steps: 10420,
    heartRate: 62,
    spO2: 98,
    sleepHours: 8.2,
    calories: 2350,
  });

  if (!isOpen) return null;

  const handleSyncHealthConnect = async () => {
    if (!isNative()) {
      showToast('Health Connect solo está disponible en Android.');
      simulateSync();
      return;
    }

    setIsSyncing(true);
    setSyncSuccess(false);

    try {
      const healthData: HealthConnectData | null = await syncFromHealthConnect();
      if (healthData) {
        setMetrics(prev => ({
          ...prev,
          steps: healthData.stepsCount ?? prev.steps,
          heartRate: healthData.heartRateBpm ?? prev.heartRate,
          spO2: healthData.spO2Pct ?? prev.spO2,
          sleepHours: healthData.sleepHours ?? prev.sleepHours,
          calories: healthData.calories ?? prev.calories,
        }));

        addHealthLog({
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          spO2Pct: healthData.spO2Pct ?? metrics.spO2,
          heartRateBpm: healthData.heartRateBpm ?? metrics.heartRate,
          sleepHours: healthData.sleepHours ?? metrics.sleepHours,
          sleepQuality: (healthData.sleepHours ?? metrics.sleepHours) >= 7.5 ? 'excelente' : 'buena',
          steps: healthData.stepsCount ?? metrics.steps,
          calories: healthData.calories ?? metrics.calories,
          energyLevel: 9,
          bloodPressureSys: healthData.bloodPressureSys ?? 118,
          bloodPressureDia: healthData.bloodPressureDia ?? 76,
          locationContext: 'mine_camp',
          notes: `Sincronizado vía Health Connect. Pasos: ${(healthData.stepsCount ?? metrics.steps).toLocaleString()} | Calorías: ${(healthData.calories ?? metrics.calories).toLocaleString()} kcal`
        });

        setSyncSuccess(true);
        showToast('Biometría importada desde Health Connect');
      }
    } catch (e: any) {
      showToast(e.message || 'Error de conexión');
    } finally {
      setIsSyncing(false);
    }
  };

  const simulateSync = () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    setTimeout(() => {
      addHealthLog({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        spO2Pct: metrics.spO2,
        heartRateBpm: metrics.heartRate,
        sleepHours: metrics.sleepHours,
        sleepQuality: metrics.sleepHours >= 7.5 ? 'excelente' : 'buena',
        steps: metrics.steps,
        calories: metrics.calories,
        energyLevel: 9,
        bloodPressureSys: 118,
        bloodPressureDia: 76,
        locationContext: 'mine_camp',
        notes: `Sincronizado vía Google Fit (simulado). Pasos: ${metrics.steps.toLocaleString()} | Calorías: ${metrics.calories} kcal`
      });
      setIsSyncing(false);
      setSyncSuccess(true);
      showToast('Biometría importada exitosamente');
    }, 1400);
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
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Google Fit</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Health Connect
                </span>
              </div>
              <h2 className="text-lg font-black text-white">Sincronización Google Fit</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5 text-emerald-300">
            <Sparkles className="w-4 h-4 text-emerald-400" /> Health Connect API
          </p>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Lee datos en tiempo real desde Health Connect. Compatible con Google Fit, Xiaomi Mi Fitness, Samsung Health y cualquier app que escriba en Health Connect.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center space-y-1">
            <Footprints className="w-4 h-4 text-emerald-400 mx-auto" />
            <p className="text-[10px] font-bold uppercase text-slate-400">Pasos Hoy</p>
            <p className="text-base font-black text-emerald-400">{metrics.steps.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center space-y-1">
            <Heart className="w-4 h-4 text-rose-400 mx-auto" />
            <p className="text-[10px] font-bold uppercase text-slate-400">Pulso Reposo</p>
            <p className="text-base font-black text-rose-400">{metrics.heartRate} BPM</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center space-y-1">
            <Activity className="w-4 h-4 text-cyan-400 mx-auto" />
            <p className="text-[10px] font-bold uppercase text-slate-400">SpO2</p>
            <p className="text-base font-black text-cyan-400">{metrics.spO2}%</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center space-y-1">
            <Moon className="w-4 h-4 text-indigo-400 mx-auto" />
            <p className="text-[10px] font-bold uppercase text-slate-400">Sueño</p>
            <p className="text-base font-black text-indigo-400">{metrics.sleepHours} hrs</p>
          </div>
          <div className="col-span-2 p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center flex items-center justify-around">
            <div className="text-center">
              <Flame className="w-4 h-4 text-amber-400 mx-auto" />
              <p className="text-[10px] font-bold uppercase text-slate-400">Calorías</p>
              <p className="text-base font-black text-amber-400">{metrics.calories} kcal</p>
            </div>
            <div className="text-center border-l border-slate-700 pl-4">
              <Zap className="w-4 h-4 text-emerald-400 mx-auto" />
              <p className="text-[10px] font-bold uppercase text-slate-400">Estado</p>
              <p className="text-xs font-black text-emerald-400">Conectado</p>
            </div>
          </div>
        </div>

        <button onClick={handleSyncHealthConnect} disabled={isSyncing}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
        >
          {isSyncing ? (
            <><RefreshCw className="w-4 h-4 animate-spin text-slate-950" /><span>Leyendo Health Connect...</span></>
          ) : (
            <><Activity className="w-4 h-4 text-slate-950" /><span>Sincronizar Datos de Health Connect</span></>
          )}
        </button>

        {syncSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>¡Datos importados y guardados en tu Ficha de Salud!</span>
          </div>
        )}

        <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>Health Connect API</span>
          <button onClick={onClose} className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold">Cerrar</button>
        </div>
      </div>
    </div>
  );
};
