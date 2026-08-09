import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDailyAutomationPlan,
  dailyAutomationId,
  normalizeDailyAutomationSettings,
} from '../src/lib/dailyAutomation.ts';
import type { Habit, ShiftConfig, Task } from '../src/types/index.ts';

const shiftConfig: ShiftConfig = {
  enabled: true,
  restDays: 1,
  workDays: 1,
  currentPhase: 'rest',
  currentDayInPhase: 1,
  anchorDate: '2026-08-09',
};

const task = (overrides: Partial<Task>): Task => ({
  id: 'task-1',
  title: 'Preparar equipo',
  status: 'todo',
  priority: 'p1',
  subtasks: [],
  createdAt: '2026-08-09',
  ...overrides,
});

const habit = (overrides: Partial<Habit>): Habit => ({
  id: 'habit-1',
  title: 'Lectura',
  areaId: 'area_learning',
  color: '#10B981',
  icon: 'BookOpen',
  frequency: 'daily',
  targetValue: 1,
  unit: 'veces',
  streak: 0,
  bestStreak: 0,
  createdAt: '2026-08-09',
  ...overrides,
});

test('daily automation builds a shift-aware morning plan and next-day shift alert', () => {
  const plan = buildDailyAutomationPlan({
    tasks: [task({ dueDate: '2026-08-09', shiftContext: 'rest' })],
    habits: [habit({ shiftContext: 'rest', activeDays: [0] })],
    habitLogs: [],
    shiftConfig,
    settings: { enabled: true, horizonDays: 1 },
    now: new Date(2026, 7, 9, 6, 0, 0),
  });

  const morning = plan.find((item) => item.slot === 'morning');
  const shift = plan.find((item) => item.slot === 'shift');
  assert.ok(morning);
  assert.match(morning.body, /Descanso/);
  assert.match(morning.body, /Preparar equipo/);
  assert.ok(shift);
  assert.match(shift.title, /Faena/);
});

test('daily automation skips slots that already passed today', () => {
  const plan = buildDailyAutomationPlan({
    tasks: [],
    habits: [],
    habitLogs: [],
    shiftConfig,
    settings: {
      enabled: true,
      horizonDays: 1,
      morningTime: '07:00',
      middayTime: '13:00',
      eveningTime: '20:30',
    },
    now: new Date(2026, 7, 9, 14, 0, 0),
  });

  assert.equal(plan.some((item) => item.slot === 'morning'), false);
  assert.equal(plan.some((item) => item.slot === 'midday'), false);
  assert.equal(plan.some((item) => item.slot === 'evening'), true);
});

test('automation notification IDs are stable and slot-specific', () => {
  assert.equal(dailyAutomationId('2026-08-09', 'morning'), dailyAutomationId('2026-08-09', 'morning'));
  assert.notEqual(dailyAutomationId('2026-08-09', 'morning'), dailyAutomationId('2026-08-09', 'evening'));
  assert.ok(dailyAutomationId('2026-08-09', 'morning') < 2_147_483_647);
});

test('automation settings sanitize invalid times and horizon', () => {
  const settings = normalizeDailyAutomationSettings({
    enabled: true,
    morningTime: '99:99',
    horizonDays: 99,
  });
  assert.equal(settings.morningTime, '07:00');
  assert.equal(settings.horizonDays, 14);
});

test('daily automation does not fabricate health measurements or fixed hydration targets', () => {
  const plan = buildDailyAutomationPlan({
    tasks: [],
    habits: [],
    habitLogs: [],
    shiftConfig,
    settings: { enabled: true, horizonDays: 2 },
    now: new Date(2026, 7, 9, 6, 0, 0),
  });
  const text = plan.map((item) => `${item.title} ${item.body}`).join(' ');
  assert.doesNotMatch(text, /96%|120\/80|68 BPM|3\.5L|SpO2/i);
});
