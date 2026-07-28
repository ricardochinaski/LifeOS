import React, { useState, useEffect } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import {
  requestNotificationPermission,
  getNotificationPermission,
  sendLocalNotification,
  scheduleShiftNotifications,
  initNotificationChannels,
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS
} from '../../utils/notifications';
import { isNative } from '../../lib/native';
import {
  Bell,
  BellRing,
  CheckCircle2,
  X,
  ShieldCheck,
  AlertTriangle,
  Clock,
  HeartPulse,
  Briefcase,
  Sparkles
} from 'lucide-react';

interface PushNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PushNotificationsModal: React.FC<PushNotificationsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { showToast, shiftInfo, shiftConfig } = useLifeOS();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPermission(getNotificationPermission());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnableNotifications = async () => {
    setIsProcessing(true);
    try {
      const granted = await requestNotificationPermission();
      setPermission(getNotificationPermission());
      if (granted) {
        setSettings(prev => ({ ...prev, enabled: true }));
        await initNotificationChannels();
        await scheduleShiftNotifications(
          shiftInfo.dayInPhase,
          shiftInfo.phase === 'rest',
          shiftConfig.workDays,
          shiftConfig.restDays
        );
        await sendLocalNotification(
          'Notificaciones Activadas',
          'Recibirás recordatorios de turnos 14x14, SpO2 e hidratación.'
        );
        showToast('Notificaciones activadas. Recibirás alertas diarias.');
      } else {
        showToast('Debes permitir las notificaciones para recibir alertas.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestNotification = async () => {
    if (!isNative()) {
      showToast('Notificaciones solo disponibles en Android.');
      return;
    }
    setIsProcessing(true);
    try {
      const ok = await sendLocalNotification(
        'Alerta de Salud en Altura',
        'Mide tu SpO2 y toma 3.5L de agua hoy.',
        'health_alerts'
      );
      showToast(ok ? 'Notificación de prueba enviada' : 'Error al enviar notificación');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScheduleReminders = async () => {
    if (!isNative()) return;
    setIsProcessing(true);
    try {
      await initNotificationChannels();
      await scheduleShiftNotifications(
        shiftInfo.dayInPhase,
        shiftInfo.phase === 'rest',
        shiftConfig.workDays,
        shiftConfig.restDays
      );
      showToast('Recordatorios programados.');
    } finally {
      setIsProcessing(false);
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
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <BellRing className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                  Alertas LifeOS
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  permission === 'granted'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {permission === 'granted' ? 'Activo' : 'Requiere Permiso'}
                </span>
              </div>
              <h2 className="text-lg font-black text-white">Notificaciones Push</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5 text-amber-300">
            <Sparkles className="w-4 h-4 text-amber-400" /> Notificaciones Nativas Android
          </p>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Alertas directas en tu teléfono. Recordatorios de turno 14x14, chequeo de SpO2, hidratación y hábitos diarios.
          </p>
        </div>

        {permission !== 'granted' ? (
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs font-medium">
                Las notificaciones están desactivadas.
              </p>
            </div>

            <button
              onClick={handleEnableNotifications}
              disabled={isProcessing}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Bell className="w-4 h-4 text-slate-950" />
              <span>Activar Notificaciones</span>
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Notificaciones Activas</span>
              </div>
              <button
                onClick={handleTestNotification}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold"
              >
                Probar
              </button>
            </div>
            <button
              onClick={handleScheduleReminders}
              disabled={isProcessing}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold flex items-center justify-center gap-2"
            >
              <Clock className="w-3.5 h-3.5" />
              Programar Recordatorios Diarios
            </button>
          </div>
        )}

        <div className="space-y-3 text-xs">
          <label className="font-bold uppercase tracking-wider text-slate-400">Alertas Programadas</label>
          
          <div className="space-y-2">
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-4 h-4 text-blue-400" />
                <div>
                  <p className="font-bold text-white">Cambio de Turno 14x14</p>
                  <p className="text-[10px] text-slate-400">Aviso 24h antes de cambio faena/descanso</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.shiftAlerts}
                onChange={e => setSettings(prev => ({ ...prev, shiftAlerts: e.target.checked }))}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <HeartPulse className="w-4 h-4 text-rose-400" />
                <div>
                  <p className="font-bold text-white">SpO2 y Signos Vitales</p>
                  <p className="text-[10px] text-slate-400">Recordatorio diario 8 AM + hidratación 1 PM</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.healthAlerts}
                onChange={e => setSettings(prev => ({ ...prev, healthAlerts: e.target.checked }))}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="font-bold text-white">Hábitos Diarios</p>
                  <p className="text-[10px] text-slate-400">Recordatorio a las {settings.reminderTime} hrs</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.habitReminders}
                onChange={e => setSettings(prev => ({ ...prev, habitReminders: e.target.checked }))}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>Local Notifications API</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
