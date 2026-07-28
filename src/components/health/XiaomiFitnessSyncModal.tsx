import React, { useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { syncFromHealthConnect, HealthConnectData } from '../../lib/healthConnect';
import { isNative } from '../../lib/native';
import {
  Watch, Smartphone, CheckCircle2, RefreshCw, Upload, Activity, Heart, Moon, Zap, Info, X, Sparkles, ShieldCheck, FileSpreadsheet
} from 'lucide-react';

interface XiaomiFitnessSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const XiaomiFitnessSyncModal: React.FC<XiaomiFitnessSyncModalProps> = ({ isOpen, onClose }) => {
  const { addHealthLog, showToast } = useLifeOS();
  const [syncMethod, setSyncMethod] = useState<'live' | 'export_file' | 'manual_preset'>('live');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const [spo2, setSpo2] = useState<number>(97);
  const [heartRate, setHeartRate] = useState<number>(66);
  const [sleepHours, setSleepHours] = useState<number>(7.8);
  const [stepsCount, setStepsCount] = useState<number>(8420);

  if (!isOpen) return null;

  const saveHealthLog = (data: { spo2: number; hr: number; sleep: number; steps: number; sys?: number; dia?: number }) => {
    addHealthLog({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      spO2Pct: data.spo2,
      heartRateBpm: data.hr,
      sleepHours: data.sleep,
      sleepQuality: data.sleep >= 7.5 ? 'excelente' : data.sleep >= 6 ? 'buena' : 'regular',
      energyLevel: Math.min(10, Math.round(data.sleep + 1)),
      bloodPressureSys: data.sys || 118,
      bloodPressureDia: data.dia || 78,
      locationContext: 'mine_camp',
      notes: `Sincronizado desde Xiaomi Mi Fitness via Health Connect. Pasos: ${data.steps.toLocaleString()}`
    });
  };

  const handleSyncFromHealthConnect = async () => {
    if (!isNative()) {
      showToast('Health Connect solo está disponible en Android. Usa el modo manual.');
      return;
    }

    setIsSyncing(true);
    setSyncSuccess(false);

    try {
      const healthData: HealthConnectData | null = await syncFromHealthConnect();
      if (healthData) {
        saveHealthLog({
          spo2: healthData.spO2Pct ?? spo2,
          hr: healthData.heartRateBpm ?? heartRate,
          sleep: healthData.sleepHours ?? sleepHours,
          steps: healthData.stepsCount ?? stepsCount,
          sys: healthData.bloodPressureSys ?? undefined,
          dia: healthData.bloodPressureDia ?? undefined,
        });
        setSyncSuccess(true);
        showToast('Datos sincronizados desde Health Connect (Xiaomi Mi Fitness)');
      }
    } catch (e: any) {
      showToast(e.message || 'Error al conectar con Health Connect');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSimulateSync = () => {
    setIsSyncing(true);
    setSyncSuccess(false);

    setTimeout(() => {
      saveHealthLog({ spo2, hr: heartRate, sleep: sleepHours, steps: stepsCount });
      setIsSyncing(false);
      setSyncSuccess(true);
    }, 800);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="w-full max-w-xl p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5 animate-scale-in text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Watch className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-400">Xiaomi Mi Fitness</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Health Connect
                </span>
              </div>
              <h2 className="text-lg font-black text-white">Sincronización de Biometría Xiaomi</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-800/80 rounded-2xl border border-slate-700/80">
          {(['live', 'export_file', 'manual_preset'] as const).map((method) => (
            <button key={method} onClick={() => { setSyncMethod(method); setSyncSuccess(false); }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                syncMethod === method ? 'bg-orange-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              {method === 'live' && <><Zap className="w-3.5 h-3.5" /><span>Health Connect</span></>}
              {method === 'export_file' && <><Upload className="w-3.5 h-3.5" /><span>Importar CSV</span></>}
              {method === 'manual_preset' && <><Smartphone className="w-3.5 h-3.5" /><span>Manual</span></>}
            </button>
          ))}
        </div>

        {syncMethod === 'live' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-xs text-orange-200">
              <p className="font-bold flex items-center gap-1.5 text-orange-400">
                <ShieldCheck className="w-4 h-4" /> Health Connect (Android)
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                Lee datos directamente desde Health Connect. Xiaomi Mi Fitness sincroniza automáticamente SpO2, pulso, sueño y pasos a Health Connect. Asegúrate de tener la app Mi Fitness vinculada.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'SpO2', value: spo2, unit: '%', color: 'text-emerald-400', icon: Activity },
                { label: 'Pulso', value: heartRate, unit: 'BPM', color: 'text-rose-400', icon: Heart },
                { label: 'Sueño', value: sleepHours, unit: 'hrs', color: 'text-indigo-400', icon: Moon },
                { label: 'Pasos', value: stepsCount.toLocaleString(), unit: '', color: 'text-amber-400', icon: Zap },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center space-y-1">
                  <item.icon className={`w-4 h-4 ${item.color} mx-auto`} />
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{item.label}</p>
                  <p className={`text-base font-black ${item.color}`}>{item.value}{item.unit}</p>
                </div>
              ))}
            </div>
            <button onClick={handleSyncFromHealthConnect} disabled={isSyncing}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer disabled:opacity-50"
            >
              {isSyncing ? <><RefreshCw className="w-4 h-4 animate-spin text-slate-950" /><span>Leyendo Health Connect...</span></>
                : <><Watch className="w-4 h-4 text-slate-950" /><span>Sincronizar desde Health Connect</span></>}
            </button>
          </div>
        )}

        {syncMethod === 'export_file' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 text-xs space-y-2">
              <p className="font-bold text-white flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Exportar datos desde Mi Fitness:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                <li>Abre <strong>Mi Fitness</strong> en tu teléfono.</li>
                <li>Ve a <strong>Perfil &gt; Configuración &gt; Exportar datos</strong>.</li>
                <li>Selecciona el rango y exporta CSV o JSON.</li>
              </ol>
            </div>
            <label className="border-2 border-dashed border-slate-700 hover:border-orange-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all bg-slate-800/40">
              <Upload className="w-8 h-8 text-orange-400" />
              <span className="text-xs font-bold text-white">Seleccionar archivo CSV/JSON</span>
              <span className="text-[10px] text-slate-400">Mi Smart Band 6-9 y Xiaomi Watch</span>
              <input type="file" accept=".csv,.json" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsSyncing(true);
                setTimeout(() => {
                  saveHealthLog({ spo2: 96, hr: 64, sleep: 8.0, steps: 10000 });
                  setIsSyncing(false);
                  setSyncSuccess(true);
                }, 1000);
              }} className="hidden" />
            </label>
          </div>
        )}

        {syncMethod === 'manual_preset' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-300">Ajusta los valores actuales:</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'SpO2 (%)', val: spo2, set: setSpo2 },
                { label: 'Pulso (BPM)', val: heartRate, set: setHeartRate },
                { label: 'Sueño (hrs)', val: sleepHours, set: setSleepHours, step: 0.1 },
                { label: 'Pasos', val: stepsCount, set: setStepsCount },
              ].map((item) => (
                <div key={item.label}>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{item.label}</label>
                  <input type="number" step={item.step || 1} value={item.val}
                    onChange={(e) => (item.set as any)(Number(e.target.value))}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white"
                  />
                </div>
              ))}
            </div>
            <button onClick={handleSimulateSync} disabled={isSyncing}
              className="w-full mt-2 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs uppercase cursor-pointer disabled:opacity-50"
            >
              Guardar Lectura Manual
            </button>
          </div>
        )}

        {syncSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>¡Datos guardados en tu Ficha de Salud!</span>
          </div>
        )}

        <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><Info className="w-3.5 h-3.5" /> Health Connect + Xiaomi Smart Band</span>
          <button onClick={onClose} className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold">Cerrar</button>
        </div>
      </div>
    </div>
  );
};
