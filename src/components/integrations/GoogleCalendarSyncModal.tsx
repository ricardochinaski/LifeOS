import React, { useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { syncCalendarWithGoogleCalendar, generateShiftEvents } from '../../lib/calendarSync';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  RefreshCw,
  Zap,
  X,
  ExternalLink,
  ShieldCheck,
  Clock,
  Briefcase,
  CheckSquare,
} from 'lucide-react';

interface GoogleCalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleCalendarSyncModal: React.FC<GoogleCalendarSyncModalProps> = ({
  isOpen,
  onClose
}) => {
  const { shiftConfig, tasks, showToast } = useLifeOS();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncType, setSyncType] = useState<'shifts' | 'tasks' | 'all'>('all');
  const [syncedEventsCount, setSyncedEventsCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSyncToGoogleCalendar = async () => {
    setIsSyncing(true);
    setSyncedEventsCount(null);

    try {
      const result = await syncCalendarWithGoogleCalendar(shiftConfig);
      setSyncedEventsCount(result.eventsSynced);
      showToast(result.message);
    } catch (err) {
      console.error('Calendar sync error:', err);
      showToast('Error al conectar con Google Calendar.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5 text-white animate-scale-in">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400">
                  Google Workspace
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Health Connect
                </span>
              </div>
              <h2 className="text-lg font-black text-white">Sincronización Google Calendar</h2>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 space-y-2">
          <p className="font-bold text-blue-300 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-blue-400" /> Google Calendar API
          </p>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Crea automáticamente tus eventos de turno {shiftConfig.workDays}x{shiftConfig.restDays} en Google Calendar. Al sincronizar se te pedirá permiso para acceder a tu calendario.
          </p>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">¿Qué deseas sincronizar?</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setSyncType('all')}
              className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 text-center cursor-pointer ${
                syncType === 'all'
                  ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Turnos + Tareas</span>
            </button>
            <button
              onClick={() => setSyncType('shifts')}
              className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 text-center cursor-pointer ${
                syncType === 'shifts'
                  ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Rotación Turno</span>
            </button>
            <button
              onClick={() => setSyncType('tasks')}
              className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 text-center cursor-pointer ${
                syncType === 'tasks'
                  ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Tareas Pendientes</span>
            </button>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-xs space-y-2">
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-400" /> Eventos del ciclo actual:</span>
            <span className="font-bold text-white">{generateShiftEvents(shiftConfig).length} días</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> Tareas con vencimiento:</span>
            <span className="font-bold text-white">{tasks.filter(t => t.dueDate).length} tareas</span>
          </div>
        </div>

        <button
          onClick={handleSyncToGoogleCalendar}
          disabled={isSyncing}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 cursor-pointer disabled:opacity-50"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Conectando con Google Calendar API...</span>
            </>
          ) : (
            <>
              <CalendarIcon className="w-4 h-4" />
              <span>Sincronizar con Google Calendar Ahora</span>
            </>
          )}
        </button>

        {syncedEventsCount !== null && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>¡Se agregaron {syncedEventsCount} eventos a tu Google Calendar exitosamente!</span>
          </div>
        )}

        <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-400">
          <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
            Abrir Google Calendar <ExternalLink className="w-3 h-3" />
          </a>
          <button onClick={onClose} className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
