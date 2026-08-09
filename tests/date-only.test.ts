import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addDaysToDateOnly,
  addMonthsToDateOnly,
  dateOnlyToLocalDate,
  differenceInDateOnlyDays,
  formatLocalDate,
  parseDateOnly,
} from '../src/lib/dateOnly.ts';

test('formats a late Chile evening as the Chile calendar day instead of UTC next day', () => {
  const instant = new Date('2026-08-10T02:30:00.000Z');
  assert.equal(formatLocalDate(instant, 'America/Santiago'), '2026-08-09');
  assert.equal(formatLocalDate(instant, 'UTC'), '2026-08-10');
});

test('date-only arithmetic is stable across month and leap-day boundaries', () => {
  assert.equal(addDaysToDateOnly('2028-02-28', 1), '2028-02-29');
  assert.equal(addDaysToDateOnly('2028-02-29', 1), '2028-03-01');
  assert.equal(addDaysToDateOnly('2026-01-01', -1), '2025-12-31');
  assert.equal(addMonthsToDateOnly('2026-01-31', 1), '2026-02-28');
  assert.equal(addMonthsToDateOnly('2028-01-31', 1), '2028-02-29');
  assert.equal(differenceInDateOnlyDays('2026-08-09', '2026-07-24'), 16);
});

test('date-only parser rejects impossible dates and local conversion preserves fields', () => {
  assert.deepEqual(parseDateOnly('2026-08-09'), { year: 2026, month: 8, day: 9 });
  assert.throws(() => parseDateOnly('2026-02-30'));

  const local = dateOnlyToLocalDate('2026-08-09');
  assert.equal(local.getFullYear(), 2026);
  assert.equal(local.getMonth(), 7);
  assert.equal(local.getDate(), 9);
});
