import type { HealthLog } from '../types';

export const parseOptionalNumber = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const healthLogTimestamp = (log: HealthLog) => `${log.date}T${log.time || '00:00'}`;

export const sortHealthLogsNewestFirst = (logs: HealthLog[]): HealthLog[] =>
  [...logs].sort((a, b) => healthLogTimestamp(b).localeCompare(healthLogTimestamp(a)));

export const latestHealthLogWith = <K extends keyof HealthLog>(
  logs: HealthLog[],
  key: K,
): HealthLog | undefined =>
  sortHealthLogsNewestFirst(logs).find((log) => log[key] !== undefined && log[key] !== null);

export const formatMeasuredNumber = (
  value: number | undefined,
  maximumFractionDigits = 1,
): string => {
  if (value === undefined || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits }).format(value);
};
