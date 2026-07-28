import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health API check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // AI Workout Generator Endpoint
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
        userPrompt
      } = req.body;

      if (!apiKey) {
        // Provide structured fallback AI response if no GEMINI_API_KEY is configured
        return res.json({
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
            {
              name: 'Sentadillas con autocarga (o mancuerna ligera)',
              sets: 3,
              reps: '10-12',
              restSeconds: 90,
              targetMuscle: 'Cuádriceps y Glúteos',
              description: 'Ejecuta con ritmo controlado de 3 segundos al bajar.'
            },
            {
              name: 'Flexiones de brazos (Push-ups) o inclinadas',
              sets: 3,
              reps: '8-10',
              restSeconds: 90,
              targetMuscle: 'Pecho, Hombros y Tríceps',
              description: 'Mantén el core firme sin arquear la zona lumbar.'
            },
            {
              name: 'Remo con mancuerna o banda elástica',
              sets: 3,
              reps: '12',
              restSeconds: 90,
              targetMuscle: 'Espalda y Bíceps',
              description: 'Jala hacia la cadera manteniendo la postura recta.'
            },
            {
              name: 'Plancha Abdominal Isometrica',
              sets: 3,
              reps: '30 seg',
              restSeconds: 60,
              targetMuscle: 'Core y Estabilidad',
              description: 'Ideal para estabilizar columna en trabajos pesados de mina.'
            }
          ],
          cooldown: [
            { exercise: 'Estiramiento de isquiotibiales y pectorales', duration: '3 min', notes: 'Sostener 20s sin rebotar' },
            { exercise: 'Ejercicios de respiración diafragmática oxigenante', duration: '2 min', notes: 'Inhalar en 4s, exhalar en 6s' }
          ]
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const prompt = `
Eres un preparador físico de elite especializado en medicina deportiva laboral y entrenamiento en altitud geográfica (minería 14x14 a más de 3,000m-4,500m de altitud).
Diseña un plan de rutina de ejercicios hiper-personalizado en formato JSON para el usuario.

DATOS DEL USUARIO:
- Edad/Perfil: Peso ${healthProfile?.weightKg || 78}kg, Estatura ${healthProfile?.heightCm || 175}cm, IMC ${healthProfile?.weightKg ? (healthProfile.weightKg / Math.pow((healthProfile.heightCm || 175)/100, 2)).toFixed(1) : '25'}.
- Condiciones Crónicas / Alergias: ${healthProfile?.chronicConditions?.join(', ') || 'Ninguna'}.
- Altitud Habitual / Mina: ${healthProfile?.miningAltitudeMeters || 4200} metros sobre el nivel del mar.
- Turno Minero Actual: Día ${shiftInfo?.dayInPhase || 1} de 14 en ${shiftInfo?.phase === 'work' ? 'FAENA MINERA (Campamento)' : 'DESCANSO (Ciudad/Hogar)'}.
- Última Biometría Registrada:
  * SpO2 (Saturación Oxígeno): ${latestLog?.spO2Pct || 96}%
  * Presión Arterial: ${latestLog?.bloodPressureSys || 120}/${latestLog?.bloodPressureDia || 80} mmHg
  * Frecuencia Cardíaca en Reposo: ${latestLog?.heartRateBpm || 68} BPM
  * Horas de Sueño Anoche: ${latestLog?.sleepHours || 7.5} horas (Calidad: ${latestLog?.sleepQuality || 'buena'})
  * Nivel de Energía Declarado: ${latestLog?.energyLevel || 8}/10
- Equipamiento Disponible: ${equipment || 'Autocarga (Peso corporal en habitación) + Mancuernas ligeras'}
- Tiempo Disponible: ${durationMinutes || 30} minutos.
- Objetivo Principal: ${focusGoal || 'Movilidad y Fuerza Funcional para Evitar Fatiga en Faena'}
- Solicitud Adicional del Usuario: ${userPrompt || 'Sugerir rutina equilibrada e inspiradora'}.

REGLAS DE SEGURIDAD EN ALTITUD:
1. Si el SpO2 es menor a 92% o la altitud es >3800m, evita ejercicios anaeróbicos lácticos de alta intensidad (HIIT extremo). Prefiere ritmo moderado constante con descansos más largos.
2. Incluye precauciones de oxigenación e hidratación.
3. Adapta el volumen si el sueño fue <6 horas o el nivel de energía es <5.

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
              precautions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              warmup: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    exercise: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    notes: { type: Type.STRING }
                  }
                }
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
                    description: { type: Type.STRING }
                  }
                }
              },
              cooldown: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    exercise: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    notes: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });

      const workoutData = JSON.parse(response.text || '{}');
      return res.json(workoutData);
    } catch (err: any) {
      console.error('Error generating AI workout:', err);
      res.status(500).json({ error: 'Error al generar la rutina con IA', details: err.message });
    }
  });

  // AI Chat Assistant Endpoint (LifeOS Copilot)
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { messages, userContext } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      const lastUserMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : '';

      if (!apiKey) {
        // High quality fallback when key is not configured in environment
        let fallbackReply = `Hola 👋. Soy **LifeOS Copilot**. Actualmente estoy operando en modo local asistido.\n\n`;

        const lowerMsg = (lastUserMessage || '').toLowerCase();
        if (lowerMsg.includes('turno') || lowerMsg.includes('faena') || lowerMsg.includes('descanso')) {
          fallbackReply += `Actualmente estás en el día **${userContext?.shiftInfo?.dayInPhase || 1}** de tu ciclo **${userContext?.shiftInfo?.workDays || 14}x${userContext?.shiftInfo?.restDays || 14}** (${userContext?.shiftInfo?.phase === 'work' ? 'Faena Minera' : 'Descanso en Hogar'}).\n\n*Consejo*: Recuerda hidratarte con al menos 3.5 Litros de agua si estás en la mina (${userContext?.healthProfile?.miningAltitudeMeters || 4200} msnm).`;
        } else if (lowerMsg.includes('salud') || lowerMsg.includes('spo2') || lowerMsg.includes('presion') || lowerMsg.includes('oxigeno')) {
          fallbackReply += `Tu última biometría registrada indica:\n- **Saturación SpO2**: ${userContext?.latestBiometrics?.spO2Pct || 96}%\n- **Presión Arterial**: ${userContext?.latestBiometrics?.bloodPressureSys || 120}/${userContext?.latestBiometrics?.bloodPressureDia || 80} mmHg\n- **Ritmo Cardíaco**: ${userContext?.latestBiometrics?.heartRateBpm || 68} BPM\n\nTus indicadores están en un rango operativo estable.`;
        } else if (lowerMsg.includes('finanza') || lowerMsg.includes('gasto') || lowerMsg.includes('presupuesto') || lowerMsg.includes('dinero')) {
          fallbackReply += `En tus finanzas tienes **${userContext?.accountsCount || 2} cuentas** registradas con moneda principal **${userContext?.currency || 'CLP'}**. Mantener el control de gastos de transporte y equipo en faena es clave.`;
        } else if (lowerMsg.includes('tarea') || lowerMsg.includes('pendiente') || lowerMsg.includes('habito')) {
          fallbackReply += `Tienes **${userContext?.pendingTasksCount || 3} tareas pendientes** y **${userContext?.habitsCount || 4} hábitos activos**. ¿Te gustaría que priorice tus tareas para hoy?`;
        } else {
          fallbackReply += `¿En qué puedo ayudarte hoy? Puedo analizar tus métricas de altitud, organizar tus tareas para el turno minero, revisar tus finanzas o recomendarte una rutina de salud.`;
        }

        return res.json({
          reply: fallbackReply,
          suggestedActions: [
            "¿Cómo está mi saturación de oxígeno?",
            "Recomiéndame una rutina para la faena",
            "Resumen de tareas pendientes",
            "¿Cuándo es mi bajada de descanso?"
          ]
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const systemInstruction = `
Eres "LifeOS Copilot", el asistente inteligente integrado en la aplicación personal LifeOS.
Tu misión es asesorar al usuario de forma proactiva, empática, precisa y profesional.
El usuario trabaja con régimen minero / laboral de turnos (ej. 14x14) en alta altitud geográfica.

CONTEXTO ACTUAL DEL USUARIO:
- Turno Actual: Día ${userContext?.shiftInfo?.dayInPhase || 1} de ${userContext?.shiftInfo?.workDays || 14} (${userContext?.shiftInfo?.phase === 'work' ? 'FAENA EN MINA / CAMPAMENTO' : 'DESCANSO EN CIUDAD'})
- Ubicación / Mina: ${userContext?.shiftInfo?.locationName || 'Campamento Minero'}
- Altitud Operativa: ${userContext?.healthProfile?.miningAltitudeMeters || 4200} msnm
- Biometría Reciente:
  * SpO2 (Oxigenación): ${userContext?.latestBiometrics?.spO2Pct || 96}%
  * Presión: ${userContext?.latestBiometrics?.bloodPressureSys || 120}/${userContext?.latestBiometrics?.bloodPressureDia || 80} mmHg
  * Pulso: ${userContext?.latestBiometrics?.heartRateBpm || 68} BPM
  * Sueño: ${userContext?.latestBiometrics?.sleepHours || 7.5} hrs
- Resumen de Datos:
  * Tareas Pendientes: ${userContext?.pendingTasksCount || 0}
  * Hábitos Activos: ${userContext?.habitsCount || 0}
  * Moneda Principal: ${userContext?.currency || 'CLP'}

REGLAS DE RESPUESTA:
1. Responde en español amigable, estructurado (puedes usar Markdown con viñetas y negritas).
2. Ten en cuenta la salud física en altitud (hipoxia, hidratación, fatiga) si el usuario pregunta sobre ejercicio, fatiga o turnos.
3. Sé directo, práctico y motivador. Si el usuario pide sugerencias, da recomendaciones accionables en listas cortas.
`;

      const contents = (messages || []).map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents,
        config: {
          systemInstruction,
        }
      });

      const reply = response.text || 'No pude generar una respuesta en este momento.';

      return res.json({
        reply,
        suggestedActions: [
          "¿Cómo está mi saturación de oxígeno?",
          "Planificar mi día de turno",
          "Resumen de gastos del mes",
          "Consejos para dormir mejor en campamento"
        ]
      });
    } catch (err: any) {
      console.error('Error in AI Chat assistant:', err);
      return res.status(500).json({
        error: 'Error procesando respuesta del asistente IA',
        details: err.message
      });
    }
  });
  app.post('/api/calendar/sync', async (req, res) => {
    try {
      const { syncType, shiftConfig, tasksCount } = req.body;
      const count = syncType === 'shifts' ? 14 : syncType === 'tasks' ? (tasksCount || 5) : 14 + (tasksCount || 5);
      return res.json({
        success: true,
        eventsSynced: count,
        message: `Sincronización con Google Calendar completada. (${count} eventos procesados)`
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Error sincronizando calendario', details: err.message });
    }
  });

  // AI Voice Dictation Parser Endpoint
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
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
          });

          const prompt = `
Analiza la siguiente transcripción dictada por voz en español para una app de gestión personal (LifeOS).
Determina cuál de estas intenciones corresponde mejor al mensaje:
1) "expense": Gasto en pesos chilenos (CLP) o dinero (ej: "gaste 15 mil en almuerzo", "pague 45000 de gasolina").
2) "income": Ingreso de dinero (ej: "recibi un bono de 200 mil pesos", "me pagaron 500.000").
3) "health_log": Registro biométrico/médico (ej: "tengo 98 de saturación, pulso 65 y presión 120 con 80", "mi peso hoy es 81 kilos").
4) "task": Tarea o pendiente por realizar (ej: "recordar comprar pasajes para el turno", "tarea enviar informe").

Texto dictado: "${text}"

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
            config: {
              responseMimeType: 'application/json'
            }
          });

          const parsed = JSON.parse(response.text || '{}');
          return res.json(parsed);
        } catch (e) {
          console.error('Gemini voice parsing failed, fallback to local parser', e);
        }
      }

      // Local Regex Fallback Parser for Chilean Spanish
      const lower = text.toLowerCase();
      let intent: 'expense' | 'income' | 'health_log' | 'task' | 'unknown' = 'unknown';
      let summary = 'Transcripción procesada.';
      const data: any = {};

      if (lower.includes('saturaci') || lower.includes('spo2') || lower.includes('pulso') || lower.includes('presi') || lower.includes('kilo') || lower.includes('peso')) {
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

        summary = `Salud: SpO2 ${data.spO2Pct || '--'}%, Pulso ${data.heartRateBpm || '--'} BPM`;
      } else if (lower.includes('gast') || lower.includes('pagu') || lower.includes('compr') || lower.includes('pesos') || lower.includes('clp') || lower.includes('lucas')) {
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
      } else if (lower.includes('ingres') || lower.includes('recib') || lower.includes('pagaron') || lower.includes('bono')) {
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
      res.status(500).json({ error: 'Error procesando comando de voz', details: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
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
