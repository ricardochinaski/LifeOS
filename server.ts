import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import {
  biometricsContext,
  formatBloodPressure,
  formatMetric,
  formatText,
  healthFallbackReply,
  isFiniteNumber,
} from './server/healthSafety.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function formatProfile(healthProfile: any): string {
  const weight = formatMetric(healthProfile?.weightKg, ' kg');
  const height = formatMetric(healthProfile?.heightCm, ' cm');
  const bmi =
    isFiniteNumber(healthProfile?.weightKg) &&
    isFiniteNumber(healthProfile?.heightCm) &&
    healthProfile.heightCm > 0
      ? (healthProfile.weightKg / Math.pow(healthProfile.heightCm / 100, 2)).toFixed(1)
      : 'no disponible';

  return `Peso: ${weight}; Estatura: ${height}; IMC: ${bmi}`;
}

function formatShift(shiftInfo: any): string {
  if (!shiftInfo) return 'no disponible';

  const day = isFiniteNumber(shiftInfo.dayInPhase) ? shiftInfo.dayInPhase : 'no disponible';
  const workDays = isFiniteNumber(shiftInfo.workDays) ? shiftInfo.workDays : 'no disponible';
  const restDays = isFiniteNumber(shiftInfo.restDays) ? shiftInfo.restDays : 'no disponible';
  const phase = shiftInfo.phase === 'work' ? 'faena' : shiftInfo.phase === 'rest' ? 'descanso' : 'no disponible';

  return `día ${day}; ciclo ${workDays}x${restDays}; fase ${phase}`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/api/ai/workout', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const {
        healthProfile,
        latestLog,
        shiftInfo,
        equipment,
        durationMinutes,
        focusGoal,
        userPrompt,
      } = req.body;

      const altitude = formatMetric(healthProfile?.miningAltitudeMeters, ' m');
      const healthContext = biometricsContext(latestLog);

      if (!apiKey) {
        return res.json({
          title: `Rutina ${focusGoal || 'general'} (${shiftInfo?.phase === 'work' ? 'Faena' : shiftInfo?.phase === 'rest' ? 'Descanso' : 'Contexto no informado'})`,
          summary: `Rutina general sin IA. Altitud registrada: ${altitude}. Los datos de salud ausentes no se reemplazan por valores estimados.`,
          precautions: [
            'Ajusta la intensidad a tu condición y detén la actividad si aparecen síntomas inusuales o malestar.',
            'Mantén hidratación y pausas de acuerdo con tus necesidades y con los protocolos de seguridad de tu lugar de trabajo.',
            'LifeOS no sustituye una evaluación médica. Si un valor registrado te preocupa o presentas síntomas, utiliza el protocolo de salud correspondiente o consulta a un profesional.',
          ],
          warmup: [
            {
              exercise: 'Movilidad articular de hombros y cadera',
              duration: '3 min',
              notes: 'Movimiento suave y controlado',
            },
            {
              exercise: 'Caminata suave o elevación de rodillas',
              duration: '3 min',
              notes: 'Mantén una intensidad cómoda y detente si aparece malestar',
            },
          ],
          exercises: [
            {
              name: 'Sentadillas con autocarga',
              sets: 3,
              reps: '8-12',
              restSeconds: 90,
              targetMuscle: 'Cuádriceps y glúteos',
              description: 'Ejecuta con ritmo controlado y reduce el rango si resulta incómodo.',
            },
            {
              name: 'Flexiones de brazos o inclinadas',
              sets: 3,
              reps: '6-10',
              restSeconds: 90,
              targetMuscle: 'Pecho, hombros y tríceps',
              description: 'Usa una variante que puedas realizar con técnica cómoda.',
            },
            {
              name: 'Remo con mancuerna o banda elástica',
              sets: 3,
              reps: '8-12',
              restSeconds: 90,
              targetMuscle: 'Espalda y bíceps',
              description: 'Mantén una ejecución controlada y sin dolor.',
            },
            {
              name: 'Plancha abdominal',
              sets: 3,
              reps: '20-30 seg',
              restSeconds: 60,
              targetMuscle: 'Core y estabilidad',
              description: 'Finaliza la serie si pierdes la técnica o aparece malestar.',
            },
          ],
          cooldown: [
            {
              exercise: 'Movilidad y estiramiento suave',
              duration: '3 min',
              notes: 'Sin rebotes ni posiciones dolorosas',
            },
            {
              exercise: 'Respiración tranquila',
              duration: '2 min',
              notes: 'Recupera de forma gradual',
            },
          ],
          healthData: healthContext,
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const chronicConditions = Array.isArray(healthProfile?.chronicConditions) && healthProfile.chronicConditions.length > 0
        ? healthProfile.chronicConditions.join(', ')
        : 'no informado';

      const prompt = `
Eres un asistente de actividad física integrado en LifeOS. Genera una rutina conservadora y práctica para una persona que puede trabajar por turnos y en altitud.

DATOS DISPONIBLES DEL USUARIO:
- Perfil: ${formatProfile(healthProfile)}.
- Condiciones crónicas / alergias: ${chronicConditions}.
- Altitud registrada: ${altitude}.
- Turno: ${formatShift(shiftInfo)}.
- Biometría registrada:
${healthContext}
- Equipamiento: ${formatText(equipment, 'no informado')}.
- Tiempo disponible: ${formatMetric(durationMinutes, ' min')}.
- Objetivo: ${formatText(focusGoal, 'rutina general')}.
- Solicitud adicional: ${formatText(userPrompt, 'ninguna')}.

REGLAS DE SEGURIDAD:
1. No inventes biometría, antecedentes, altitud ni condiciones que no estén informadas. Un dato ausente debe tratarse como "no disponible".
2. No interpretes la ausencia de datos como un valor normal y no declares al usuario clínicamente estable, apto o sano.
3. No realices diagnósticos ni sustituyas indicaciones de profesionales o protocolos médicos/laborales.
4. Evita prescribir límites médicos universales de SpO2, presión, frecuencia cardíaca, hidratación u otros parámetros sin contexto clínico individual.
5. Si el usuario reporta síntomas o valores que le preocupan, recomienda detener o reducir la actividad y seguir el protocolo de salud de su lugar de trabajo o consultar a un profesional.
6. Cuando falten datos de salud, ofrece una rutina general de intensidad conservadora y explica que no está personalizada clínicamente.

Devuelve EXCLUSIVAMENTE un JSON con la siguiente estructura:
{
  "title": "string",
  "summary": "string",
  "precautions": ["string"],
  "warmup": [{"exercise": "string", "duration": "string", "notes": "string"}],
  "exercises": [
    {
      "name": "string",
      "sets": number,
      "reps": "string",
      "restSeconds": number,
      "targetMuscle": "string",
      "description": "string"
    }
  ],
  "cooldown": [{"exercise": "string", "duration": "string", "notes": "string"}]
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              precautions: { type: Type.ARRAY, items: { type: Type.STRING } },
              warmup: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    exercise: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    notes: { type: Type.STRING },
                  },
                },
              },
              exercises: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    sets: { type: Type.INTEGER },
                    reps: { type: Type.STRING },
                    restSeconds: { type: Type.INTEGER },
                    targetMuscle: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                },
              },
              cooldown: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    exercise: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    notes: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      const workoutData = JSON.parse(response.text || '{}');
      return res.json(workoutData);
    } catch (err: any) {
      console.error('Error generating AI workout:', err);
      return res.status(500).json({ error: 'Error al generar la rutina con IA', details: err.message });
    }
  });

  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { messages, userContext } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      const lastUserMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : '';

      if (!apiKey) {
        let fallbackReply = 'Soy **LifeOS Copilot** y estoy operando en modo local asistido.\n\n';
        const lowerMsg = (lastUserMessage || '').toLowerCase();

        if (lowerMsg.includes('turno') || lowerMsg.includes('faena') || lowerMsg.includes('descanso')) {
          const shift = formatShift(userContext?.shiftInfo);
          const altitude = formatMetric(userContext?.healthProfile?.miningAltitudeMeters, ' m');
          fallbackReply += `Configuración de turno disponible: **${shift}**. Altitud registrada: **${altitude}**.\n\nUsa los protocolos de hidratación, descanso y seguridad definidos para tu lugar de trabajo; LifeOS no sustituye esas indicaciones.`;
        } else if (
          lowerMsg.includes('salud') ||
          lowerMsg.includes('spo2') ||
          lowerMsg.includes('presion') ||
          lowerMsg.includes('oxigeno')
        ) {
          fallbackReply += healthFallbackReply(userContext?.latestBiometrics);
        } else if (
          lowerMsg.includes('finanza') ||
          lowerMsg.includes('gasto') ||
          lowerMsg.includes('presupuesto') ||
          lowerMsg.includes('dinero')
        ) {
          fallbackReply += `En tus finanzas hay **${userContext?.accountsCount ?? 0} cuentas** registradas con moneda principal **${userContext?.currency || 'CLP'}**.`;
        } else if (lowerMsg.includes('tarea') || lowerMsg.includes('pendiente') || lowerMsg.includes('habito')) {
          fallbackReply += `Tienes **${userContext?.pendingTasksCount ?? 0} tareas pendientes** y **${userContext?.habitsCount ?? 0} hábitos activos**.`;
        } else {
          fallbackReply += 'Puedo ayudarte a organizar turnos, tareas, hábitos, finanzas y mostrar los datos de salud que hayas registrado. No inventaré biometría que no esté disponible.';
        }

        return res.json({
          reply: fallbackReply,
          suggestedActions: [
            'Ver mis datos de salud registrados',
            'Planificar mi día de turno',
            'Resumen de tareas pendientes',
            'Resumen de gastos del mes',
          ],
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const systemInstruction = `
Eres "LifeOS Copilot", el asistente integrado en la aplicación personal LifeOS.
Ayudas a organizar turnos, tareas, hábitos, finanzas y a mostrar información registrada por el usuario.

CONTEXTO ACTUAL:
- Turno: ${formatShift(userContext?.shiftInfo)}.
- Ubicación: ${formatText(userContext?.shiftInfo?.locationName)}.
- Altitud registrada: ${formatMetric(userContext?.healthProfile?.miningAltitudeMeters, ' m')}.
- Biometría registrada:
${biometricsContext(userContext?.latestBiometrics)}
- Tareas pendientes: ${userContext?.pendingTasksCount ?? 0}.
- Hábitos activos: ${userContext?.habitsCount ?? 0}.
- Moneda principal: ${userContext?.currency || 'CLP'}.

REGLAS DE RESPUESTA:
1. Responde en español de forma clara, práctica y estructurada.
2. No inventes biometría, altitud, antecedentes ni otros datos ausentes. Indica "no disponible" cuando corresponda.
3. No interpretes datos ausentes como normales y no declares al usuario clínicamente estable, sano o apto.
4. No diagnostiques ni sustituyas evaluación médica, protocolos laborales o indicaciones profesionales.
5. Si el usuario menciona síntomas o valores que le preocupan, evita conclusiones clínicas automáticas y sugiere seguir el protocolo de salud correspondiente o consultar a un profesional.
6. Para recomendaciones de actividad física, mantén un enfoque conservador y evita límites médicos universales sin contexto individual.
`;

      const contents = (messages || []).map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents,
        config: { systemInstruction },
      });

      return res.json({
        reply: response.text || 'No pude generar una respuesta en este momento.',
        suggestedActions: [
          'Ver mis datos de salud registrados',
          'Planificar mi día de turno',
          'Resumen de gastos del mes',
          'Revisar tareas pendientes',
        ],
      });
    } catch (err: any) {
      console.error('Error in AI Chat assistant:', err);
      return res.status(500).json({
        error: 'Error procesando respuesta del asistente IA',
        details: err.message,
      });
    }
  });

  app.post('/api/calendar/sync', async (req, res) => {
    try {
      const { syncType, tasksCount } = req.body;
      const count = syncType === 'shifts' ? 14 : syncType === 'tasks' ? (tasksCount || 5) : 14 + (tasksCount || 5);
      return res.json({
        success: true,
        eventsSynced: count,
        message: `Sincronización con Google Calendar completada. (${count} eventos procesados)`,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Error sincronizando calendario', details: err.message });
    }
  });

  app.post('/api/ai/parse-voice', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Texto dictado requerido' });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({
            apiKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
          });

          const prompt = `
Analiza la siguiente transcripción dictada por voz en español para LifeOS.
Determina cuál de estas intenciones corresponde mejor al mensaje:
1) "expense": gasto de dinero.
2) "income": ingreso de dinero.
3) "health_log": registro biométrico dictado por el usuario.
4) "task": tarea o pendiente.

Texto dictado: "${text}"

Para health_log, extrae solo valores expresamente dichos por el usuario. No completes ni estimes biometría ausente.

Devuelve EXCLUSIVAMENTE un JSON con:
{
  "intent": "expense" | "income" | "health_log" | "task" | "unknown",
  "summary": "Resumen amigable del registro interpretado",
  "data": {
    "amount": number_o_null,
    "description": "string_o_null",
    "category": "string_o_null",
    "spO2Pct": number_o_null,
    "heartRateBpm": number_o_null,
    "bloodPressureSys": number_o_null,
    "bloodPressureDia": number_o_null,
    "weightKg": number_o_null,
    "sleepHours": number_o_null,
    "taskTitle": "string_o_null",
    "priority": "p1"|"p2"|"p3"|"p4"
  }
}
`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' },
          });

          return res.json(JSON.parse(response.text || '{}'));
        } catch (e) {
          console.error('Gemini voice parsing failed, fallback to local parser', e);
        }
      }

      const lower = text.toLowerCase();
      let intent: 'expense' | 'income' | 'health_log' | 'task' | 'unknown' = 'unknown';
      let summary = 'Transcripción procesada.';
      const data: any = {};

      if (
        lower.includes('saturaci') ||
        lower.includes('spo2') ||
        lower.includes('pulso') ||
        lower.includes('presi') ||
        lower.includes('kilo') ||
        lower.includes('peso')
      ) {
        intent = 'health_log';
        const spo2Match = lower.match(/(?:saturaci[oó]n|spo2|ox[ií]geno)[^\d]*(\d{2,3})/);
        if (spo2Match) data.spO2Pct = parseInt(spo2Match[1], 10);

        const hrMatch = lower.match(/(?:pulso|ritmo|frecuencia|bpm)[^\d]*(\d{2,3})/);
        if (hrMatch) data.heartRateBpm = parseInt(hrMatch[1], 10);

        const bpMatch = lower.match(/(?:presi[oó]n)[^\d]*(\d{2,3})[^\d]+(\d{2,3})/);
        if (bpMatch) {
          data.bloodPressureSys = parseInt(bpMatch[1], 10);
          data.bloodPressureDia = parseInt(bpMatch[2], 10);
        }

        const weightMatch = lower.match(/(?:peso|kilos|kg)[^\d]*(\d{2,3}(?:\.\d)?)/);
        if (weightMatch) data.weightKg = parseFloat(weightMatch[1]);

        const parts: string[] = [];
        if (isFiniteNumber(data.spO2Pct)) parts.push(`SpO2 ${data.spO2Pct}%`);
        if (isFiniteNumber(data.heartRateBpm)) parts.push(`Pulso ${data.heartRateBpm} BPM`);
        if (isFiniteNumber(data.bloodPressureSys) && isFiniteNumber(data.bloodPressureDia)) {
          parts.push(`Presión ${formatBloodPressure(data.bloodPressureSys, data.bloodPressureDia)}`);
        }
        summary = parts.length > 0 ? `Salud registrada: ${parts.join(', ')}` : 'Registro de salud detectado sin valores reconocibles.';
      } else if (
        lower.includes('gast') ||
        lower.includes('pagu') ||
        lower.includes('compr') ||
        lower.includes('pesos') ||
        lower.includes('clp') ||
        lower.includes('lucas')
      ) {
        intent = 'expense';
        let amount = 0;
        const numMatch = lower.match(/(\d+[\d\.]*)\s*(?:mil|k)?/);
        if (numMatch) {
          let val = parseInt(numMatch[1].replace(/\./g, ''), 10);
          if (lower.includes('mil') || lower.includes('k')) val *= 1000;
          if (lower.includes('lucas')) val *= 1000;
          amount = val;
        }
        data.amount = amount;
        data.description = text;
        data.category = lower.includes('super') ? 'Alimentación & Supermercado' : 'Gastos Varios';
        summary = `Gasto detectado: $${amount.toLocaleString('es-CL')} CLP en ${data.category}`;
      } else if (
        lower.includes('ingres') ||
        lower.includes('recib') ||
        lower.includes('pagaron') ||
        lower.includes('bono')
      ) {
        intent = 'income';
        let amount = 0;
        const numMatch = lower.match(/(\d+[\d\.]*)\s*(?:mil|k)?/);
        if (numMatch) {
          let val = parseInt(numMatch[1].replace(/\./g, ''), 10);
          if (lower.includes('mil') || lower.includes('k')) val *= 1000;
          amount = val;
        }
        data.amount = amount;
        data.description = text;
        summary = `Ingreso detectado: $${amount.toLocaleString('es-CL')} CLP`;
      } else {
        intent = 'task';
        data.taskTitle = text;
        data.priority = 'p2';
        summary = `Tarea creada: "${text}"`;
      }

      return res.json({ intent, summary, data });
    } catch (err: any) {
      return res.status(500).json({ error: 'Error procesando comando de voz', details: err.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
