import { Health } from '@capgo/capacitor-health';
import { isNative } from './native';
import type { HealthSample } from '@capgo/capacitor-health';
import { finiteMetric, sleepSamplesToHours } from './healthMetrics';

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

const READ_TYPES = [
  'oxygenSaturation',
  'restingHeartRate',
  'heartRate',
  'sleep',
  'steps',
  'bloodPressure',
  'calories',
] as const;

async function requestPermissions(): Promise<boolean> {
  if (!isNative()) return false;

  try {
    const availability = await Health.isAvailable();
    if (!availability.available) return false;

    const result = await Health.requestAuthorization({
      read: [...READ_TYPES],
      write: [],
    });

    return result.readAuthorized.some((dataType) => READ_TYPES.includes(dataType as (typeof READ_TYPES)[number]));
  } catch (e) {
    console.error('Health Connect permission error:', e);
    return false;
  }
}

function latest(samples: HealthSample[], key: 'value' | 'systolic' | 'diastolic' = 'value'): number | null {
  if (!samples?.length) return null;

  const sorted = [...samples].sort(
    (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
  );
  const sample = sorted[0];

  if (key === 'systolic') return finiteMetric(sample.systolic);
  if (key === 'diastolic') return finiteMetric(sample.diastolic);
  return finiteMetric(sample.value);
}

export async function syncFromHealthConnect(): Promise<HealthConnectData | null> {
  if (!isNative()) return null;

  const hasPermission = await requestPermissions();
  if (!hasPermission) {
    throw new Error('Health Connect no está disponible o no tiene permisos de lectura');
  }

  const now = new Date();
  const endDate = toISO(now);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const startDate = toISO(start);

  try {
    const readSamples = async (dataType: string): Promise<HealthSample[]> => {
      try {
        const result = await Health.readSamples({
          dataType: dataType as any,
          startDate,
          endDate,
          limit: 500,
        });
        return result.samples ?? [];
      } catch (error) {
        console.warn(`Health Connect: no se pudo leer ${dataType}`, error);
        return [];
      }
    };

    const readDailyTotal = async (dataType: 'steps' | 'calories'): Promise<number | null> => {
      try {
        const result = await Health.queryAggregated({
          dataType,
          startDate,
          endDate,
          bucket: 'day',
          aggregation: 'sum',
        });
        if (!result.samples?.length) return null;
        const total = result.samples.reduce((sum, sample) => sum + sample.value, 0);
        return finiteMetric(total);
      } catch (error) {
        console.warn(`Health Connect: no se pudo agregar ${dataType}`, error);
        return null;
      }
    };

    const [oxygenSamples, restingHeartSamples, heartSamples, sleepSamples, bpSamples, stepsCount, calories] = await Promise.all([
      readSamples('oxygenSaturation'),
      readSamples('restingHeartRate'),
      readSamples('heartRate'),
      readSamples('sleep'),
      readSamples('bloodPressure'),
      readDailyTotal('steps'),
      readDailyTotal('calories'),
    ]);

    return {
      spO2Pct: latest(oxygenSamples),
      heartRateBpm: latest(restingHeartSamples) ?? latest(heartSamples),
      sleepHours: sleepSamplesToHours(sleepSamples),
      stepsCount,
      calories,
      bloodPressureSys: latest(bpSamples, 'systolic'),
      bloodPressureDia: latest(bpSamples, 'diastolic'),
    };
  } catch (e) {
    console.error('Error reading Health Connect:', e);
    throw new Error('Error al leer datos de Health Connect');
  }
}
