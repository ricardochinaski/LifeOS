import { auth } from './firebase';

const AI_ENDPOINT = '/api/ai';

async function callAIBackend(action: 'chat' | 'workout' | 'parse-voice', payload: any): Promise<any> {
  const user = auth.currentUser;
  if (!user) throw new Error('AUTH_REQUIRED');
  const idToken = await user.getIdToken();
  const response = await fetch(AI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ action, payload }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error || `AI_BACKEND_${response.status}`);
  }
  return response.json();
}

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

function localTrainingSummary(context: any): string {
  const training = context?.training || {};
  const sessions = isFiniteNumber(training.sessions7d) ? training.sessions7d : 0;
  const minutes = isFiniteNumber(training.minutes7d) ? training.minutes7d : 0;
  const latest = training.latest;
  if (!sessions && !latest) return 'No hay entrenamientos recientes registrados.';
  const latestLine = latest ? ` Última sesión: ${latest.type || 'entrenamiento'}, ${latest.durationMinutes || 0} min (${latest.date || 'sin fecha'}).` : '';
  return `Entrenamiento últimos 7 días: **${sessions} sesiones · ${minutes} min**.${latestLine}`;
}

function localChat(data: any): { reply: string; suggestedActions: string[] } {
  const lastMessage = String(data?.messages?.[data.messages.length - 1]?.content || '').toLowerCase();
  const context = data?.userContext || {};
  let reply = 'Soy **LifeOS Copilot** y estoy operando en modo local seguro.\n\n';

  if (/entren|rutina|fuerza|cardio|hiit|movilidad|ejercicio/.test(lastMessage)) {
    reply += localTrainingSummary(context);
  } else if (/turno|faena|descanso/.test(lastMessage)) {
    const shift = context.shiftInfo;
    reply += shift && isFiniteNumber(shift.dayInPhase)
      ? `Turno registrado: **día ${shift.dayInPhase}**, fase **${shift.phase === 'work' ? 'faena' : shift.phase === 'rest' ? 'descanso' : 'no disponible'}**.`
      : 'No hay información de turno disponible.';
  } else if (/finanza|gasto|presupuesto|dinero/.test(lastMessage)) {
    reply += `Cuentas reales registradas: **${isFiniteNumber(context.accountsCount) ? context.accountsCount : 0}**.`;
  } else if (/tarea|pendiente|habito|hábito/.test(lastMessage)) {
    reply += `Tareas pendientes: **${isFiniteNumber(context.pendingTasksCount) ? context.pendingTasksCount : 0}**. Hábitos activos: **${isFiniteNumber(context.habitsCount) ? context.habitsCount : 0}**.`;
  } else {
    reply += 'Puedo ayudarte con turno, tareas, hábitos, finanzas y entrenamientos registrados.';
  }

  return {
    reply,
    suggestedActions: ['Resume mis entrenamientos recientes', 'Planificar mi día de turno', 'Resumen de tareas pendientes', 'Resumen de gastos del mes'],
  };
}

function localWorkout(data: any) {
  const phase = data?.shiftInfo?.phase;
  const duration = isFiniteNumber(data?.durationMinutes) ? data.durationMinutes : 45;
  const focus = String(data?.focusGoal || 'general');
  const equipment = String(data?.equipment || 'equipamiento disponible');
  return {
    title: `Rutina ${focus} (${phase === 'work' ? 'Faena' : phase === 'rest' ? 'Descanso' : 'Contexto no informado'})`,
    summary: `Rutina práctica de aproximadamente ${duration} min usando ${equipment}. Ajusta carga, volumen y pausas a tu capacidad real y a la técnica disponible.`,
    precautions: [
      'Prioriza técnica controlada y una progresión gradual.',
      'Detén el ejercicio si aparece dolor agudo, mareo o malestar inusual.',
      'Adapta la sesión a tu experiencia y recuperación real.',
    ],
    warmup: [
      { exercise: 'Movilidad articular', duration: '3 min', notes: 'Hombros, cadera, rodillas y tobillos' },
      { exercise: 'Activación general', duration: '4 min', notes: 'Movimiento progresivo y cómodo' },
    ],
    exercises: [
      { name: 'Sentadilla', sets: 3, reps: '8-12', restSeconds: 90, targetMuscle: 'Piernas', description: 'Carga o variante acorde a tu nivel.' },
      { name: 'Empuje horizontal', sets: 3, reps: '6-12', restSeconds: 90, targetMuscle: 'Pecho y tríceps', description: 'Flexiones, press o variante disponible.' },
      { name: 'Remo', sets: 3, reps: '8-12', restSeconds: 90, targetMuscle: 'Espalda', description: 'Mancuerna, banda o máquina disponible.' },
      { name: 'Core', sets: 3, reps: '20-40 seg', restSeconds: 60, targetMuscle: 'Core', description: 'Mantén control y postura.' },
    ],
    cooldown: [
      { exercise: 'Movilidad suave', duration: '3 min', notes: 'Baja progresivamente la intensidad' },
      { exercise: 'Respiración tranquila', duration: '2 min', notes: 'Recuperación gradual' },
    ],
    durationMinutes: duration,
    focusGoal: focus,
    equipment,
  };
}

function parseVoiceLocally(text: string) {
  const safeText = text.slice(0, 2000);
  const lower = safeText.toLowerCase();
  const data: any = {};
  let intent: 'expense' | 'income' | 'task' | 'habit' | 'unknown' = 'unknown';

  if (/gast|pagu|compr|luca|pesos/.test(lower)) {
    intent = 'expense';
    const amount = lower.match(/(\d[\d.]*)\s*(mil|k|lucas?)?/);
    if (amount) {
      let value = parseInt(amount[1].replace(/\./g, ''), 10);
      if (amount[2]) value *= 1000;
      data.amount = value;
    }
    data.description = safeText;
  } else if (/ingres|recib|bono|sueldo/.test(lower)) {
    intent = 'income';
    const amount = lower.match(/(\d[\d.]*)\s*(mil|k|lucas?)?/);
    if (amount) {
      let value = parseInt(amount[1].replace(/\./g, ''), 10);
      if (amount[2]) value *= 1000;
      data.amount = value;
    }
    data.description = safeText;
  } else if (/hábito|habito/.test(lower)) {
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
    console.warn('LifeOS AI workout backend unavailable; using local fallback.', error);
    return localWorkout(data);
  }
}

export async function chatWithAI(data: any): Promise<{ reply: string; suggestedActions: string[] }> {
  try {
    return await callAIBackend('chat', data);
  } catch (error) {
    console.warn('LifeOS AI chat backend unavailable; using local fallback.', error);
    return localChat(data);
  }
}

export async function parseVoiceCommand(data: { text: string }): Promise<any> {
  const text = typeof data?.text === 'string' ? data.text : '';
  if (!text.trim()) return { intent: 'unknown', summary: 'Texto vacío', data: {} };
  try {
    return await callAIBackend('parse-voice', { text });
  } catch (error) {
    console.warn('LifeOS AI voice backend unavailable; using local parser.', error);
    return parseVoiceLocally(text);
  }
}