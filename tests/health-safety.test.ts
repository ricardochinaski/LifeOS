import assert from 'node:assert/strict';
import test from 'node:test';

import {
  biometricsContext,
  formatBloodPressure,
  formatMetric,
  healthFallbackReply,
} from '../server/healthSafety.ts';
import type { HealthLog } from '../src/types';
import {
  formatMeasuredNumber,
  latestHealthLogWith,
  parseOptionalNumber,
  sortHealthLogsNewestFirst,
} from '../src/lib/healthSafety.ts';

test('missing biometrics are explicit and never replaced with normal-looking values', () => {
  const context = biometricsContext();
  const reply = healthFallbackReply();

  assert.match(context, /SpO2: no disponible/);
  assert.match(context, /Presión arterial: no disponible/);
  assert.match(reply, /No hay biometría reciente disponible/);
  assert.doesNotMatch(reply, /96%|120\/80|68 BPM/);
});

test('recorded values are displayed without declaring clinical stability', () => {
  const reply = healthFallbackReply({
    spO2Pct: 85,
    bloodPressureSys: 150,
    bloodPressureDia: 95,
    heartRateBpm: 110,
  });

  assert.match(reply, /85%/);
  assert.match(reply, /150\/95 mmHg/);
  assert.match(reply, /110 BPM/);
  assert.doesNotMatch(reply, /tus indicadores están en un rango operativo estable|estás clínicamente estable|estás estable/i);
  assert.match(reply, /no determina por sí solo/i);
});

test('formatters preserve real zero values and reject missing values', () => {
  assert.equal(formatMetric(0, ' h'), '0 h');
  assert.equal(formatMetric(undefined, '%'), 'no disponible');
  assert.equal(formatBloodPressure(120, undefined), 'no disponible');
});

test('manual health input stays empty until the user enters a value', () => {
  assert.equal(parseOptionalNumber(''), undefined);
  assert.equal(parseOptionalNumber('   '), undefined);
  assert.equal(parseOptionalNumber('98'), 98);
  assert.equal(parseOptionalNumber('7.25'), 7.25);
  assert.equal(formatMeasuredNumber(undefined), '—');
});

test('latest health metric skips newer records that do not contain that measurement', () => {
  const logs: HealthLog[] = [
    { id: 'older', date: '2026-08-09', time: '22:00', spO2Pct: 97, heartRateBpm: 61 },
    { id: 'newer-no-spo2', date: '2026-08-10', time: '08:00', heartRateBpm: 65 },
    { id: 'newest', date: '2026-08-10', time: '09:00', sleepHours: 6.5 },
  ];

  assert.deepEqual(sortHealthLogsNewestFirst(logs).map((log) => log.id), [
    'newest',
    'newer-no-spo2',
    'older',
  ]);
  assert.equal(latestHealthLogWith(logs, 'spO2Pct')?.id, 'older');
  assert.equal(latestHealthLogWith(logs, 'heartRateBpm')?.id, 'newer-no-spo2');
  assert.equal(latestHealthLogWith(logs, 'weightKg'), undefined);
});
