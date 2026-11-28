import { lstat, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';
import { pool } from '../db/pool.js';
import { sendSuccess } from '../lib/api-response.js';
import { HttpError } from '../lib/http-error.js';

const projectDirectory = fileURLToPath(new URL('../../../', import.meta.url));
const MAX_SOURCE_BYTES = 48 * 1024;
const SOURCE_FILES = Object.freeze([
  { id: 'frontend-api', label: '前端共用 API client', path: 'src/services/api.js' },
  { id: 'frontend-auth-api', label: '會員登入與重設 adapter', path: 'src/services/memberAuth.js' },
  { id: 'frontend-register-page', label: '會員註冊與 onboarding 導向', path: 'src/page/member/register/RegisterPage.jsx' },
  { id: 'frontend-login-page', label: '會員登入與路由導向', path: 'src/page/member/login/LoginPage.jsx' },
  { id: 'frontend-workbench', label: '開發工作台 UI', path: 'src/page/dev-workbench/DevWorkbench.jsx' },
  { id: 'frontend-quiz-api', label: '測驗 API adapter', path: 'src/services/quizzes.js' },
  { id: 'backend-app', label: 'Express app 與中介層', path: 'backend/src/app.js' },
  { id: 'member-auth-routes', label: '會員登入與 Email routes', path: 'backend/src/routes/auth.js' },
  { id: 'member-session-service', label: '會員 Session 建立與 Cookie', path: 'backend/src/services/session-service.js' },
  { id: 'email-code-service', label: '密碼重設驗證碼 service', path: 'backend/src/services/email-code.js' },
  { id: 'admin-routes', label: '管理員與組員 routes', path: 'backend/src/routes/admin.js' },
  { id: 'question-bank', label: '已發布題庫 service', path: 'backend/src/services/question-bank.js' },
  { id: 'learning-history', label: '學習歷史 API', path: 'backend/src/routes/progress.js' },
  { id: 'xp-event-producer', label: '首通 XP Outbox event producer', path: 'backend/src/services/xp-outbox.js' },
  { id: 'migration-010', label: '測驗冪等與歷史 migration', path: 'backend/migrations/010_learning_history_and_idempotency.sql' },
  { id: 'migration-011', label: '管理員 owner/editor migration', path: 'backend/migrations/011_admin_roles.sql' },
  { id: 'migration-012', label: 'Email 重設碼 migration', path: 'backend/migrations/012_email_reset_codes.sql' },
  { id: 'api-contract', label: '前後端 API 契約', path: 'docs/api-contract.md' },
  { id: 'auth-flow-doc', label: '會員 Email 流程說明', path: 'docs/auth-email-flow.md' },
  { id: 'integration-guide-index', label: 'A–D 後端串接指南', path: 'docs/integration-guides/README.md' },
  { id: 'integration-guide-a', label: 'A 會員登入與 profile 指南', path: 'docs/integration-guides/a-member-auth-profile.md' },
  { id: 'integration-guide-b', label: 'B 技能目錄與進度指南', path: 'docs/integration-guides/b-skill-catalog-progress.md' },
  { id: 'integration-guide-c', label: 'C 測驗與 completion 指南', path: 'docs/integration-guides/c-quiz-and-completion.md' },
  { id: 'integration-guide-d', label: 'D XP Outbox 與 history 指南', path: 'docs/integration-guides/d-xp-history.md' },
]);
const sourcesById = new Map(SOURCE_FILES.map((source) => [source.id, source]));

export const devWorkbenchRouter = Router();

export async function readWorkbenchSource(sourceId) {
  const source = sourcesById.get(sourceId);
  if (!source) throw new HttpError(404, 'SOURCE_NOT_AVAILABLE', '此程式檔不在工作台白名單中');

  const candidatePath = path.resolve(projectDirectory, source.path);
  const projectRoot = await realpath(projectDirectory);
  const resolvedPath = await realpath(candidatePath);
  if (!resolvedPath.startsWith(`${projectRoot}${path.sep}`)) {
    throw new HttpError(404, 'SOURCE_NOT_AVAILABLE', '此程式檔不在工作台白名單中');
  }

  const metadata = await lstat(candidatePath);
  if (!metadata.isFile() || metadata.size > MAX_SOURCE_BYTES) {
    throw new HttpError(413, 'SOURCE_TOO_LARGE', '此程式檔不適合在工作台顯示');
  }
  return {
    id: source.id,
    label: source.label,
    path: source.path,
    content: await readFile(resolvedPath, 'utf8'),
  };
}

function setPrivateReadHeaders(response) {
  response.set('Cache-Control', 'no-store');
  response.set('X-Content-Type-Options', 'nosniff');
}

devWorkbenchRouter.get('/sources', (_request, response) => {
  setPrivateReadHeaders(response);
  sendSuccess(response, SOURCE_FILES.map(({ id, label, path: sourcePath }) => ({
    id,
    label,
    path: sourcePath,
  })));
});

devWorkbenchRouter.get('/sources/:sourceId', async (request, response, next) => {
  try {
    const source = await readWorkbenchSource(request.params.sourceId);
    setPrivateReadHeaders(response);
    return sendSuccess(response, source);
  } catch (error) {
    return next(error);
  }
});

devWorkbenchRouter.get('/status', async (_request, response, next) => {
  try {
    const migrationResult = await pool.query(
      `SELECT name, applied_at AS "appliedAt"
       FROM schema_migrations
       ORDER BY name`,
    );
    setPrivateReadHeaders(response);
    return sendSuccess(response, {
      migrations: migrationResult.rows.map((migration) => ({
        name: migration.name,
        appliedAt: migration.appliedAt.toISOString(),
      })),
    });
  } catch (error) {
    return next(error);
  }
});
