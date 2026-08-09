import assert from 'node:assert/strict';
import test from 'node:test';
import { processAIAction, parseVoiceLocally } from '../server/aiService.ts';

test('safe chat fallback never fabricates normal-looking biometrics', async () => {
  const result = await processAIAction('chat', {
    messages: [{ role: 'user', content: '¿Cómo está mi salud y mi SpO2?' }],
    userContext: { latestBiometrics: null },
  }, '');

  assert.match(result.reply, /no hay biometría reciente disponible/i);
  assert.doesNotMatch(result.reply, /96%|120\/80|68 BPM|7\.5 h/);
});

test('safe workout fallback does not invent altitude or biometrics', async () => {
  const result = await processAIAction('workout', {
    healthProfile: {},
    latestLog: null,
    shiftInfo: {},
  }, '');

  assert.match(result.summary, /no disponible/i);
  assert.doesNotMatch(JSON.stringify(result), /4200|96%|120\/80|68 BPM/);
});

test('voice parser extracts only values explicitly dictated', () => {
  const result = parseVoiceLocally('Tengo saturación 93 y pulso 71');
  assert.equal(result.intent, 'health_log');
  assert.equal(result.data.spO2Pct, 93);
  assert.equal(result.data.heartRateBpm, 71);
  assert.equal(result.data.bloodPressureSys, undefined);
  assert.equal(result.data.weightKg, undefined);
});
