export type Biometrics = {
  spO2Pct?: number | null;
  bloodPressureSys?: number | null;
  bloodPressureDia?: number | null;
  heartRateBpm?: number | null;
  sleepHours?: number | null;
  sleepQuality?: string | null;
  energyLevel?: number | null;
};

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export function formatMetric(value: unknown, suffix = ''): string {
  return isFiniteNumber(value) ? `${value}${suffix}` : 'no disponible';
}

export function formatBloodPressure(sys: unknown, dia: unknown): string {
  return isFiniteNumber(sys) && isFiniteNumber(dia)
    ? `${sys}/${dia} mmHg`
    : 'no disponible';
}

export function formatText(value: unknown, fallback = 'no disponible'): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

export function hasBiometrics(data?: Biometrics | null): boolean {
  if (!data) return false;
  return [
    data.spO2Pct,
    data.bloodPressureSys,
    data.bloodPressureDia,
    data.heartRateBpm,
    data.sleepHours,
    data.energyLevel,
  ].some(isFiniteNumber);
}

export function biometricsContext(data?: Biometrics | null): string {
  return [
    `SpO2: ${formatMetric(data?.spO2Pct, '%')}`,
    `Presión arterial: ${formatBloodPressure(data?.bloodPressureSys, data?.bloodPressureDia)}`,
    `Frecuencia cardíaca: ${formatMetric(data?.heartRateBpm, ' BPM')}`,
    `Sueño: ${formatMetric(data?.sleepHours, ' h')}`,
    `Calidad de sueño: ${formatText(data?.sleepQuality)}`,
    `Energía declarada: ${formatMetric(data?.energyLevel, '/10')}`,
  ].join('\n');
}

export function healthFallbackReply(data?: Biometrics | null): string {
  if (!hasBiometrics(data)) {
    return 'No hay biometría reciente disponible. Registra tus datos si quieres verlos aquí. LifeOS no sustituye una evaluación médica y no infiere valores normales cuando faltan datos.';
  }

  const lines: string[] = [];
  if (isFiniteNumber(data?.spO2Pct)) lines.push(`- **Saturación SpO2**: ${data.spO2Pct}%`);
  if (isFiniteNumber(data?.bloodPressureSys) && isFiniteNumber(data?.bloodPressureDia)) {
    lines.push(`- **Presión arterial**: ${data.bloodPressureSys}/${data.bloodPressureDia} mmHg`);
  }
  if (isFiniteNumber(data?.heartRateBpm)) lines.push(`- **Ritmo cardíaco**: ${data.heartRateBpm} BPM`);
  if (isFiniteNumber(data?.sleepHours)) lines.push(`- **Sueño**: ${data.sleepHours} h`);

  return `Tu último registro contiene:\n${lines.join('\n')}\n\nLifeOS muestra los valores registrados, pero no determina por sí solo si son clínicamente normales o estables. Si tienes síntomas o un valor que te preocupa, sigue el protocolo de salud de tu lugar de trabajo o consulta a un profesional.`;
}
