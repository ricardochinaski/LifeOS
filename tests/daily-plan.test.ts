import { describe, expect, it } from 'vitest';
import { buildDailyPlan, matchesShift, rankDailyTasks } from '../src/lib/dailyPlan';
import type { Habit, HabitLog, Task } from '../src/types';

const task = (overrides: Partial<Task>): Task => ({
  id: overrides.id || Math.random().toString(36),
  title: overrides.title || 'Task',
  status: 'todo',
  priority: 'p3',
  subtasks: [],
  createdAt: '2026-08-01',
  ...overrides,
});

const habit = (overrides: Partial<Habit>): Habit => ({
  id: overrides.id || Math.random().toString(36),
  title: overrides.title || 'Habit',
  areaId: 'area_health',
  color: 'emerald',
  icon: 'check',
  frequency: 'daily',
  targetValue: 1,
  unit: 'veces',
  streak: 0,
  bestStreak: 0,
  createdAt: '2026-08-01',
  ...overrides,
});

describe('daily plan', () => {
  it('respects the active shift', () => {
    expect(matchesShift('work', 'work')).toBe(true);
    expect(matchesShift('rest', 'work')).toBe(false);
    expect(matchesShift('all', 'rest')).toBe(true);
  });

  it('ranks overdue and today tasks ahead of undated priorities', () => {
    const ranked = rankDailyTasks([
      task({ id: 'p1', priority: 'p1' }),
      task({ id: 'tomorrow', dueDate: '2026-08-10', priority: 'p1' }),
      task({ id: 'today', dueDate: '2026-08-09', priority: 'p3' }),
      task({ id: 'late', dueDate: '2026-08-08', priority: 'p4' }),
    ], '2026-08-09', 'work');

    expect(ranked.map((item) => item.id)).toEqual(['late', 'today', 'p1', 'tomorrow']);
  });

  it('builds a shift-aware plan and counts completed habits', () => {
    const habits: Habit[] = [
      habit({ id: 'work-habit', shiftContext: 'work', activeDays: [0] }),
      habit({ id: 'rest-habit', shiftContext: 'rest', activeDays: [0] }),
    ];
    const logs: HabitLog[] = [{
      id: 'log-1',
      habitId: 'work-habit',
      date: '2026-08-09',
      value: 1,
      completed: true,
    }];

    const plan = buildDailyPlan({
      tasks: [
        task({ id: 'work', dueDate: '2026-08-09', shiftContext: 'work' }),
        task({ id: 'rest', dueDate: '2026-08-09', shiftContext: 'rest' }),
      ],
      habits,
      habitLogs: logs,
      today: '2026-08-09',
      phase: 'work',
    });

    expect(plan.focusTasks.map((item) => item.id)).toEqual(['work']);
    expect(plan.dueHabits.map((item) => item.id)).toEqual(['work-habit']);
    expect(plan.habitsCompleted).toBe(1);
    expect(plan.todayCount).toBe(1);
  });
});
