import { aiChat as geminiChat, aiWorkout as geminiWorkout, aiParseVoice as geminiParseVoice, getGeminiApiKey } from './gemini';

export async function generateWorkout(data: any): Promise<any> {
  try {
    return await geminiWorkout(data);
  } catch (e: any) {
    return generateLocalWorkout(data);
  }
}

export async function chatWithAI(data: any): Promise<{ reply: string; suggestedActions: string[] }> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return generateLocalChat(data);
  }

  try {
    const context = buildContextString(data.userContext);
    return await geminiChat(data.messages || [], context);
  } catch (e: any) {
    return generateLocalChat(data);
  }
}

export async function parseVoiceCommand(data: { text: string }): Promise<any> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return simpleLocalParseVoice(data.text);
  }

  try {
    return await geminiParseVoice(data.text);
  } catch (e: any) {
    return simpleLocalParseVoice(data.text);
  }
}

function buildContextString(ctx: any): string {
  return `
Turno: Día ${ctx?.shiftInfo?.dayInPhase || 1} de ${ctx?.shiftInfo?.workDays || 14}x${ctx?.shiftInfo?.restDays || 14} (${ctx?.shiftInfo?.phase === 'work' ? 'FAENA' : 'DESCANSO'})
Altitud: ${ctx?.healthProfile?.miningAltitudeMeters || 4200}msnm
SpO2: ${ctx?.latestBiometrics?.spO2Pct || 96}%, Pulso: ${ctx?.latestBiometrics?.heartRateBpm || 68} BPM
Presión: ${ctx?.latestBiometrics?.bloodPressureSys || 120}/${ctx?.latestBiometrics?.bloodPressureDia || 80}
Sueño: ${ctx?.latestBiometrics?.sleepHours || 7.5}h
Tareas pendientes: ${ctx?.pendingTasksCount || 0}
Hábitos: ${ctx?.habitsCount || 0}
Moneda: ${ctx?.currency || 'CLP'}
`.trim();
}

function generateLocalChat(data: any): { reply: string; suggestedActions: string[] } {
  const lastMsg = (data.messages?.[data.messages.length - 1]?.content || '').toLowerCase();
  let reply = `Hola 👋. Soy **LifeOS Copilot** (modo local).\n\n`;

  if (lastMsg.includes('turno') || lastMsg.includes('faena')) {
    reply += `Estás en día **${data.userContext?.shiftInfo?.dayInPhase || 1}** de tu ciclo **${data.userContext?.shiftInfo?.workDays || 14}x${data.userContext?.shiftInfo?.restDays || 14}** (${data.userContext?.shiftInfo?.phase === 'work' ? 'Faena ⛏️' : 'Descanso 🏠'}).`;
  } else if (lastMsg.includes('salud') || lastMsg.includes('spo2') || lastMsg.includes('saturacion')) {
    reply += `Tu biometría: SpO2 **${data.userContext?.latestBiometrics?.spO2Pct || 96}%**, Pulso **${data.userContext?.latestBiometrics?.heartRateBpm || 68} BPM**, Presión **${data.userContext?.latestBiometrics?.bloodPressureSys || 120}/${data.userContext?.latestBiometrics?.bloodPressureDia || 80}**.`;
  } else if (lastMsg.includes('finanza') || lastMsg.includes('gasto') || lastMsg.includes('plata')) {
    reply += `Tienes **${data.userContext?.accountsCount || 2} cuentas** en **${data.userContext?.currency || 'CLP'}**.`;
  } else if (lastMsg.includes('tarea') || lastMsg.includes('pendiente')) {
    reply += `Tienes **${data.userContext?.pendingTasksCount || 3} tareas** y **${data.userContext?.habitsCount || 4} hábitos activos**.`;
  } else if (lastMsg.includes('consejo') || lastMsg.includes('dormir') || lastMsg.includes('altura')) {
    reply += `En altitud (>4000m), prioriza:\n- Hidratación: 3.5L+ de agua/día\n- Sueño: 7-8h mínimo\n- SpO2: monitorear 2x/día\n- Alimentación: rica en hierro y carbohidratos`;
  } else {
    reply += `Para activar **Gemini AI** y obtener respuestas inteligentes:\n\n1. Ve a [aistudio.google.com/apikey](https://aistudio.google.com/apikey)\n2. Inicia sesión con tu cuenta Google\n3. Genera una API key gratuita\n4. Pégala en Ajustes > Inteligencia Artificial\n\nSin API key, respondo con datos locales.`;
  }

  return {
    reply,
    suggestedActions: ['¿Cómo está mi saturación?', 'Consejos para dormir', 'Mi resumen de turnos', 'Activar DeepSeek AI'],
  };
}

function generateLocalWorkout(data: any) {
  const isWorkout = data.shiftInfo?.phase === 'work';
  return {
    title: `Rutina ${data.focusGoal || 'Funcional'} para ${isWorkout ? 'Faena' : 'Descanso'} (${data.shiftInfo?.dayInPhase || 1}/14)`,
    summary: `Adaptada a ${data.healthProfile?.miningAltitudeMeters || 4200}msnn. SpO2 base: ${data.latestBiometrics?.spO2Pct || 96}%.`,
    precautions: [
      'Hidrátate con 3.5L de agua durante el día.',
      'Si SpO2 baja de 90%, suspende y descansa.',
      'Duplica el descanso entre series por la altitud.',
    ],
    warmup: [
      { exercise: 'Movilidad articular completa', duration: '3 min', notes: 'Respiración profunda' },
      { exercise: 'Trote suave en el lugar', duration: '2 min', notes: 'No pasar de 120 BPM' },
    ],
    exercises: [
      { name: 'Sentadillas', sets: 3, reps: '12', restSeconds: 90, targetMuscle: 'Piernas', description: 'Controla la bajada en 3 segundos.' },
      { name: 'Flexiones', sets: 3, reps: '10', restSeconds: 90, targetMuscle: 'Pecho y brazos', description: 'Core firme, sin arquear espalda.' },
      { name: 'Plancha', sets: 3, reps: '30s', restSeconds: 60, targetMuscle: 'Core', description: 'Mantén línea recta.' },
      { name: 'Puente de glúteos', sets: 3, reps: '15', restSeconds: 60, targetMuscle: 'Glúteos', description: 'Aprieta al subir.' },
    ],
    cooldown: [
      { exercise: 'Estiramiento de piernas', duration: '2 min', notes: '20s por posición' },
      { exercise: 'Respiración diafragmática', duration: '2 min', notes: 'Inhala 4s, exhala 6s' },
    ],
  };
}

function simpleLocalParseVoice(text: string) {
  const lower = text.toLowerCase();
  let intent = 'unknown';
  const data: any = {};

  if (lower.includes('satura') || lower.includes('spo2') || lower.includes('pulso') || lower.includes('presi')) {
    intent = 'health_log';
    const spo2 = lower.match(/(?:satura|spo2|oxigeno)[^\d]*(\d{2,3})/);
    if (spo2) data.spO2Pct = parseInt(spo2[1]);
    const hr = lower.match(/(?:pulso|ritmo|bpm)[^\d]*(\d{2,3})/);
    if (hr) data.heartRateBpm = parseInt(hr[1]);
    const bp = lower.match(/(?:presion)[^\d]*(\d{2,3})[^\d]+(\d{2,3})/);
    if (bp) { data.bloodPressureSys = parseInt(bp[1]); data.bloodPressureDia = parseInt(bp[2]); }
  } else if (lower.includes('gast') || lower.includes('pagu') || lower.includes('compr') || lower.includes('luca') || lower.includes('peso')) {
    intent = 'expense';
    const num = lower.match(/(\d[\d.]*)\s*(mil|k|luca)?/);
    if (num) {
      let val = parseFloat(num[1].replace(/\./g, ''));
      if (num[2]) val *= 1000;
      data.amount = val;
      data.description = text;
      data.category = lower.includes('super') || lower.includes('comida') ? 'Alimentación' : 'Gastos Varios';
    }
  } else if (lower.includes('ingres') || lower.includes('recib') || lower.includes('bono') || lower.includes('sueldo')) {
    intent = 'income';
    const num = lower.match(/(\d[\d.]*)\s*(mil|k|luca)?/);
    if (num) {
      let val = parseFloat(num[1].replace(/\./g, ''));
      if (num[2]) val *= 1000;
      data.amount = val;
      data.description = text;
    }
  } else {
    intent = 'task';
    data.taskTitle = text;
    data.priority = 'p2';
  }

  return { intent, summary: `Procesado: ${intent}`, data };
}
