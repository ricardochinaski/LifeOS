import { ShiftConfig, ShiftInfo, ShiftType } from '../types';
import {
  addDaysToDateOnly,
  dateOnlyToLocalDate,
  differenceInDateOnlyDays,
  todayLocalDate,
} from '../lib/dateOnly';

export const DEFAULT_SHIFT_CONFIG: ShiftConfig = {
  enabled: true,
  restDays: 14,
  workDays: 14,
  currentPhase: 'rest',
  currentDayInPhase: 4,
  // If today is 2026-07-27, Day 4 of Rest started on 2026-07-24 (3 days ago)
  anchorDate: getAnchorDateForDay(4, 'rest'),
  locationName: 'Mina / Faena',
  notes: 'Rotación 14x14 Minera (14 días de faena, 14 días de descanso)',
};

/**
 * Helper to compute anchor date (Day 1 of phase) given current day in phase and target date.
 * Date-only arithmetic is intentionally timezone-independent.
 */
export function getAnchorDateForDay(dayInPhase: number, _phase: ShiftType, baseDateStr?: string): string {
  const baseDate = baseDateStr || todayLocalDate();
  return addDaysToDateOnly(baseDate, -(dayInPhase - 1));
}

/**
 * Calculates current or future shift info for a given date string (YYYY-MM-DD).
 */
export function calculateShiftInfo(config: ShiftConfig, targetDateStr?: string): ShiftInfo {
  const targetDate = targetDateStr || todayLocalDate();
  const anchorDate = config.anchorDate || getAnchorDateForDay(4, 'rest');
  const diffDays = differenceInDateOnlyDays(targetDate, anchorDate);

  const totalCycleDays = config.restDays + config.workDays;
  const cycleIndex = ((diffDays % totalCycleDays) + totalCycleDays) % totalCycleDays;

  let phase: ShiftType = config.currentPhase;
  let dayInPhase = 1;
  let daysRemaining = 0;
  let nextPhase: ShiftType = 'work';

  if (config.currentPhase === 'rest') {
    if (cycleIndex < config.restDays) {
      phase = 'rest';
      dayInPhase = cycleIndex + 1;
      daysRemaining = config.restDays - dayInPhase;
      nextPhase = 'work';
    } else {
      phase = 'work';
      dayInPhase = (cycleIndex - config.restDays) + 1;
      daysRemaining = config.workDays - dayInPhase;
      nextPhase = 'rest';
    }
  } else if (cycleIndex < config.workDays) {
    phase = 'work';
    dayInPhase = cycleIndex + 1;
    daysRemaining = config.workDays - dayInPhase;
    nextPhase = 'rest';
  } else {
    phase = 'rest';
    dayInPhase = (cycleIndex - config.workDays) + 1;
    daysRemaining = config.restDays - dayInPhase;
    nextPhase = 'work';
  }

  const nextChangeDate = addDaysToDateOnly(targetDate, daysRemaining + 1);
  const totalPhaseDays = phase === 'rest' ? config.restDays : config.workDays;
  const cycleProgressPct = Math.round((dayInPhase / totalPhaseDays) * 100);

  return {
    phase,
    dayInPhase,
    totalPhaseDays,
    daysRemaining,
    nextChangeDate,
    nextPhase,
    cycleProgressPct,
  };
}

/** Generates array of one full shift cycle for calendar display. */
export function generateCycleCalendar(config: ShiftConfig) {
  const result: {
    dateStr: string;
    dayNum: number;
    monthStr: string;
    phase: ShiftType;
    dayInPhase: number;
    isToday: boolean;
  }[] = [];

  const todayStr = todayLocalDate();

  for (let i = 0; i < config.restDays + config.workDays; i++) {
    const dateStr = addDaysToDateOnly(config.anchorDate, i);
    const info = calculateShiftInfo(config, dateStr);
    const dateObj = dateOnlyToLocalDate(dateStr);

    result.push({
      dateStr,
      dayNum: dateObj.getDate(),
      monthStr: dateObj.toLocaleDateString('es-ES', { month: 'short' }),
      phase: info.phase,
      dayInPhase: info.dayInPhase,
      isToday: dateStr === todayStr,
    });
  }

  return result;
}
