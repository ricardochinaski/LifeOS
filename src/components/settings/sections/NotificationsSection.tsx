import React, { useState, useEffect } from 'react';
import { useLifeOS } from '../../../context/LifeOSContext';
import { APP_CONSTANTS, NotificationTypeId } from '../constants';
import { Bell, Calendar, Check, CheckCircle2, Volume2, VolumeX, Clock, Briefcase, Flame, Droplets, BookOpen, Receipt, HeartPulse } from 'lucide-react';
import { initNotificationChannels, requestNotificationPermission } from '../../../utils/notifications';

export const NotificationsSection: React.FC = () => {
  const { openNotificationsModal, shiftConfig, healthProfile } = useLifeOS();
  const [enabledNotifications, setEnabledNotifications] = useState<Record<NotificationTypeId, boolean>>({
    shift: true,
    habit: true,
    water: false,
    reading: false,
    budget: true,
    health: false,
  });
  const [notificationTimes, setNotificationTimes] = useState<Record<NotificationTypeId, string>>({
    shift: '08:00',
    habit: '20:00',
    water: '10:00',
    reading: '21:00',
    budget: '12:00',
    health: '07:00',
  });
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'blocked'>('unknown');

  useEffect(() => {
    const saved = localStorage.getItem('lifeos_notification_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setEnabledNotifications({ ...enabledNotifications, ...parsed.enabled });
        setNotificationTimes({ ...notificationTimes, ...parsed.times });
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const settings = {
      enabled: enabledNotifications,
      times: notificationTimes,
    };
    localStorage.setItem('lifeos_notification_settings', JSON.stringify(settings));
  }, [enabledNotifications, notificationTimes]);

  const toggleNotification = (id: NotificationTypeId) => {
    setEnabledNotifications(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const updateNotificationTime = (id: NotificationTypeId, time: string) => {
    setNotificationTimes(prev => ({
      ...prev,
      [id]: time,
    }));
  };

  const getNextNotificationTime = () => {
    const now = new Date();
    const laterToday = new Date(now);
    laterToday.setHours(0, 0, 0, 0);
    
    const notifications = APP_CONSTANTS.NOTIFICATION_TYPES.filter(n => enabledNotifications[n.id as NotificationTypeId]);
    const activeTimes = notifications.map(n => ({ ...n, time: notificationTimes[n.id as NotificationTypeId] }))
      .filter(n => n.time);

    if (activeTimes.length === 0) return null;

    const nextTime = activeTimes.reduce((earliest, current) => {
      const earliestDate = new Date(laterToday);
      const [h, m] = earliest.time.split(':').map(Number);
      earliestDate.setHours(h, m, 0, 0);
      
      const currentDate = new Date(laterToday);
      const [ch, cm] = current.time.split(':').map(Number);
      currentDate.setHours(ch, cm, 0, 0);

      return currentDate < earliestDate ? current : earliest;
    });

    const timeStr = nextTime.time;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const nextDate = new Date(laterToday);
    nextDate.setHours(hours, minutes, 0, 0);

    if (nextDate <= now) {
      nextDate.setDate(nextDate.getDate() + 1);
    }

    const diffTime = nextDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

    return {
      ...nextTime,
      hoursFromNow: diffHours,
      minutesFromNow: diffMinutes,
    };
  };

  const nextNotification = getNextNotificationTime();

  const enableNativeNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) await initNotificationChannels();
    setPermissionStatus(granted ? 'granted' : 'blocked');
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <Bell className="w-6 h-6 text-emerald-500" />
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Alertas & Notificaciones</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Recordatorios de turno, salud e hidratación en tu teléfono. {nextNotification && (
              <span>
                Próxima alerta: <strong className="text-emerald-400">{nextNotification.label}</strong> en {nextNotification.hoursFromNow}h {nextNotification.minutesFromNow}m
              </span>
            )}
          </p>
        </div>
      </div>

      <button
        onClick={openNotificationsModal}
        className="w-full p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-between transition-all cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <Clock className="w-5 h-5" /> Configurar Notificaciones y Recordatorios Completos
        </span>
        <span className="text-amber-400">⚙️</span>
      </button>

      <div className={`flex items-center justify-between gap-3 rounded-2xl border p-3 ${permissionStatus === 'granted' ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60'}`}>
        <div><p className="text-xs font-bold text-slate-800 dark:text-white">Permisos de Android</p><p className="text-[10px] text-slate-500">{permissionStatus === 'granted' ? 'Permiso concedido y canales configurados.' : permissionStatus === 'blocked' ? 'Permiso bloqueado. Actívalo en Ajustes del teléfono.' : 'Verifica que el sistema pueda mostrar las alertas.'}</p></div>
        <button onClick={enableNativeNotifications} className="rounded-xl bg-emerald-500 px-3 py-2 text-[10px] font-black text-slate-950">{permissionStatus === 'granted' ? 'Verificado' : 'Activar'}</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {APP_CONSTANTS.NOTIFICATION_TYPES.map((notif) => {
          const isEnabled = enabledNotifications[notif.id as NotificationTypeId];
          const time = notificationTimes[notif.id as NotificationTypeId];
          const iconMap = {
            shift: Briefcase,
            habit: Flame,
            water: Droplets,
            reading: BookOpen,
            budget: Receipt,
            health: HeartPulse,
          };
          const Icon = iconMap[notif.id as keyof typeof iconMap] || Bell;

          return (
            <div
              key={notif.id}
              className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                isEnabled
                  ? 'bg-emerald-500/10 border-emerald-500 shadow-md'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${
                    isEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`} />
                  <span className={`text-xs font-bold ${
                    isEnabled ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'
                  }`}>{notif.label}</span>
                </div>
                <button
                  onClick={() => toggleNotification(notif.id as NotificationTypeId)}
                  className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${
                    isEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <Clock className="w-3 h-3 text-slate-400" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => updateNotificationTime(notif.id as NotificationTypeId, e.target.value)}
                  disabled={!isEnabled}
                  className={`text-[10px] bg-transparent border-none text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded px-1 ${
                    !isEnabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-2">
        <p className="font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Funcionalidades Nativas Android
        </p>
        <p className="text-[11px] text-slate-300">
          Las alertas usan el sistema de notificaciones nativo de Android para recordatorios confiables,
          incluso cuando la app está cerrada. Usan baterías optimizadas y funcionan con WiFi/ datos móviles.
        </p>
      </div>
    </div>
  );
};
