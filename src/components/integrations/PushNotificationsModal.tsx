import React, { useEffect, useMemo, useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { buildDailyAutomationPlan, DEFAULT_DAILY_AUTOMATION_SETTINGS, type DailyAutomationSettings } from '../../lib/dailyAutomation';
import { isNative } from '../../lib/native';
import {
  cancelDailyAutomationNotifications,
  getNotificationPermissionAsync,
  initNotificationChannels,
  loadDailyAutomationSettings,
  requestNotificationPermission,
  saveDailyAutomationSettings,
  sendLocalNotification,
  syncDailyAutomationNotifications,
} from '../../utils/notifications';
import {
  Bell,
  BellOff,
  BellRing,
  CheckCircle2,
  CheckSquare,
  Clock3,
  Flame,
  MoonStar,
  RefreshCw,
  ShieldCheck,
  Sunrise,
  SunMedium,
  X,
} from 'lucide-react';

interface PushNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PushNotificationsModal: React.FC<PushNotificationsModalProps> = ({ isOpen, onClose }) => {
  const { showToast, tasks, habits, habitLogs, shiftConfig } = useLifeOS();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState<DailyAutomationSettings>(DEFAULT_DAILY_AUTOMATION_SETTINGS);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([getNotificationPermissionAsync(), loadDailyAutomationSettings()])
      .then(([permissionState, savedSettings]) => {
        setPermission(permissionState);
        setSettings(savedSettings);
      })
      .catch(() => undefined);
  }, [isOpen]);

  const preview = useMemo(() => buildDailyAutomationPlan({
    tasks,
    habits,
    habitLogs,
    shiftConfig,
    settings: { ...settings, enabled: true },
  }).slice(0, 4), [tasks, habits, habitLogs, shiftConfig, settings]);

  if (!isOpen) return null;

  const syncNow = async (nextSettings = settings) => {
    const result = await syncDailyAutomationNotifications({
      tasks,
      habits,
      habitLogs,
      shiftConfig,
      settings: nextSettings,
    });
    return result.scheduled;
  };

  const persist = async (next: DailyAutomationSettings, reschedule = true) => {
    setSettings(next);
    const saved = await saveDailyAutomationSettings(next);
    setSettings(saved);
    if (reschedule && saved.enabled) await syncNow(saved);
    return saved;
  };

  const handleEnable = async () => {
    if (!isNative()) {
      showToast('La automatización de notificaciones está disponible en la app Android.');
      return;
    }
    setIsProcessing(true);
    try {
      const granted = await requestNotificationPermission();
      setPermission(await getNotificationPermissionAsync());
      if (!granted) {
        showToast('Android debe permitir notificaciones para activar el Daily Plan.');
        return;
      }
      await initNotificationChannels();
      const next = await persist({ ...settings, enabled: true }, false);
      const scheduled = await syncNow(next);
      showToast(`Automatización diaria activada: ${scheduled} recordatorios preparados.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisable = async () => {
    setIsProcessing(true);
    try {
      await persist({ ...settings, enabled: false }, false);
      await cancelDailyAutomationNotifications();
      showToast('Automatización diaria desactivada.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = async () => {
    setIsProcessing(true);
    try {
      const saved = await persist(settings, false);
      const scheduled = saved.enabled ? await syncNow(saved) : 0;
      showToast(saved.enabled ? `${scheduled} recordatorios diarios actualizados.` : 'Horarios guardados. Activa la automatización cuando quieras.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTest = async () => {
    setIsProcessing(true);
    try {
      const ok = await sendLocalNotification(
        'LifeOS Daily Plan',
        'Notificación de prueba. Tus recordatorios se construyen con tus tareas, hábitos y turno configurados.',
        'daily_plan',
        { lifeosAutomationTest: true, targetTab: 'dashboard' },
      );
      showToast(ok ? 'Notificación de prueba enviada.' : 'No se pudo enviar la notificación de prueba.');
    } finally {
      setIsProcessing(false);
    }
  };

  const update = <K extends keyof DailyAutomationSettings>(key: K, value: DailyAutomationSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const slotRow = (
    icon: React.ReactNode,
    title: string,
    description: string,
    enabledKey: 'morningEnabled' | 'middayEnabled' | 'eveningEnabled',
    timeKey: 'morningTime' | 'middayTime' | 'eveningTime',
  ) => (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-800/60 p-3">
      <div className="rounded-xl bg-slate-900 p-2 text-emerald-300">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-white">{title}</p>
        <p className="text-[10px] leading-relaxed text-slate-400">{description}</p>
      </div>
      <input
        type="time"
        value={settings[timeKey]}
        disabled={!settings[enabledKey]}
        onChange={(event) => update(timeKey, event.target.value)}
        className="w-[92px] rounded-xl border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white disabled:opacity-40"
      />
      <input
        type="checkbox"
        checked={settings[enabledKey]}
        onChange={(event) => update(enabledKey, event.target.checked)}
        className="h-4 w-4 accent-emerald-500"
      />
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-md"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="w-full max-w-lg space-y-5 rounded-3xl border border-slate-800 bg-slate-900 p-5 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/15 p-3 text-emerald-300">
              <BellRing className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Fase 4.4</span>
              <h2 className="text-lg font-black">Automatización diaria</h2>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <div>
                <p className="text-xs font-bold">Automatización local y contextual</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                  LifeOS prepara un horizonte móvil de 7 días y lo recalcula cuando cambian tus tareas, hábitos o turno. No inventa biometría ni objetivos de salud.
                </p>
              </div>
            </div>
            <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${permission === 'granted' ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300' : 'border-amber-500/30 bg-amber-500/15 text-amber-300'}`}>
              {permission === 'granted' ? 'Permiso OK' : 'Sin permiso'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {settings.enabled ? (
            <button onClick={handleDisable} disabled={isProcessing} className="flex items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 py-3 text-xs font-black text-rose-300">
              <BellOff className="h-4 w-4" /> Desactivar
            </button>
          ) : (
            <button onClick={handleEnable} disabled={isProcessing} className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3 text-xs font-black text-slate-950">
              <Bell className="h-4 w-4" /> Activar
            </button>
          )}
          <button onClick={handleTest} disabled={isProcessing || permission !== 'granted'} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 py-3 text-xs font-bold text-white disabled:opacity-40">
            <BellRing className="h-4 w-4" /> Probar
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Ritmo diario</p>
          {slotRow(<Sunrise className="h-4 w-4" />, 'Inicio del día', 'Turno actual, atrasos y primera prioridad.', 'morningEnabled', 'morningTime')}
          {slotRow(<SunMedium className="h-4 w-4" />, 'Chequeo de foco', 'Tareas prioritarias y hábitos previstos aún por revisar.', 'middayEnabled', 'middayTime')}
          {slotRow(<MoonStar className="h-4 w-4" />, 'Cierre y preparación', 'Cierre del día y primera prioridad del día siguiente.', 'eveningEnabled', 'eveningTime')}

          <div className="flex items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-800/60 p-3">
            <div className="rounded-xl bg-slate-900 p-2 text-amber-300"><Clock3 className="h-4 w-4" /></div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold">Cambio Faena / Descanso</p>
              <p className="text-[10px] text-slate-400">Aviso solo cuando el día siguiente cambia de fase.</p>
            </div>
            <input type="time" value={settings.shiftAlertTime} disabled={!settings.shiftChangeAlerts} onChange={(event) => update('shiftAlertTime', event.target.value)} className="w-[92px] rounded-xl border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white disabled:opacity-40" />
            <input type="checkbox" checked={settings.shiftChangeAlerts} onChange={(event) => update('shiftChangeAlerts', event.target.checked)} className="h-4 w-4 accent-amber-500" />
          </div>
        </div>

        <button onClick={handleApply} disabled={isProcessing} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3 text-xs font-black text-slate-950 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} /> Guardar y recalcular
        </button>

        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Próximos recordatorios</p>
          {preview.length === 0 ? (
            <p className="rounded-2xl bg-slate-800/50 p-3 text-[11px] text-slate-400">No hay recordatorios futuros dentro del horizonte actual.</p>
          ) : preview.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-800/50 px-3 py-2.5 text-xs">
              <div className="min-w-0">
                <p className="truncate font-bold text-white">{item.title}</p>
                <p className="truncate text-[10px] text-slate-400">{item.body}</p>
              </div>
              <span className="shrink-0 text-[10px] font-bold text-emerald-300">{item.date.slice(5)} · {item.time}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-4 text-xs">
          <div>
            <p className="mb-2 flex items-center gap-1.5 font-bold text-slate-300"><CheckSquare className="h-4 w-4 text-sky-400" /> Tareas con alarma</p>
            <p className="text-[11px] text-slate-500">{tasks.filter((task) => task.notifyAt && task.status !== 'completed').length} configuradas</p>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-1.5 font-bold text-slate-300"><Flame className="h-4 w-4 text-orange-400" /> Hábitos con alarma</p>
            <p className="text-[11px] text-slate-500">{habits.filter((habit) => habit.notifyAt).length} configurados</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>{isNative() ? 'Android · Local Notifications' : 'Vista web · configuración disponible en Android'}</span>
          {settings.enabled && <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Activa</span>}
        </div>
      </div>
    </div>
  );
};
