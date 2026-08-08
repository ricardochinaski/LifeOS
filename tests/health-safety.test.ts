import assert from 'node:assert/strict';
import test from 'node:test';

import {
  biometricsContext,
  formatBloodPressure,
  formatMetric,
  healthFallbackReply,
} from '../server/healthSafety.ts';

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
  assert.doesNotMatch(reply, /rango operativo estable|estás estable|normal/i);
  assert.match(reply, /no determina por sí solo/i);
});

test('formatters preserve real zero values and reject missing values', () => {
  assert.equal(formatMetric(0, ' h'), '0 h');
  assert.equal(formatMetric(undefined, '%'), 'no disponible');
  assert.equal(formatBloodPressure(120, undefined), 'no disponible');
});
