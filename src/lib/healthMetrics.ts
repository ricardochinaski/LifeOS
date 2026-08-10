export interface SleepMetricSample {
  value: number;
  sleepState?: string;
}

const STAGED_SLEEP_STATES = new Set(['light', 'deep', 'rem']);
const EXCLUDED_SLEEP_STATES = new Set(['awake', 'inBed']);

/**
 * Health Connect sleep samples from @capgo/capacitor-health are expressed in minutes.
 * Prefer stage samples when present so a parent `asleep` session is not double-counted
 * together with its light/deep/REM children.
 */
export function sleepSamplesToHours(samples: SleepMetricSample[]): number | null {
  if (!samples.length) return null;

  const finite = samples.filter((sample) => Number.isFinite(sample.value) && sample.value >= 0);
  if (!finite.length) return null;

  const staged = finite.filter((sample) => sample.sleepState && STAGED_SLEEP_STATES.has(sample.sleepState));
  const asleep = finite.filter((sample) => sample.sleepState === 'asleep');
  const fallback = finite.filter(
    (sample) => !sample.sleepState || !EXCLUDED_SLEEP_STATES.has(sample.sleepState),
  );

  const source = staged.length ? staged : asleep.length ? asleep : fallback;
  if (!source.length) return null;

  const minutes = source.reduce((total, sample) => total + sample.value, 0);
  return Math.round((minutes / 60) * 100) / 100;
}

export function finiteMetric(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function hasAnyHealthMetric(values: Array<number | null | undefined>): boolean {
  return values.some((value) => typeof value === 'number' && Number.isFinite(value));
}
