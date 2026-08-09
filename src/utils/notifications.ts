import { LocalNotifications, type ScheduleOptions, type Channel } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';
import { isNative } from '../lib/native';
import {
  buildDailyAutomationPlan,
  DEFAULT_DAILY_AUTOMATION_SETTINGS,
  normalizeDailyAutomationSettings,
  type DailyAutomationSettings,
} from '../lib/dailyAutomation';
import type { Habit, HabitLog, ShiftConfig, Task } from '../types';

const Importance = { None: 0, Min: 1, Low: 2, Default: 3, High: 4, Max: 5 } as const;
const Visibility = { Secret: -1, Private: 0, Public: 1 } as const;
const AUTOMATION_SETTINGS_KEY = 'lifeos_daily_automation_v1';
const AUTOMATION_ID_MIN = 700_000_000;
const AUTOMATION_ID_MAX = 1_799_999_999;
const LEGACY_SYSTEM_NOTIFICATION_IDS = new Set([1001, 2001, 2002]);

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

let cachedPermission: NotificationPermission = 'default';

export const checkNotificationSupport = (): boolean => isNative();
export const getNotificationPermission = (): NotificationPermission => isNative() ? cachedPermission : 'denied';

export const getNotificationPermissionAsync = async (): Promise<NotificationPermission> => {
  if (!isNative()) return 'denied';
  try {
    const result = await LocalNotifications.checkPermissions();
    cachedPermission = result.display === 'granted' ? 'granted' : result.display === 'denied' ? 'denied' : 'default';
    return cachedPermission;
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return 'default';
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNative()) return false;
  try {
    const result = await LocalNotifications.requestPermissions();
    cachedPermission = result.display === 'granted' ? 'granted' : result.display === 'denied' ? 'denied' : 'default';
    return cachedPermission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export async function loadDailyAutomationSettings(): Promise<DailyAutomationSettings> {
  try {
    const { value } = await Preferences.get({ key: AUTOMATION_SETTINGS_KEY });
    if (!value) return DEFAULT_DAILY_AUTOMATION_SETTINGS;
    return normalizeDailyAutomationSettings(JSON.parse(value));
  } catch {
    return DEFAULT_DAILY_AUTOMATION_SETTINGS;
  }
}

export async function saveDailyAutomationSettings(
  partial: Partial<DailyAutomationSettings>,
): Promise<DailyAutomationSettings> {
  const current = await loadDailyAutomationSettings();
  const next = normalizeDailyAutomationSettings({ ...current, ...partial });
  await Preferences.set({ key: AUTOMATION_SETTINGS_KEY, value: JSON.stringify(next) });
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('lifeos:daily-automation-changed'));
  return next;
}

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
      name: 'Recordatorios de Salud',
      description: 'Recordatorios para registrar bienestar y objetivos personales',
      importance: Importance.Default,
      visibility: Visibility.Public,
      sound: 'default',
    },
    {
      id: 'habit_alerts',
      name: 'Recordatorios de Hábitos',
      description: 'Recordatorios configurados para hábitos y tareas',
      importance: Importance.Default,
      visibility: Visibility.Public,
      sound: 'default',
    },
    {
      id: 'daily_plan',
      name: 'LifeOS Daily Plan',
      description: 'Inicio del día, chequeo de foco y cierre diario',
      importance: Importance.Default,
      visibility: Visibility.Public,
      sound: 'default',
    },
  ];

  try {
    await Promise.all(channels.map((channel) => LocalNotifications.createChannel(channel)));
  } catch (error) {
    console.error('Error creating channels:', error);
  }
}

export async function sendLocalNotification(
  title: string,
  body: string,
  channelId = 'shift_alerts',
  extra?: Record<string, any>,
) {
  if (!isNative()) return false;
  try {
    await LocalNotifications.schedule({
      notifications: [{
        id: Math.floor(Date.now() % 2_000_000_000),
        title,
        body,
        channelId,
        extra,
        schedule: { at: new Date(Date.now() + 500) },
        sound: 'default',
        smallIcon: 'ic_stat_lifeos',
      }],
    });
    return true;
  } catch (error) {
    console.error('Notification error:', error);
    return false;
  }
}

async function cancelPendingWhere(predicate: (id: number, extra: any) => boolean) {
  if (!isNative()) return;
  try {
    const pending = await LocalNotifications.getPending();
    const notifications = pending.notifications
      .filter((item) => predicate(item.id, item.extra))
      .map((item) => ({ id: item.id }));
    if (notifications.length > 0) await LocalNotifications.cancel({ notifications });
  } catch (error) {
    console.error('Error cancelling pending notifications:', error);
  }
}

export async function cancelAllNotifications() {
  if (!isNative()) return;
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications.map((item) => ({ id: item.id })) });
    }
    await LocalNotifications.removeAllDeliveredNotifications();
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
}

export async function cancelDailyAutomationNotifications() {
  await cancelPendingWhere((id, extra) =>
    extra?.lifeosAutomation === true || (id >= AUTOMATION_ID_MIN && id <= AUTOMATION_ID_MAX));
}

async function cancelLegacySystemNotifications() {
  await cancelPendingWhere((id) => LEGACY_SYSTEM_NOTIFICATION_IDS.has(id));
}

export async function syncDailyAutomationNotifications(input: {
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog[];
  shiftConfig: ShiftConfig;
  settings?: Partial<DailyAutomationSettings>;
  now?: Date;
}): Promise<{ scheduled: number; permission: NotificationPermission }> {
  if (!isNative()) return { scheduled: 0, permission: 'denied' };

  // Migrate away any system reminders scheduled by pre-4.4 builds before the
  // idempotent Daily Plan IDs existed. This does not touch task/habit alarms.
  await cancelLegacySystemNotifications();

  const permission = await getNotificationPermissionAsync();
  if (permission !== 'granted') return { scheduled: 0, permission };

  const settings = normalizeDailyAutomationSettings(input.settings ?? await loadDailyAutomationSettings());
  await initNotificationChannels();
  await cancelDailyAutomationNotifications();
  if (!settings.enabled) return { scheduled: 0, permission };

  const plan = buildDailyAutomationPlan({ ...input, settings });
  if (plan.length === 0) return { scheduled: 0, permission };

  await LocalNotifications.schedule({
    notifications: plan.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      channelId: item.channelId,
      extra: item.extra,
      schedule: { at: item.scheduledAt },
      sound: 'default',
      smallIcon: 'ic_stat_lifeos',
    })),
  });
  return { scheduled: plan.length, permission };
}

export async function scheduleHabitNotifications(habits: { title: string; notifyAt?: string }[]) {
  if (!isNative()) return;
  const notifications: ScheduleOptions['notifications'] = [];
  let id = 3000;
  for (const habit of habits) {
    if (!habit.notifyAt) continue;
    const [hour, minute] = habit.notifyAt.split(':').map(Number);
    if (Number.isNaN(hour) || Number.isNaN(minute)) continue;
    const time = new Date();
    time.setHours(hour, minute, 0, 0);
    if (time <= new Date()) time.setDate(time.getDate() + 1);
    notifications.push({
      id: id++,
      title: 'Recordatorio de Hábito',
      body: `No olvides: ${habit.title}`,
      channelId: 'habit_alerts',
      schedule: { at: time, repeats: true, every: 'day' },
      sound: 'default',
      smallIcon: 'ic_stat_lifeos',
    });
  }
  if (notifications.length > 0) {
    try { await LocalNotifications.schedule({ notifications }); }
    catch (error) { console.error('Error scheduling habit notifications:', error); }
  }
}

export async function scheduleTaskNotifications(tasks: { title: string; notifyAt?: string; dueDate?: string }[]) {
  if (!isNative()) return;
  const notifications: ScheduleOptions['notifications'] = [];
  let id = 5000;
  for (const task of tasks) {
    if (!task.notifyAt) continue;
    const [hour, minute] = task.notifyAt.split(':').map(Number);
    if (Number.isNaN(hour) || Number.isNaN(minute)) continue;
    const time = task.dueDate ? new Date(`${task.dueDate}T00:00:00`) : new Date();
    time.setHours(hour, minute, 0, 0);
    if (time <= new Date()) continue;
    notifications.push({
      id: id++,
      title: 'Recordatorio de Tarea',
      body: `Tarea pendiente: ${task.title}`,
      channelId: 'habit_alerts',
      schedule: { at: time },
      sound: 'default',
      smallIcon: 'ic_stat_lifeos',
    });
  }
  if (notifications.length > 0) {
    try { await LocalNotifications.schedule({ notifications }); }
    catch (error) { console.error('Error scheduling task notifications:', error); }
  }
}

export async function scheduleShiftNotifications(
  shiftDay: number,
  isRestDay: boolean,
  workDays: number,
  restDays: number,
) {
  if (!isNative()) return;

  await cancelPendingWhere((id) => id >= 1000 && id < 3000);

  const [hourStr, minuteStr] = DEFAULT_NOTIFICATION_SETTINGS.reminderTime.split(':');
  const hour = Number(hourStr) || 8;
  const minute = Number(minuteStr) || 0;
  const daysUntilNextShift = isRestDay ? restDays - shiftDay : workDays - shiftDay;
  const notifications: ScheduleOptions['notifications'] = [];

  if (daysUntilNextShift > 0 && daysUntilNextShift <= restDays + workDays) {
    const nextShiftDate = new Date();
    nextShiftDate.setDate(nextShiftDate.getDate() + daysUntilNextShift);
    nextShiftDate.setHours(hour, minute, 0, 0);
    notifications.push({
      id: 1001,
      title: isRestDay ? 'Próximo ingreso a Faena' : 'Próximo Descanso',
      body: `En ${daysUntilNextShift} día(s) ${isRestDay ? 'comienza tu turno en faena' : 'comienza tu descanso'}.`,
      channelId: 'shift_alerts',
      schedule: { at: nextShiftDate },
      sound: 'default',
      smallIcon: 'ic_stat_lifeos',
    });
  }

  const healthTime = new Date();
  healthTime.setHours(hour, minute, 0, 0);
  if (healthTime <= new Date()) healthTime.setDate(healthTime.getDate() + 1);
  notifications.push({
    id: 2001,
    title: 'Registro de bienestar',
    body: 'Si corresponde a tu rutina, registra tus mediciones reales y cómo te sientes en Salud.',
    channelId: 'health_alerts',
    schedule: { at: healthTime, repeats: true, every: 'day' },
    sound: 'default',
    smallIcon: 'ic_stat_lifeos',
  });

  const hydrationTime = new Date();
  hydrationTime.setHours(13, 0, 0, 0);
  if (hydrationTime <= new Date()) hydrationTime.setDate(hydrationTime.getDate() + 1);
  notifications.push({
    id: 2002,
    title: 'Hidratación',
    body: 'Revisa tu hidratación según el objetivo personal que tengas configurado.',
    channelId: 'health_alerts',
    schedule: { at: hydrationTime, repeats: true, every: 'day' },
    sound: 'default',
    smallIcon: 'ic_stat_lifeos',
  });

  try { await LocalNotifications.schedule({ notifications }); }
  catch (error) { console.error('Error scheduling shift notifications:', error); }
}
