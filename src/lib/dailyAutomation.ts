import type { Habit, HabitLog, ShiftConfig, Task } from '../types';
import { buildDailyPlan } from './dailyPlan';
import { addDaysToDateOnly, dateOnlyToLocalDate, formatLocalDate } from './dateOnly';
import { calculateShiftInfo } from '../utils/shiftUtils';

export type DailyAutomationSlot = 'morning' | 'midday' | 'evening' | 'shift';

export interface DailyAutomationSettings {
  enabled: boolean;
  morningEnabled: boolean;
  morningTime: string;
  middayEnabled: boolean;
  middayTime: string;
  eveningEnabled: boolean;
  eveningTime: string;
  shiftChangeAlerts: boolean;
  shiftAlertTime: string;
  horizonDays: number;
}

export interface DailyAutomationItem {
  id: number;
  slot: DailyAutomationSlot;
  date: string;
  time: string;
  scheduledAt: Date;
  title: string;
  body: string;
  channelId: 'daily_plan' | 'shift_alerts';
  extra: {
    lifeosAutomation: true;
    slot: DailyAutomationSlot;
    date: string;
    targetTab: 'dashboard';
  };
}

export const DEFAULT_DAILY_AUTOMATION_SETTINGS: DailyAutomationSettings = {
  enabled: false,
  morningEnabled: true,
  morningTime: '07:00',
  middayEnabled: true,
  middayTime: '13:00',
  eveningEnabled: true,
  eveningTime: '20:30',
  shiftChangeAlerts: true,
  shiftAlertTime: '18:30',
  horizonDays: 7,
};

const SLOT_CODE: Record<DailyAutomationSlot, number> = {
  morning: 1,
  midday: 2,
  evening: 3,
  shift: 4,
};

const validTime = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return fallback;
  return value;
};

export function normalizeDailyAutomationSettings(
  value?: Partial<DailyAutomationSettings> | null,
): DailyAutomationSettings {
  const defaults = DEFAULT_DAILY_AUTOMATION_SETTINGS;
  const horizon = Number(value?.horizonDays);
  return {
    enabled: value?.enabled === true,
    morningEnabled: value?.morningEnabled !== false,
    morningTime: validTime(value?.morningTime, defaults.morningTime),
    middayEnabled: value?.middayEnabled !== false,
    middayTime: validTime(value?.middayTime, defaults.middayTime),
    eveningEnabled: value?.eveningEnabled !== false,
    eveningTime: validTime(value?.eveningTime, defaults.eveningTime),
    shiftChangeAlerts: value?.shiftChangeAlerts !== false,
    shiftAlertTime: validTime(value?.shiftAlertTime, defaults.shiftAlertTime),
    horizonDays: Number.isFinite(horizon) ? Math.max(1, Math.min(14, Math.round(horizon))) : defaults.horizonDays,
  };
}

export function dailyAutomationId(date: string, slot: DailyAutomationSlot): number {
  const dateNumber = Number(date.replace(/-/g, ''));
  return 700_000_000 + dateNumber * 10 + SLOT_CODE[slot];
}

export function localDateTime(date: string, time: string): Date {
  const [hour, minute] = time.split(':').map(Number);
  const result = dateOnlyToLocalDate(date);
  result.setHours(hour || 0, minute || 0, 0, 0);
  return result;
}

const shortTitle = (title: string, max = 76) =>
  title.length <= max ? title : `${title.slice(0, max - 1).trimEnd()}…`;

const phaseLabel = (phase: 'rest' | 'work') => phase === 'work' ? 'Faena' : 'Descanso';

function makeItem(
  date: string,
  time: string,
  slot: DailyAutomationSlot,
  title: string,
  body: string,
  channelId: DailyAutomationItem['channelId'] = 'daily_plan',
): DailyAutomationItem {
  return {
    id: dailyAutomationId(date, slot),
    slot,
    date,
    time,
    scheduledAt: localDateTime(date, time),
    title,
    body,
    channelId,
    extra: { lifeosAutomation: true, slot, date, targetTab: 'dashboard' },
  };
}

export function buildDailyAutomationPlan(input: {
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog[];
  shiftConfig: ShiftConfig;
  settings?: Partial<DailyAutomationSettings>;
  now?: Date;
}): DailyAutomationItem[] {
  const settings = normalizeDailyAutomationSettings(input.settings);
  if (!settings.enabled) return [];

  const now = input.now ? new Date(input.now) : new Date();
  const today = formatLocalDate(now);
  const items: DailyAutomationItem[] = [];

  for (let offset = 0; offset < settings.horizonDays; offset += 1) {
    const date = addDaysToDateOnly(today, offset);
    const shift = calculateShiftInfo(input.shiftConfig, date);
    const plan = buildDailyPlan({
      tasks: input.tasks,
      habits: input.habits,
      habitLogs: input.habitLogs,
      today: date,
      phase: shift.phase,
      maxTasks: 3,
    });
    const topTask = plan.focusTasks[0];
    const remainingHabits = Math.max(0, plan.dueHabits.length - plan.habitsCompleted);

    if (settings.morningEnabled) {
      const details = [
        `Día ${shift.dayInPhase}/${shift.totalPhaseDays} · ${phaseLabel(shift.phase)}`,
        plan.overdueCount > 0 ? `${plan.overdueCount} atrasada${plan.overdueCount === 1 ? '' : 's'}` : null,
        topTask ? `Foco: ${shortTitle(topTask.title)}` : 'Sin tareas críticas',
      ].filter(Boolean).join(' · ');
      items.push(makeItem(date, settings.morningTime, 'morning', 'Tu plan de hoy', details));
    }

    if (settings.middayEnabled) {
      const taskCount = plan.focusTasks.length;
      const body = taskCount === 0 && remainingHabits === 0
        ? 'No hay pendientes prioritarios detectados. Revisa LifeOS si quieres ajustar el resto del día.'
        : `Revisa tu foco: ${taskCount} tarea${taskCount === 1 ? '' : 's'} priorizada${taskCount === 1 ? '' : 's'} y ${remainingHabits} hábito${remainingHabits === 1 ? '' : 's'} previsto${remainingHabits === 1 ? '' : 's'}.`;
      items.push(makeItem(date, settings.middayTime, 'midday', 'Chequeo de mitad del día', body));
    }

    if (settings.eveningEnabled) {
      const tomorrow = addDaysToDateOnly(date, 1);
      const tomorrowShift = calculateShiftInfo(input.shiftConfig, tomorrow);
      const tomorrowPlan = buildDailyPlan({
        tasks: input.tasks,
        habits: input.habits,
        habitLogs: input.habitLogs,
        today: tomorrow,
        phase: tomorrowShift.phase,
        maxTasks: 1,
      });
      const completedToday = input.tasks.filter((task) => task.completedAt === date).length;
      const tomorrowFocus = tomorrowPlan.focusTasks[0];
      const body = `${completedToday > 0 ? `${completedToday} tarea${completedToday === 1 ? '' : 's'} completada${completedToday === 1 ? '' : 's'}. ` : ''}Mañana: ${phaseLabel(tomorrowShift.phase)}${tomorrowFocus ? ` · ${shortTitle(tomorrowFocus.title)}` : ' · sin prioridad crítica'}.`;
      items.push(makeItem(date, settings.eveningTime, 'evening', 'Cierre y preparación', body));
    }

    if (settings.shiftChangeAlerts) {
      const tomorrow = addDaysToDateOnly(date, 1);
      const tomorrowShift = calculateShiftInfo(input.shiftConfig, tomorrow);
      if (tomorrowShift.phase !== shift.phase) {
        const nextLabel = phaseLabel(tomorrowShift.phase);
        const body = tomorrowShift.phase === 'work'
          ? 'Mañana comienza Faena. Revisa tu equipaje, traslados y prioridades antes de cerrar el día.'
          : 'Mañana comienza Descanso. Deja cerrados los pendientes de faena y prepara tu primera prioridad personal.';
        items.push(makeItem(date, settings.shiftAlertTime, 'shift', `Cambio de turno: ${nextLabel}`, body, 'shift_alerts'));
      }
    }
  }

  return items
    .filter((item) => item.scheduledAt.getTime() > now.getTime() + 30_000)
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
}
