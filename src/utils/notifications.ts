import { LocalNotifications, type ScheduleOptions, type Channel } from '@capacitor/local-notifications';
import { isNative } from '../lib/native';

const Importance = { None: 0, Min: 1, Low: 2, Default: 3, High: 4, Max: 5 } as const;
const Visibility = { Secret: -1, Private: 0, Public: 1 } as const;

export interface NotificationSettings {
  enabled: boolean;
  shiftAlerts: boolean;
  habitReminders: boolean;
  healthAlerts: boolean;
  reminderTime: string;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  shiftAlerts: true,
  habitReminders: true,
  healthAlerts: true,
  reminderTime: '08:00',
};

export const checkNotificationSupport = (): boolean => isNative();

export const getNotificationPermission = (): NotificationPermission => {
  if (!isNative()) return 'denied';
  return 'granted';
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNative()) return false;

  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export async function initNotificationChannels() {
  if (!isNative()) return;

  const channels: Channel[] = [
    {
      id: 'shift_alerts',
      name: 'Alertas de Turno 14x14',
      description: 'Notificaciones de cambio de turno minero',
      importance: Importance.High,
      visibility: Visibility.Public,
      sound: 'default',
    },
    {
      id: 'health_alerts',
      name: 'Alertas de Salud',
      description: 'Recordatorios de SpO2, hidratación y bienestar',
      importance: Importance.High,
      visibility: Visibility.Public,
      sound: 'default',
    },
    {
      id: 'habit_alerts',
      name: 'Recordatorios de Hábitos',
      description: 'Recordatorios diarios de hábitos',
      importance: Importance.Default,
      visibility: Visibility.Public,
      sound: 'default',
    },
  ];

  try {
    await LocalNotifications.createChannels({ channels });
  } catch (e) {
    console.error('Error creating channels:', e);
  }
}

export async function sendLocalNotification(title: string, body: string, channelId = 'shift_alerts', extra?: Record<string, any>) {
  if (!isNative()) return false;

  try {
    await LocalNotifications.schedule({
      notifications: [{
        id: Date.now(),
        title,
        body,
        channelId,
        extra,
        schedule: { at: new Date(Date.now() + 500) },
        sound: 'default',
        smallIcon: 'ic_stat_lifeos',
      }]
    });
    return true;
  } catch (e) {
    console.error('Notification error:', e);
    return false;
  }
}

export async function cancelAllNotifications() {
  if (!isNative()) return;
  try {
    await LocalNotifications.removeAllDeliveredNotifications();
  } catch (e) { /* ignore */ }
}

export async function scheduleShiftNotifications(shiftDay: number, isRestDay: boolean, workDays: number, restDays: number) {
  if (!isNative()) return;

  await cancelAllNotifications();

  const [hourStr, minStr] = (DEFAULT_NOTIFICATION_SETTINGS.reminderTime || '08:00').split(':');
  const hour = parseInt(hourStr) || 8;
  const minute = parseInt(minStr) || 0;

  // Next shift change notification
  const daysUntilNextShift = isRestDay ? restDays - shiftDay : workDays - shiftDay;
  const nextShiftDate = new Date();
  nextShiftDate.setDate(nextShiftDate.getDate() + daysUntilNextShift);
  nextShiftDate.setHours(hour, minute, 0, 0);

  const notifications: ScheduleOptions['notifications'] = [];

  // Shift change alert
  if (daysUntilNextShift > 0 && daysUntilNextShift <= restDays + workDays) {
    notifications.push({
      id: 1001,
      title: isRestDay ? 'Próximo ingreso a Faena' : 'Próximo Descanso',
      body: `En ${daysUntilNextShift} día(s) ${isRestDay ? 'comienza tu turno en faena ⛏️' : 'comienza tu descanso 🏠'}`,
      channelId: 'shift_alerts',
      schedule: { at: nextShiftDate },
      sound: 'default',
      smallIcon: 'ic_stat_lifeos',
    });
  }

  // Daily health check
  const healthTime = new Date();
  healthTime.setHours(hour, minute, 0, 0);
  if (healthTime <= new Date()) healthTime.setDate(healthTime.getDate() + 1);

  notifications.push({
    id: 2001,
    title: 'Control de Salud en Altura',
    body: 'Mide tu SpO2, presión y pulso. Hidrátate con 3.5L de agua hoy.',
    channelId: 'health_alerts',
    schedule: { at: healthTime, repeats: true, every: 'day' },
    sound: 'default',
    smallIcon: 'ic_stat_lifeos',
  });

  // Midday hydration reminder
  const hydrationTime = new Date();
  hydrationTime.setHours(13, 0, 0, 0);
  if (hydrationTime <= new Date()) hydrationTime.setDate(hydrationTime.getDate() + 1);

  notifications.push({
    id: 2002,
    title: 'Hidratación',
    body: 'Has tomado suficiente agua? Lleva al menos 2L en lo que va del día.',
    channelId: 'health_alerts',
    schedule: { at: hydrationTime, repeats: true, every: 'day' },
    sound: 'default',
    smallIcon: 'ic_stat_lifeos',
  });

  if (notifications.length > 0) {
    try {
      await LocalNotifications.schedule({ notifications });
    } catch (e) {
      console.error('Error scheduling:', e);
    }
  }
}
