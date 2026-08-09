import test from 'node:test';
import assert from 'node:assert/strict';
import { habitAppliesToday, parseCaptureAmount, workoutLocationForPhase } from '../src/lib/captureUtils';
import type { Habit } from '../src/types';

const baseHabit: Habit = {
  id: 'habit_test',
  title: 'Test',
  areaId: 'area_health',
  color: '#10B981',
  icon: 'Sparkles',
  frequency: 'daily',
  targetValue: 1,
  unit: 'veces',
  streak: 0,
  bestStreak: 0,
  createdAt: '2026-08-09',
};

test('parseCaptureAmount normalizes Chilean thousands separators', () => {
  assert.equal(parseCaptureAmount('$45.000'), 45000);
  assert.equal(parseCaptureAmount('18.500'), 18500);
  assert.equal(parseCaptureAmount('45,000'), 45000);
  assert.equal(parseCaptureAmount('18500'), 18500);
});

test('parseCaptureAmount rejects invalid or non-positive values', () => {
  assert.equal(parseCaptureAmount(''), 0);
  assert.equal(parseCaptureAmount('abc'), 0);
  assert.equal(parseCaptureAmount('-1500'), 0);
});

test('habitAppliesToday respects shift and active weekdays', () => {
  assert.equal(habitAppliesToday(baseHabit, 'work', 0), true);
  assert.equal(habitAppliesToday({ ...baseHabit, shiftContext: 'rest' }, 'work', 0), false);
  assert.equal(habitAppliesToday({ ...baseHabit, activeDays: [1, 2, 3] }, 'rest', 0), false);
  assert.equal(habitAppliesToday({ ...baseHabit, shiftContext: 'work', activeDays: [0] }, 'work', 0), true);
});

test('workoutLocationForPhase maps shift context without inventing a transit location', () => {
  assert.equal(workoutLocationForPhase('work'), 'mine_camp');
  assert.equal(workoutLocationForPhase('rest'), 'rest_home');
});
