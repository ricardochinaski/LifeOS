import { GoogleGenAI } from '@google/genai';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

async function verifyFirebaseIdToken(idToken) {
  if (!idToken) return false;
  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseConfig.apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return Boolean(data.users?.[0]?.localId);
  } catch (error) {
    console.error('Firebase token verification failed for AI status.', error);
    return false;
  }
}

function bearer(headerValue) {
  if (typeof headerValue !== 'string') return '';
  return headerValue.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || '';
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!(await verifyFirebaseIdToken(bearer(req.headers?.authorization)))) {
    return res.status(401).json({ error: 'Autenticación requerida' });
  }

  const apiKey = process.env.GEMINI_API_KEY || '';
  const base = {
    provider: 'Gemini',
    model: MODEL,
    configured: Boolean(apiKey),
    mode: apiKey ? 'gemini-backend' : 'local-safe',
  };

  if (req.method === 'GET' || !apiKey) return res.status(200).json(base);

  try {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'LifeOS/2.4' } } });
    const response = await ai.models.generateContent({ model: MODEL, contents: 'Responde únicamente OK.' });
    return res.status(200).json({ ...base, reachable: Boolean(response.text?.trim()) });
  } catch (error) {
    console.error('Gemini connectivity probe failed.', error);
    return res.status(200).json({ ...base, reachable: false });
  }
}
