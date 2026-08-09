import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };
import { processAIAction, type AIAction } from '../server/aiService.ts';

const MAX_BODY_BYTES = 64 * 1024;

async function verifyFirebaseIdToken(idToken: string): Promise<boolean> {
  if (!idToken) return false;

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      },
    );

    if (!response.ok) return false;
    const data = await response.json() as { users?: Array<{ localId?: string }> };
    return Boolean(data.users?.[0]?.localId);
  } catch (error) {
    console.error('Firebase token verification failed.', error);
    return false;
  }
}

function getBearerToken(headerValue: unknown): string {
  if (typeof headerValue !== 'string') return '';
  const match = headerValue.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const contentLength = Number(req.headers?.['content-length'] || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return res.status(413).json({ error: 'Solicitud demasiado grande' });
  }

  const idToken = getBearerToken(req.headers?.authorization);
  if (!(await verifyFirebaseIdToken(idToken))) {
    return res.status(401).json({ error: 'Autenticación requerida' });
  }

  const action = req.body?.action as AIAction | undefined;
  const payload = req.body?.payload;
  if (!action || !['chat', 'workout', 'parse-voice'].includes(action)) {
    return res.status(400).json({ error: 'Acción IA inválida' });
  }

  try {
    const result = await processAIAction(action, payload);
    return res.status(200).json(result);
  } catch (error) {
    console.error('LifeOS AI endpoint failed.', error);
    return res.status(400).json({ error: 'No se pudo procesar la solicitud IA' });
  }
}
