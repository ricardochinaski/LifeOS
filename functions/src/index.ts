import * as functions from 'firebase-functions';
import { GoogleGenAI, Type } from '@google/genai';

const GEMINI_API_KEY = () => process.env.GEMINI_API_KEY || '';

export const aiWorkout = functions.https.onCall(async (request) => {
  const { healthProfile, latestLog, shiftInfo, equipment, durationMinutes, focusGoal, userPrompt } = request.data;
  const apiKey = GEMINI_API_KEY();

  if (!apiKey) {
    return {
      title: `Rutina ${focusGoal || 'Adaptada'} para Altura (${shiftInfo?.phase === 'work' ? 'Faena' : 'Descanso'})`,
      summary: `Diseñada según tus métricas: SpO2 ${latestLog?.spO2Pct || 96}%, Presión ${latestLog?.bloodPressureSys || 120}/${latestLog?.bloodPressureDia || 80}, y ubicación en ${healthProfile?.miningAltitudeMeters || 4200}m.`,
      precautions: [
        'Mantén hidratación constante (mínimo 3.5 Litros de agua en faena).',
        'Si tu SpO2 baja de 90% o sientes mareos, suspende el ejercicio de inmediato.',
        'Descansa el doble de tiempo entre series debido a la hipoxia de altitud.'
      ],
      warmup: [
        { exercise: 'Movilidad articular de hombros y cadera', duration: '3 min', notes: 'Respiración diafragmática profunda' },
        { exercise: 'Caminata suave o elevación de rodillas', duration: '3 min', notes: 'Sin elevar pulso sobre 120 BPM' }
      ],
      exercises: [
        { name: 'Sentadillas con autocarga (o mancuerna ligera)', sets: 3, reps: '10-12', restSeconds: 90, targetMuscle: 'Cuádriceps y Glúteos', description: 'Ejecuta con ritmo controlado de 3 segundos al bajar.' },
        { name: 'Flexiones de brazos (Push-ups) o inclinadas', sets: 3, reps: '8-10', restSeconds: 90, targetMuscle: 'Pecho, Hombros y Tríceps', description: 'Mantén el core firme sin arquear la zona lumbar.' },
        { name: 'Remo con mancuerna o banda elástica', sets: 3, reps: '12', restSeconds: 90, targetMuscle: 'Espalda y Bíceps', description: 'Jala hacia la cadera manteniendo la postura recta.' },
        { name: 'Plancha Abdominal Isometrica', sets: 3, reps: '30 seg', restSeconds: 60, targetMuscle: 'Core y Estabilidad', description: 'Ideal para estabilizar columna en trabajos pesados de mina.' }
      ],
      cooldown: [
        { exercise: 'Estiramiento de isquiotibiales y pectorales', duration: '3 min', notes: 'Sostener 20s sin rebotar' },
        { exercise: 'Ejercicios de respiración diafragmática oxigenante', duration: '2 min', notes: 'Inhalar en 4s, exhalar en 6s' }
      ]
    };
  }

  const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'lifeos-mobile' } } });

  const prompt = `
Eres un preparador físico de elite especializado en medicina deportiva laboral y entrenamiento en altitud geográfica (minería 14x14 a más de 3,000m-4,500m de altitud).
Diseña un plan de rutina de ejercicios hiper-personalizado en formato JSON.

DATOS DEL USUARIO:
- Peso ${healthProfile?.weightKg || 78}kg, Estatura ${healthProfile?.heightCm || 175}cm
- Condiciones Crónicas: ${healthProfile?.chronicConditions?.join(', ') || 'Ninguna'}
- Altitud: ${healthProfile?.miningAltitudeMeters || 4200} msnm
- Turno: Día ${shiftInfo?.dayInPhase || 1} de 14 en ${shiftInfo?.phase === 'work' ? 'FAENA' : 'DESCANSO'}
- SpO2: ${latestLog?.spO2Pct || 96}%, Presión: ${latestLog?.bloodPressureSys || 120}/${latestLog?.bloodPressureDia || 80}, Pulso: ${latestLog?.heartRateBpm || 68} BPM, Sueño: ${latestLog?.sleepHours || 7.5}h
- Equipamiento: ${equipment || 'Autocarga'}
- Tiempo: ${durationMinutes || 30} minutos
- Objetivo: ${focusGoal || 'Fuerza Funcional'}
- Solicitud: ${userPrompt || 'Rutina equilibrada'}

Devuelve EXCLUSIVAMENTE un JSON con:
{"title":"string","summary":"string","precautions":["string"],"warmup":[{"exercise":"string","duration":"string","notes":"string"}],"exercises":[{"name":"string","sets":number,"reps":"string","restSeconds":number,"targetMuscle":"string","description":"string"}],"cooldown":[{"exercise":"string","duration":"string","notes":"string"}]}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-05-06',
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });

  return JSON.parse(response.text || '{}');
});

export const aiChat = functions.https.onCall(async (request) => {
  const { messages, userContext } = request.data;
  const apiKey = GEMINI_API_KEY();
  const lastUserMessage = messages?.[messages.length - 1]?.content || '';

  if (!apiKey) {
    let fallbackReply = `Hola 👋. Soy **LifeOS Copilot**.\n\n`;
    const lower = (lastUserMessage || '').toLowerCase();
    if (lower.includes('turno') || lower.includes('faena')) {
      fallbackReply += `Estás en día **${userContext?.shiftInfo?.dayInPhase || 1}** de tu ciclo **${userContext?.shiftInfo?.workDays || 14}x${userContext?.shiftInfo?.restDays || 14}** (${userContext?.shiftInfo?.phase === 'work' ? 'Faena' : 'Descanso'}).`;
    } else if (lower.includes('salud') || lower.includes('spo2')) {
      fallbackReply += `Tu biometría: SpO2 ${userContext?.latestBiometrics?.spO2Pct || 96}%, Presión ${userContext?.latestBiometrics?.bloodPressureSys || 120}/${userContext?.latestBiometrics?.bloodPressureDia || 80}, Pulso ${userContext?.latestBiometrics?.heartRateBpm || 68} BPM.`;
    } else if (lower.includes('finanza') || lower.includes('gasto')) {
      fallbackReply += `Tienes **${userContext?.accountsCount || 2} cuentas** en **${userContext?.currency || 'CLP'}**.`;
    } else if (lower.includes('tarea') || lower.includes('pendiente')) {
      fallbackReply += `Tienes **${userContext?.pendingTasksCount || 3} tareas pendientes** y **${userContext?.habitsCount || 4} hábitos activos**.`;
    } else {
      fallbackReply += `¿En qué puedo ayudarte? Puedo analizar tus métricas, organizar tareas, revisar finanzas o recomendar rutinas.`;
    }
    return { reply: fallbackReply, suggestedActions: ["¿Cómo está mi saturación?", "Recomiéndame una rutina", "Resumen de tareas", "¿Cuándo es mi bajada?"] };
  }

  const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'lifeos-mobile' } } });

  const systemInstruction = `
Eres "LifeOS Copilot", el asistente inteligente de LifeOS.
El usuario trabaja con régimen minero de turnos (14x14) en alta altitud.
CONTEXTO: Turno: Día ${userContext?.shiftInfo?.dayInPhase || 1} de ${userContext?.shiftInfo?.workDays || 14} (${userContext?.shiftInfo?.phase === 'work' ? 'FAENA' : 'DESCANSO'}), Altitud: ${userContext?.healthProfile?.miningAltitudeMeters || 4200}msnm.
SpO2: ${userContext?.latestBiometrics?.spO2Pct || 96}%, Pulso: ${userContext?.latestBiometrics?.heartRateBpm || 68} BPM.
Tareas: ${userContext?.pendingTasksCount || 0}, Hábitos: ${userContext?.habitsCount || 0}, Moneda: ${userContext?.currency || 'CLP'}.
Responde en español amigable, con Markdown. Sé directo y motivador.
`;

  const contents = (messages || []).map((m: any) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-05-06',
    contents,
    config: { systemInstruction }
  });

  return {
    reply: response.text || 'No pude generar una respuesta.',
    suggestedActions: ["¿Cómo está mi saturación de oxígeno?", "Planificar mi día de turno", "Resumen de gastos del mes", "Consejos para dormir mejor en campamento"]
  };
});

export const parseVoice = functions.https.onCall(async (request) => {
  const { text } = request.data;
  if (!text || typeof text !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Texto requerido');
  }

  const apiKey = GEMINI_API_KEY();

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'lifeos-mobile' } } });
      const prompt = `Analiza la transcripción de voz en español para LifeOS: "${text}"
Determina la intención: "expense", "income", "health_log", "task" o "unknown".
Devuelve JSON: {"intent":"string","summary":"string","data":{"amount":number|null,"description":"string|null","spO2Pct":number|null,"heartRateBpm":number|null,"bloodPressureSys":number|null,"bloodPressureDia":number|null,"weightKg":number|null,"sleepHours":number|null,"taskTitle":"string|null","priority":"p1"|"p2"|"p3"|"p4"}}`;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-preview-05-06', contents: prompt, config: { responseMimeType: 'application/json' } });
      return JSON.parse(response.text || '{}');
    } catch (e) {
      // fallback
    }
  }

  const lower = text.toLowerCase();
  let intent = 'unknown';
  const data: any = {};

  if (lower.includes('saturaci') || lower.includes('spo2') || lower.includes('pulso') || lower.includes('presi')) {
    intent = 'health_log';
    const spo2 = lower.match(/(?:saturaci|spo2|oxigeno)[^\d]*(\d{2,3})/);
    if (spo2) data.spO2Pct = parseInt(spo2[1]);
    const hr = lower.match(/(?:pulso|ritmo|bpm)[^\d]*(\d{2,3})/);
    if (hr) data.heartRateBpm = parseInt(hr[1]);
    const bp = lower.match(/(?:presion)[^\d]*(\d{2,3})[^\d]+(\d{2,3})/);
    if (bp) { data.bloodPressureSys = parseInt(bp[1]); data.bloodPressureDia = parseInt(bp[2]); }
  } else if (lower.includes('gast') || lower.includes('pagu') || lower.includes('compr') || lower.includes('pesos') || lower.includes('lucas')) {
    intent = 'expense';
    const num = lower.match(/(\d+)[\s]*(mil|k)?/);
    if (num) {
      let val = parseInt(num[1].replace(/\./g, ''));
      if (num[2]) val *= 1000;
      data.amount = val;
      data.description = text;
      data.category = lower.includes('super') ? 'Alimentación' : 'Gastos Varios';
    }
  } else if (lower.includes('ingres') || lower.includes('recib') || lower.includes('bono')) {
    intent = 'income';
    const num = lower.match(/(\d+)[\s]*(mil|k)?/);
    if (num) {
      let val = parseInt(num[1].replace(/\./g, ''));
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
});

export const syncCalendar = functions.https.onCall(async (request) => {
  const { events } = request.data;

  if (!events || !Array.isArray(events)) {
    throw new functions.https.HttpsError('invalid-argument', 'Eventos requeridos');
  }

  // Build Google Calendar API event creation URL (OAuth handled by user)
  const calendarLinks = events.map((event: any) => {
    const date = event.startDate?.replace(/-/g, '');
    const title = encodeURIComponent(event.title || 'Evento LifeOS');
    const desc = encodeURIComponent(event.description || '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${date}/${date}&details=${desc}`;
  });

  return {
    success: true,
    eventsSynced: events.length,
    message: `${events.length} eventos de turno generados. Abre el enlace para agregarlos a Google Calendar.`,
    calendarLinks,
  };
});
