import { Health } from '@capgo/capacitor-health';
import { isNative } from './native';
import type { HealthSample } from '@capgo/capacitor-health';

export interface HealthConnectData {
  spO2Pct: number | null;
  heartRateBpm: number | null;
  sleepHours: number | null;
  stepsCount: number | null;
  calories: number | null;
  bloodPressureSys: number | null;
  bloodPressureDia: number | null;
}

function toISO(d: Date): string {
  return d.toISOString();
}

async function requestPermissions(): Promise<boolean> {
  if (!isNative()) return false;

  try {
    const result = await Health.requestAuthorization({
      read: ['oxygenSaturation', 'heartRate', 'sleep', 'steps', 'bloodPressure', 'calories'],
      write: [],
    });
    return result !== null;
  } catch (e) {
    console.error('Health Connect permission error:', e);
    return false;
  }
}

export async function syncFromHealthConnect(): Promise<HealthConnectData | null> {
  if (!isNative()) return null;

  const hasPermission = await requestPermissions();
  if (!hasPermission) {
    throw new Error('Permisos de Health Connect denegados');
  }

  const endDate = toISO(new Date());
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const startDate = toISO(start);

  try {
    const readSample = async (dataType: string) => {
      try {
        const result = await Health.readSamples({
          dataType: dataType as any,
          startDate,
          endDate,
          limit: 100,
        });
        return result.samples;
      } catch {
        return [];
      }
    };

    const [oxygenSamples, heartSamples, sleepSamples, stepsSamples, bpSamples, caloriesSamples] = await Promise.all([
      readSample('oxygenSaturation'),
      readSample('heartRate'),
      readSample('sleep'),
      readSample('steps'),
      readSample('bloodPressure'),
      readSample('calories'),
    ]);

    const latest = (samples: HealthSample[], key: 'value' | 'systolic' | 'diastolic' = 'value'): number | null => {
      if (!samples || samples.length === 0) return null;
      const sorted = [...samples].sort((a, b) =>
        new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
      );
      const s = sorted[0];
      if (key === 'value') return s.value;
      if (key === 'systolic') return (s as any).systolic ?? null;
      if (key === 'diastolic') return (s as any).diastolic ?? null;
      return null;
    };

    const sumValues = (samples: HealthSample[]): number | null => {
      if (!samples || samples.length === 0) return null;
      return samples.reduce((acc, s) => acc + s.value, 0);
    };

    return {
      spO2Pct: latest(oxygenSamples),
      heartRateBpm: latest(heartSamples),
      sleepHours: sumValues(sleepSamples) !== null ? (sumValues(sleepSamples)! / 3600) : null,
      stepsCount: sumValues(stepsSamples),
      calories: sumValues(caloriesSamples),
      bloodPressureSys: latest(bpSamples, 'systolic'),
      bloodPressureDia: latest(bpSamples, 'diastolic'),
    };
  } catch (e) {
    console.error('Error reading Health Connect:', e);
    throw new Error('Error al leer datos de Health Connect');
  }
}
