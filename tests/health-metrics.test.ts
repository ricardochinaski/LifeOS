import assert from 'node:assert/strict';
import test from 'node:test';
import { finiteMetric, hasAnyHealthMetric, sleepSamplesToHours } from '../src/lib/healthMetrics.ts';

test('sleep samples convert Health Connect minutes to hours', () => {
  assert.equal(sleepSamplesToHours([{ value: 353, sleepState: 'asleep' }]), 5.88);
});

test('sleep stages take precedence over parent asleep session to avoid double counting', () => {
  assert.equal(
    sleepSamplesToHours([
      { value: 360, sleepState: 'asleep' },
      { value: 180, sleepState: 'light' },
      { value: 90, sleepState: 'deep' },
      { value: 60, sleepState: 'rem' },
      { value: 30, sleepState: 'awake' },
    ]),
    5.5,
  );
});

test('sleep conversion excludes awake and in-bed-only samples', () => {
  assert.equal(
    sleepSamplesToHours([
      { value: 120, sleepState: 'awake' },
      { value: 480, sleepState: 'inBed' },
    ]),
    null,
  );
});

test('health metric guards accept only actual finite numbers', () => {
  assert.equal(finiteMetric(undefined), null);
  assert.equal(finiteMetric(Number.NaN), null);
  assert.equal(finiteMetric(98), 98);
  assert.equal(hasAnyHealthMetric([null, undefined]), false);
  assert.equal(hasAnyHealthMetric([null, 23127]), true);
});
