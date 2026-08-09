import assert from 'node:assert/strict';
import test from 'node:test';
import { buildDailyPlan, matchesShift, rankDailyTasks } from '../src/lib/dailyPlan.ts';
import type { Habit, HabitLog, Task } from '../src/types/index.ts';

let idCounter = 0;
const task = (overrides: Partial<Task>): Task => ({
  id: overrides.id || `task-${++idCounter}`,
  title: overrides.title || 'Task',
  status: 'todo',
  priority: 'p3',
  subtasks: [],
  createdAt: '2026-08-01',
  ...overrides,
});

const habit = (overrides: Partial<Habit>): Habit => ({
  id: overrides.id || `habit-${++idCounter}`,
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

test('daily plan respects the active shift', () => {
  assert.equal(matchesShift('work', 'work'), true);
  assert.equal(matchesShift('rest', 'work'), false);
  assert.equal(matchesShift('all', 'rest'), true);
});

test('daily plan ranks overdue and today tasks ahead of undated priorities', () => {
  const ranked = rankDailyTasks([
    task({ id: 'p1', priority: 'p1' }),
    task({ id: 'tomorrow', dueDate: '2026-08-10', priority: 'p1' }),
    task({ id: 'today', dueDate: '2026-08-09', priority: 'p3' }),
    task({ id: 'late', dueDate: '2026-08-08', priority: 'p4' }),
  ], '2026-08-09', 'work');

  assert.deepEqual(ranked.map((item) => item.id), ['late', 'today', 'p1', 'tomorrow']);
});

test('daily plan is shift-aware and counts completed habits', () => {
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

  assert.deepEqual(plan.focusTasks.map((item) => item.id), ['work']);
  assert.deepEqual(plan.dueHabits.map((item) => item.id), ['work-habit']);
  assert.equal(plan.habitsCompleted, 1);
  assert.equal(plan.todayCount, 1);
});
