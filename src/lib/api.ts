import { auth } from './firebase';

const AI_ENDPOINT = '/api/ai';

async function callAIBackend(action: 'chat' | 'workout' | 'parse-voice', payload: any): Promise<any> {
  const user = auth.currentUser;
  if (!user) throw new Error('AUTH_REQUIRED');

  const idToken = await user.getIdToken();
  const response = await fetch(AI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ action, payload }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error || `AI_BACKEND_${response.status}`);
  }

  return response.json();
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

function localHealthSummary(data: any): string {
  if (!data) {
    return 'No hay biometría reciente disponible. LifeOS no infiere valores normales cuando faltan datos.';
  }

  const lines: string[] = [];
  if (isFiniteNumber(data.spO2Pct)) lines.push(`- **SpO2:** ${data.spO2Pct}%`);
  if (isFiniteNumber(data.heartRateBpm)) lines.push(`- **Pulso:** ${data.heartRateBpm} BPM`);
  if (isFiniteNumber(data.bloodPressureSys) && isFiniteNumber(data.bloodPressureDia)) {
    lines.push(`- **Presión arterial:** ${data.bloodPressureSys}/${data.bloodPressureDia} mmHg`);
  }
  if (isFiniteNumber(data.sleepHours)) lines.push(`- **Sueño:** ${data.sleepHours} h`);

  if (lines.length === 0) {
    return 'No hay biometría reciente disponible. LifeOS no infiere valores normales cuando faltan datos.';
  }

  return `Tu último registro contiene:\n${lines.join('\n')}\n\nLifeOS muestra datos registrados y no determina por sí solo si son clínicamente normales o estables.`;
}

function localChat(data: any): { reply: string; suggestedActions: string[] } {
  const lastMessage = String(data?.messages?.[data.messages.length - 1]?.content || '').toLowerCase();
  const context = data?.userContext || {};
  let reply = 'Soy **LifeOS Copilot** y estoy operando en modo local seguro.\n\n';

  if (lastMessage.includes('salud') || lastMessage.includes('spo2') || lastMessage.includes('satur') || lastMessage.includes('presi') || lastMessage.includes('pulso')) {
    reply += localHealthSummary(context.latestBiometrics);
  } else if (lastMessage.includes('turno') || lastMessage.includes('faena') || lastMessage.includes('descanso')) {
    const shift = context.shiftInfo;
    if (shift && isFiniteNumber(shift.dayInPhase)) {
      reply += `Turno registrado: **día ${shift.dayInPhase}**, fase **${shift.phase === 'work' ? 'faena' : shift.phase === 'rest' ? 'descanso' : 'no disponible'}**.`;
    } else {
      reply += 'No hay información de turno disponible.';
    }
  } else if (lastMessage.includes('finanza') || lastMessage.includes('gasto') || lastMessage.includes('presupuesto') || lastMessage.includes('dinero')) {
    reply += `Cuentas registradas: **${isFiniteNumber(context.accountsCount) ? context.accountsCount : 0}**.`;
  } else if (lastMessage.includes('tarea') || lastMessage.includes('pendiente') || lastMessage.includes('habito') || lastMessage.includes('hábito')) {
    reply += `Tareas pendientes: **${isFiniteNumber(context.pendingTasksCount) ? context.pendingTasksCount : 0}**. Hábitos activos: **${isFiniteNumber(context.habitsCount) ? context.habitsCount : 0}**.`;
  } else {
    reply += 'Puedo ayudarte con turnos, tareas, hábitos, finanzas y con los datos de salud que hayas registrado. Los datos ausentes se muestran como no disponibles.';
  }

  return {
    reply,
    suggestedActions: [
      'Ver mis datos de salud registrados',
      'Planificar mi día de turno',
      'Resumen de tareas pendientes',
      'Resumen de gastos del mes',
    ],
  };
}

function localWorkout(data: any) {
  const phase = data?.shiftInfo?.phase;
  const altitude = isFiniteNumber(data?.healthProfile?.miningAltitudeMeters)
    ? `${data.healthProfile.miningAltitudeMeters} m`
    : 'no disponible';

  return {
    title: `Rutina ${data?.focusGoal || 'general'} (${phase === 'work' ? 'Faena' : phase === 'rest' ? 'Descanso' : 'Contexto no informado'})`,
    summary: `Rutina general conservadora. Altitud registrada: ${altitude}. LifeOS no completa biometrías ausentes con valores estimados.`,
    precautions: [
      'Ajusta la intensidad a tu condición y detén la actividad si aparecen síntomas inusuales o malestar.',
      'Respeta los protocolos médicos y de seguridad de tu lugar de trabajo.',
      'LifeOS no sustituye una evaluación médica.',
    ],
    warmup: [
      { exercise: 'Movilidad articular de hombros y cadera', duration: '3 min', notes: 'Movimiento suave y controlado' },
      { exercise: 'Caminata suave o elevación de rodillas', duration: '3 min', notes: 'Mantén una intensidad cómoda' },
    ],
    exercises: [
      { name: 'Sentadillas con autocarga', sets: 3, reps: '8-12', restSeconds: 90, targetMuscle: 'Cuádriceps y glúteos', description: 'Ejecuta con ritmo controlado.' },
      { name: 'Flexiones de brazos o inclinadas', sets: 3, reps: '6-10', restSeconds: 90, targetMuscle: 'Pecho, hombros y tríceps', description: 'Usa una variante que puedas realizar con técnica cómoda.' },
      { name: 'Remo con mancuerna o banda elástica', sets: 3, reps: '8-12', restSeconds: 90, targetMuscle: 'Espalda y bíceps', description: 'Mantén una ejecución controlada.' },
      { name: 'Plancha abdominal', sets: 3, reps: '20-30 seg', restSeconds: 60, targetMuscle: 'Core y estabilidad', description: 'Finaliza si pierdes la técnica o aparece malestar.' },
    ],
    cooldown: [
      { exercise: 'Movilidad y estiramiento suave', duration: '3 min', notes: 'Sin rebotes ni posiciones dolorosas' },
      { exercise: 'Respiración tranquila', duration: '2 min', notes: 'Recupera de forma gradual' },
    ],
  };
}

function parseVoiceLocally(text: string) {
  const safeText = text.slice(0, 2000);
  const lower = safeText.toLowerCase();
  const data: any = {};
  let intent: 'expense' | 'income' | 'health_log' | 'task' | 'habit' | 'unknown' = 'unknown';

  if (lower.includes('saturaci') || lower.includes('spo2') || lower.includes('pulso') || lower.includes('presi') || lower.includes('peso')) {
    intent = 'health_log';
    const spo2 = lower.match(/(?:saturaci[oó]n|spo2|ox[ií]geno)[^\d]*(\d{2,3})/);
    if (spo2) data.spO2Pct = parseInt(spo2[1], 10);
    const pulse = lower.match(/(?:pulso|ritmo|frecuencia|bpm)[^\d]*(\d{2,3})/);
    if (pulse) data.heartRateBpm = parseInt(pulse[1], 10);
    const pressure = lower.match(/(?:presi[oó]n)[^\d]*(\d{2,3})[^\d]+(\d{2,3})/);
    if (pressure) {
      data.bloodPressureSys = parseInt(pressure[1], 10);
      data.bloodPressureDia = parseInt(pressure[2], 10);
    }
    const weight = lower.match(/(?:peso|kilos|kg)[^\d]*(\d{2,3}(?:[.,]\d)?)/);
    if (weight) data.weightKg = parseFloat(weight[1].replace(',', '.'));
  } else if (lower.includes('gast') || lower.includes('pagu') || lower.includes('compr') || lower.includes('luca') || lower.includes('pesos')) {
    intent = 'expense';
    const amount = lower.match(/(\d[\d.]*)\s*(mil|k|lucas?)?/);
    if (amount) {
      let value = parseInt(amount[1].replace(/\./g, ''), 10);
      if (amount[2]) value *= 1000;
      data.amount = value;
    }
    data.description = safeText;
  } else if (lower.includes('ingres') || lower.includes('recib') || lower.includes('bono') || lower.includes('sueldo')) {
    intent = 'income';
    const amount = lower.match(/(\d[\d.]*)\s*(mil|k|lucas?)?/);
    if (amount) {
      let value = parseInt(amount[1].replace(/\./g, ''), 10);
      if (amount[2]) value *= 1000;
      data.amount = value;
    }
    data.description = safeText;
  } else if (lower.includes('hábito') || lower.includes('habito')) {
    intent = 'habit';
    data.habitTitle = safeText.replace(/crea|crear|nuevo|nueva|habito|hábito/gi, '').trim() || safeText;
  } else if (safeText.trim()) {
    intent = 'task';
    data.taskTitle = safeText.trim();
    data.priority = 'p2';
  }

  return { intent, summary: `Procesado localmente: ${intent}`, data };
}

export async function generateWorkout(data: any): Promise<any> {
  try {
    return await callAIBackend('workout', data);
  } catch (error) {
    console.warn('LifeOS AI workout backend unavailable; using safe local fallback.', error);
    return localWorkout(data);
  }
}

export async function chatWithAI(data: any): Promise<{ reply: string; suggestedActions: string[] }> {
  try {
    return await callAIBackend('chat', data);
  } catch (error) {
    console.warn('LifeOS AI chat backend unavailable; using safe local fallback.', error);
    return localChat(data);
  }
}

export async function parseVoiceCommand(data: { text: string }): Promise<any> {
  const text = typeof data?.text === 'string' ? data.text : '';
  if (!text.trim()) return { intent: 'unknown', summary: 'Texto vacío', data: {} };

  try {
    return await callAIBackend('parse-voice', { text });
  } catch (error) {
    console.warn('LifeOS AI voice backend unavailable; using safe local parser.', error);
    return parseVoiceLocally(text);
  }
}
