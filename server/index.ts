import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { notebooksRouter } from './routes/notebooks.js';

export const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    gemini: Boolean(process.env.GEMINI_API_KEY),
    qdrant: Boolean(process.env.QDRANT_URL),
  });
});

app.use('/api/notebooks', notebooksRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[lumen] route error:', err);
  const message = err instanceof Error ? err.message : 'Internal error';
  res.status(500).json({ error: message });
});

if (!process.env.VERCEL) {
  const port = Number(process.env.PORT ?? 3001);
  app.listen(port, () => {
    console.log(`[lumen] API listening on http://localhost:${port}`);
  });
}
