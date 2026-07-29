const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-3.1-flash-lite';
const STORAGE_KEY = 'gemini_api_key';
const OLD_STORAGE_KEY = 'deepseek_api_key';

async function getApiKey(): Promise<string> {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setGeminiApiKey(key: string) {
  localStorage.setItem(STORAGE_KEY, key);
}

export function getGeminiApiKey(): string {
  try {
    let key = localStorage.getItem(STORAGE_KEY);
    if (!key) {
      key = localStorage.getItem(OLD_STORAGE_KEY);
      if (key) {
        localStorage.setItem(STORAGE_KEY, key);
        localStorage.removeItem(OLD_STORAGE_KEY);
      }
    }
    return key || '';
  } catch {
    return '';
  }
}

interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

async function geminiGenerate(
  systemInstruction: string,
  messages: { role: string; content: string }[],
  options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
): Promise<string> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('NO_API_KEY');

  const contents: GeminiMessage[] = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body: any = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxTokens ?? 2048,
    },
  };

  if (options?.jsonMode) {
    body.generationConfig.responseMimeType = 'application/json';
  }

  const response = await fetch(
    `${API_BASE}/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function aiChat(
  messages: { role: string; content: string }[],
  context: string
): Promise<{ reply: string; suggestedActions: string[] }> {
  const systemInstruction = `Eres "LifeOS Copilot", el asistente inteligente de LifeOS para trabajadores mineros chilenos con régimen 14x14 en alta altitud.

CONTEXTO DEL USUARIO:
${context}

INSTRUCCIONES:
- Responde en español chileno, amigable y motivador
- Formato Markdown permitido
- Sé directo, útil y práctico
- Si te preguntan sobre turnos, salud, finanzas o hábitos, usa el contexto proporcionado
- Máximo 3 párrafos por respuesta`;

  try {
    const reply = await geminiGenerate(systemInstruction, messages);
    return {
      reply,
      suggestedActions: [
        '¿Cómo está mi saturación?',
        'Recomiéndame una rutina',
        'Resumen de mis turnos',
        'Consejos para dormir en campamento',
      ],
    };
  } catch (e: any) {
    if (e.message === 'NO_API_KEY') throw e;
    throw new Error('Error al conectar con Gemini AI.');
  }
}

export async function aiWorkout(data: {
  healthProfile: any;
  latestBiometrics: any;
  shiftInfo: any;
  equipment: string;
  durationMinutes: number;
  focusGoal: string;
  userPrompt: string;
}): Promise<any> {
  const prompt = `Diseña una rutina de ejercicios en formato JSON.

DATOS:
- Peso ${data.healthProfile?.weightKg || 78}kg, Altura ${data.healthProfile?.heightCm || 175}cm
- Altitud: ${data.healthProfile?.miningAltitudeMeters || 4200}msnm
- Turno: Día ${data.shiftInfo?.dayInPhase || 1} de 14 en ${data.shiftInfo?.phase === 'work' ? 'FAENA' : 'DESCANSO'}
- SpO2: ${data.latestBiometrics?.spO2Pct || 96}%, Pulso: ${data.latestBiometrics?.heartRateBpm || 68} BPM
- Equipamiento: ${data.equipment || 'Autocarga'}
- Tiempo: ${data.durationMinutes || 30} min
- Objetivo: ${data.focusGoal || 'Fuerza Funcional'}
- Solicitud extra: ${data.userPrompt || 'Rutina equilibrada'}

IMPORTANTE: Adapta la intensidad a la altitud (${data.healthProfile?.miningAltitudeMeters || 4200}msnm).
Si SpO2 < 92%, recomienda ejercicios de bajo impacto.

Devuelve SOLO un JSON con esta estructura:
{
  "title": "string",
  "summary": "string",
  "precautions": ["string"],
  "warmup": [{"exercise":"string","duration":"string","notes":"string"}],
  "exercises": [{"name":"string","sets":number,"reps":"string","restSeconds":number,"targetMuscle":"string","description":"string"}],
  "cooldown": [{"exercise":"string","duration":"string","notes":"string"}]
}`;

  try {
    const text = await geminiGenerate(
      'Eres un entrenador experto. Responde SOLO con JSON válido.',
      [{ role: 'user', content: prompt }],
      { temperature: 0.7, jsonMode: true }
    );
    return JSON.parse(text);
  } catch (e: any) {
    if (e.message === 'NO_API_KEY') throw e;
    throw new Error('Error generando rutina con IA.');
  }
}

export async function aiParseVoice(text: string): Promise<{
  intent: string;
  summary: string;
  data: any;
}> {
  const prompt = `Analiza esta transcripción de voz en español chileno para LifeOS: "${text}"

Determina la INTENCIÓN y extrae DATOS.

INTENCIONES posibles:
- "health_log": saturación, pulso, presión, SpO2, peso
- "expense": gasto, compra, pago, pesos, lucas
- "income": ingreso, bono, sueldo, recibí
- "task": tarea, pendiente, recordatorio, agenda
- "habit": crear hábito, nuevo hábito, leer, meditar, ejercitarme

Devuelve SOLO un JSON:
{
  "intent": "health_log|expense|income|task|habit|unknown",
  "summary": "resumen breve",
  "data": {
    "amount": number|null,
    "description": "string|null",
    "spO2Pct": number|null,
    "heartRateBpm": number|null,
    "bloodPressureSys": number|null,
    "bloodPressureDia": number|null,
    "taskTitle": "string|null",
    "priority": "p1"|"p2"|"p3"|"p4",
    "habitTitle": "string|null",
    "habitTarget": number|null,
    "habitUnit": "string|null"
  }
}`;

  try {
    const text1 = await geminiGenerate(
      'Eres un analizador de comandos de voz. Responde SOLO con JSON.',
      [{ role: 'user', content: prompt }],
      { temperature: 0.1, jsonMode: true }
    );
    return JSON.parse(text1);
  } catch (e: any) {
    if (e.message === 'NO_API_KEY') throw e;
    return simpleParseVoice(text);
  }
}

function simpleParseVoice(text: string) {
  const lower = text.toLowerCase();
  let intent = 'unknown';
  const data: any = {};

  if (lower.includes('satura') || lower.includes('spo2') || lower.includes('pulso') || lower.includes('presi')) {
    intent = 'health_log';
    const spo2 = lower.match(/(?:satura|spo2|oxigeno)[^\d]*(\d{2,3})/);
    if (spo2) data.spO2Pct = parseInt(spo2[1]);
    const hr = lower.match(/(?:pulso|ritmo|bpm)[^\d]*(\d{2,3})/);
    if (hr) data.heartRateBpm = parseInt(hr[1]);
  } else if (lower.includes('gast') || lower.includes('pagu') || lower.includes('compr') || lower.includes('luca') || lower.includes('peso')) {
    intent = 'expense';
    const num = lower.match(/(\d[\d.]*)\s*(mil|k|luca)?/);
    if (num) {
      let val = parseFloat(num[1].replace(/\./g, ''));
      if (num[2]) val *= 1000;
      data.amount = val;
      data.description = text;
    }
  } else if (lower.includes('habito') || lower.includes('hábito') || lower.includes('crea') || lower.includes('nuevo')) {
    intent = 'habit';
    data.habitTitle = text.replace(/crea|nuevo|habito|hábito|de|por|para/gi, '').trim() || text;
    const num = lower.match(/(\d+)\s*(minutos|paginas|veces|ml|litros)/);
    if (num) {
      data.habitTarget = parseInt(num[1]);
      data.habitUnit = num[2];
    }
  } else {
    intent = 'task';
    data.taskTitle = text;
    data.priority = 'p2';
  }

  return { intent, summary: `Procesado: ${intent}`, data };
}
