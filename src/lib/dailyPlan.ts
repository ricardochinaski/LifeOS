import type { Habit, HabitLog, ShiftType, Task } from '../types';
import { dateOnlyToLocalDate } from './dateOnly';

export interface DailyPlan {
  focusTasks: Task[];
  overdueCount: number;
  todayCount: number;
  upcomingCount: number;
  dueHabits: Habit[];
  completedHabitIds: Set<string>;
  habitsCompleted: number;
}

const priorityRank: Record<Task['priority'], number> = {
  p1: 0,
  p2: 1,
  p3: 2,
  p4: 3,
};

export function matchesShift(
  shiftContext: 'all' | 'rest' | 'work' | undefined,
  phase: ShiftType,
): boolean {
  return !shiftContext || shiftContext === 'all' || shiftContext === phase;
}

function taskBucket(task: Task, today: string): number {
  if (task.dueDate && task.dueDate < today) return 0;
  if (task.dueDate === today) return 1;
  if (task.dueDate && task.dueDate > today) return 5;
  if (task.priority === 'p1') return 2;
  if (task.priority === 'p2') return 3;
  return 4;
}

export function rankDailyTasks(tasks: Task[], today: string, phase: ShiftType): Task[] {
  return tasks
    .filter((task) => task.status !== 'completed' && matchesShift(task.shiftContext, phase))
    .sort((a, b) => {
      const bucketDiff = taskBucket(a, today) - taskBucket(b, today);
      if (bucketDiff !== 0) return bucketDiff;

      const priorityDiff = priorityRank[a.priority] - priorityRank[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      const dateDiff = (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31');
      if (dateDiff !== 0) return dateDiff;

      return (a.dueTime || '99:99').localeCompare(b.dueTime || '99:99');
    });
}

function habitIsDueToday(habit: Habit, today: string, phase: ShiftType): boolean {
  if (!matchesShift(habit.shiftContext, phase)) return false;

  const dayOfWeek = dateOnlyToLocalDate(today).getDay();
  if (habit.activeDays?.length && !habit.activeDays.includes(dayOfWeek)) return false;
  if (habit.targetDaysOfWeek?.length && !habit.targetDaysOfWeek.includes(dayOfWeek)) return false;

  return true;
}

export function buildDailyPlan(input: {
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog[];
  today: string;
  phase: ShiftType;
  maxTasks?: number;
}): DailyPlan {
  const { tasks, habits, habitLogs, today, phase, maxTasks = 5 } = input;
  const rankedTasks = rankDailyTasks(tasks, today, phase);
  const dueHabits = habits.filter((habit) => habitIsDueToday(habit, today, phase));
  const completedHabitIds = new Set(
    habitLogs
      .filter((log) => log.date === today && log.completed)
      .map((log) => log.habitId),
  );

  return {
    focusTasks: rankedTasks.slice(0, maxTasks),
    overdueCount: rankedTasks.filter((task) => task.dueDate && task.dueDate < today).length,
    todayCount: rankedTasks.filter((task) => task.dueDate === today).length,
    upcomingCount: rankedTasks.filter((task) => task.dueDate && task.dueDate > today).length,
    dueHabits,
    completedHabitIds,
    habitsCompleted: dueHabits.filter((habit) => completedHabitIds.has(habit.id)).length,
  };
}
