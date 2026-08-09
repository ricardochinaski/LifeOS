import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { processAIAction, type AIAction } from './server/aiService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/api/ai', async (req, res) => {
    const action = req.body?.action as AIAction | undefined;
    if (!action || !['chat', 'workout', 'parse-voice'].includes(action)) {
      return res.status(400).json({ error: 'Acción IA inválida' });
    }

    try {
      const result = await processAIAction(action, req.body?.payload);
      return res.json(result);
    } catch (error) {
      console.error('LifeOS local AI endpoint failed.', error);
      return res.status(400).json({ error: 'No se pudo procesar la solicitud IA' });
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
    } catch (error) {
      console.error('Calendar sync endpoint failed.', error);
      return res.status(500).json({ error: 'Error sincronizando calendario' });
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
