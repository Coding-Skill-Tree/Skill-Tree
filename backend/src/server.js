import 'dotenv/config';
import express from 'express';
import { pool, closePool } from './db/pool.js';
import { requestContext, notFound, errorHandler } from './middleware/error-handler.js';
import { HttpError } from './lib/http-error.js';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { adminQuestionsRouter } from './routes/admin-questions.js';
import { progressRouter } from './routes/progress.js';
import { requireSameOrigin } from './middleware/require-same-origin.js';
import { corsAllowlist } from './middleware/cors.js';
import { validateEmailRuntime } from './services/email-service.js';

const app = express();
app.disable('x-powered-by');
app.use(requestContext);
app.use('/api', corsAllowlist);
app.use('/api', requireSameOrigin);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (_request, response, next) => {
  try {
    await pool.query('SELECT 1');
    response.json({ success: true, data: { status: 'ok', database: 'connected' } });
  } catch {
    next(new HttpError(503, 'DATABASE_UNAVAILABLE', '資料庫暫時無法連線'));
  }
});

app.use('/api', authRouter);
app.use('/api', progressRouter);
app.use('/api/admin/questions', adminQuestionsRouter);
app.use('/api/admin', adminRouter);
app.use('/api', notFound);
app.use(errorHandler);

const port = Number(process.env.PORT || 3000);
validateEmailRuntime();
const server = app.listen(port, () => console.log(`Skill Tree API listening on http://localhost:${port}`));

async function shutdown(signal) {
  console.log(`${signal} received; shutting down gracefully`);
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
