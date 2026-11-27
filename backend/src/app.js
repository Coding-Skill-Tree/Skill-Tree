import express from 'express';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { pool } from './db/pool.js';
import { HttpError } from './lib/http-error.js';
import { sendSuccess } from './lib/api-response.js';
import { requestContext, notFound, errorHandler } from './middleware/error-handler.js';
import { requireSameOrigin } from './middleware/require-same-origin.js';
import { corsAllowlist } from './middleware/cors.js';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { adminQuestionsRouter } from './routes/admin-questions.js';
import { progressRouter } from './routes/progress.js';
import { skillsRouter } from './routes/skills.js';

const openApiDocument = JSON.parse(readFileSync(new URL('../openapi.json', import.meta.url), 'utf8'));
const apiDocsDirectory = fileURLToPath(new URL('../docs-ui', import.meta.url));

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(requestContext);
  app.use('/api', corsAllowlist);
  app.use('/api', requireSameOrigin);
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', async (_request, response, next) => {
    try {
      await pool.query('SELECT 1');
      sendSuccess(response, { status: 'ok', database: 'connected' });
    } catch {
      next(new HttpError(503, 'DATABASE_UNAVAILABLE', '資料庫暫時無法連線'));
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    app.get('/api/openapi.json', (_request, response) => response.json(openApiDocument));
    app.use('/api/docs', express.static(apiDocsDirectory, { index: 'index.html' }));
  }

  app.use('/api', authRouter);
  app.use('/api', progressRouter);
  app.use('/api', skillsRouter);
  app.use('/api/admin/questions', adminQuestionsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api', notFound);
  app.use(errorHandler);
  return app;
}

export const app = createApp();
