import { ShiftConfig, ShiftInfo, ShiftType } from '../types';

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
 */
export function getAnchorDateForDay(dayInPhase: number, phase: ShiftType, baseDateStr?: string): string {
  const base = baseDateStr ? new Date(baseDateStr) : new Date();
  base.setHours(0, 0, 0, 0);
  
  // Day 1 was (dayInPhase - 1) days before baseDate
  const anchor = new Date(base);
  anchor.setDate(anchor.getDate() - (dayInPhase - 1));
  
  return anchor.toISOString().split('T')[0];
}

/**
 * Calculates current or future shift info for a given date string (YYYY-MM-DD).
 */
export function calculateShiftInfo(config: ShiftConfig, targetDateStr?: string): ShiftInfo {
  const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  const anchorDateParts = (config.anchorDate || getAnchorDateForDay(4, 'rest')).split('-').map(Number);
  const anchorDate = new Date(anchorDateParts[0], anchorDateParts[1] - 1, anchorDateParts[2]);
  anchorDate.setHours(0, 0, 0, 0);

  const diffMs = targetDate.getTime() - anchorDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const totalCycleDays = config.restDays + config.workDays; // 28
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
  } else {
    // currentPhase is 'work'
    if (cycleIndex < config.workDays) {
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
  }

  // Next change date calculation
  const nextChangeDateObj = new Date(targetDate);
  nextChangeDateObj.setDate(nextChangeDateObj.getDate() + daysRemaining + 1);
  const nextChangeDate = nextChangeDateObj.toISOString().split('T')[0];

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

/**
 * Generates array of 28 days for the full cycle display
 */
export function generateCycleCalendar(config: ShiftConfig) {
  const result: {
    dateStr: string;
    dayNum: number;
    monthStr: string;
    phase: ShiftType;
    dayInPhase: number;
    isToday: boolean;
  }[] = [];

  const todayStr = new Date().toISOString().split('T')[0];

  for (let i = 0; i < config.restDays + config.workDays; i++) {
    const info = calculateShiftInfo(config, getOffsetDate(config.anchorDate, i));
    const dateObj = new Date(getOffsetDate(config.anchorDate, i) + 'T00:00:00');
    const dateStr = dateObj.toISOString().split('T')[0];

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

function getOffsetDate(baseDateStr: string, offsetDays: number): string {
  const parts = baseDateStr.split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}
