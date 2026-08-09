import type { Habit, ShiftType } from '../types';

export const parseCaptureAmount = (raw: string): number => {
  const value = raw.trim().replace(/[$\s]/g, '');
  if (!value) return 0;

  const thousandsPattern = /^\d{1,3}([.,]\d{3})+$/;
  const normalized = thousandsPattern.test(value)
    ? value.replace(/[.,]/g, '')
    : value.replace(',', '.');

  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
};

export const habitAppliesToday = (habit: Habit, phase: ShiftType, weekday: number): boolean => {
  const shiftMatches = !habit.shiftContext || habit.shiftContext === 'all' || habit.shiftContext === phase;
  const dayMatches = !habit.activeDays?.length || habit.activeDays.includes(weekday);
  return shiftMatches && dayMatches;
};

export const workoutLocationForPhase = (phase: ShiftType): 'rest_home' | 'mine_camp' =>
  phase === 'work' ? 'mine_camp' : 'rest_home';
