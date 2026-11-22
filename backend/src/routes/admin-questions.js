import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAdmin } from '../middleware/require-admin.js';
import { HttpError } from '../lib/http-error.js';

export const adminQuestionsRouter = Router();
adminQuestionsRouter.use(requireAdmin);

const MAX_BIGINT = 9223372036854775807n;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const DIFFICULTIES = new Set(['beginner', 'intermediate', 'advanced']);
const STATUSES = new Set(['draft', 'published']);
const difficultyAliases = new Map([
  ['初級', 'beginner'], ['中級', 'intermediate'], ['進階', 'advanced'],
  ['beginner', 'beginner'], ['intermediate', 'intermediate'], ['advanced', 'advanced'],
]);
const statusAliases = new Map([
  ['草稿', 'draft'], ['已發布', 'published'], ['draft', 'draft'], ['published', 'published'],
]);

function validationError(fields) {
  return new HttpError(400, 'VALIDATION_ERROR', '表單內容有誤', { fields });
}

function questionNotFound() {
  return new HttpError(404, 'QUESTION_NOT_FOUND', '找不到這道題目');
}

function questionConflict() {
  return new HttpError(409, 'QUESTION_CONFLICT', '此技能節點已經有相同題目');
}

function parseQuestionId(value) {
  if (typeof value !== 'string' || !/^[1-9][0-9]*$/u.test(value)) throw questionNotFound();
  try {
    if (BigInt(value) > MAX_BIGINT) throw questionNotFound();
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw questionNotFound();
  }
  return value;
}

function parseListQuery(query) {
  const fields = {};
  const keyword = typeof query.keyword === 'string' ? query.keyword.trim() : '';
  const categoryId = typeof query.categoryId === 'string' ? query.categoryId.trim() : '';
  const statusValue = typeof query.status === 'string' ? query.status.trim() : '';
  const rawPage = query.page === undefined ? '1' : String(query.page);
  const rawPageSize = query.pageSize === undefined ? String(DEFAULT_PAGE_SIZE) : String(query.pageSize);

  if (query.keyword !== undefined && typeof query.keyword !== 'string') fields.keyword = '關鍵字格式錯誤';
  if (Array.from(keyword).length > 100) fields.keyword = '關鍵字最多 100 個字';
  if (query.categoryId !== undefined && (typeof query.categoryId !== 'string' || categoryId.length > 64)) fields.categoryId = '技能分類格式錯誤';
  if (query.status !== undefined && (typeof query.status !== 'string' || (statusValue && !STATUSES.has(statusValue)))) fields.status = '狀態格式錯誤';
  if (!/^\d+$/u.test(rawPage) || !Number.isSafeInteger(Number(rawPage)) || Number(rawPage) < 1) fields.page = '頁碼必須是正整數';
  if (!/^\d+$/u.test(rawPageSize) || !Number.isSafeInteger(Number(rawPageSize)) || Number(rawPageSize) < 1 || Number(rawPageSize) > MAX_PAGE_SIZE) {
    fields.pageSize = `每頁筆數須介於 1 到 ${MAX_PAGE_SIZE}`;
  }
  if (Object.keys(fields).length) throw validationError(fields);

  return { keyword, categoryId, status: statusValue, page: Number(rawPage), pageSize: Number(rawPageSize) };
}

function parseQuestionBody(body) {
  const fields = {};
  const skillId = typeof body?.skillId === 'string' ? body.skillId.trim() : '';
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  const explanation = typeof body?.explanation === 'string' ? body.explanation.trim() : '';
  const choices = Array.isArray(body?.choices) ? body.choices.map((choice) => typeof choice === 'string' ? choice.trim() : '') : [];
  const correctChoice = body?.correctChoice;
  const difficulty = difficultyAliases.get(typeof body?.difficulty === 'string' ? body.difficulty.trim() : '') || '';
  const status = statusAliases.get(typeof body?.status === 'string' ? body.status.trim() : '') || '';

  if (!skillId || skillId.length > 80) fields.skillId = '請選擇有效的技能節點';
  if (!prompt || Array.from(prompt).length > 500) fields.prompt = '題目敘述必填，最多 500 個字';
  if (choices.length !== 3 || choices.some((choice) => !choice || Array.from(choice).length > 180)) fields.choices = '請填寫三個選項，每個選項最多 180 個字';
  if (!Number.isInteger(correctChoice) || correctChoice < 0 || correctChoice > 2) fields.correctChoice = '請選擇正確答案';
  if (!explanation || Array.from(explanation).length > 1200) fields.explanation = '答案解析必填，最多 1200 個字';
  if (!difficulty || !DIFFICULTIES.has(difficulty)) fields.difficulty = '請選擇有效的題目難度';
  if (!status || !STATUSES.has(status)) fields.status = '請選擇有效的題目狀態';
  if (Object.keys(fields).length) throw validationError(fields);

  return { skillId, prompt, choices, correctChoice, explanation, difficulty, status };
}

function toQuestion(row) {
  return {
    id: row.id,
    skillId: row.skillId,
    skillTitle: row.skillTitle,
    categoryId: row.categoryId,
    category: row.category,
    prompt: row.prompt,
    choices: row.choices,
    correctChoice: row.correctChoice,
    explanation: row.explanation,
    difficulty: row.difficulty,
    status: row.status,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

async function readQuestion(database, questionId) {
  const result = await database.query(
    `SELECT q.id::text AS id, q.skill_id AS "skillId", s.title AS "skillTitle",
            c.id AS "categoryId", c.name AS category, q.prompt, q.choices,
            q.correct_choice AS "correctChoice", q.explanation, q.difficulty, q.status,
            q.created_at AS "createdAt", q.updated_at AS "updatedAt"
     FROM questions q
     JOIN skills s ON s.id = q.skill_id
     JOIN skill_categories c ON c.id = s.category_id
     WHERE q.id = $1 AND q.deleted_at IS NULL`,
    [questionId],
  );
  if (!result.rows[0]) throw questionNotFound();
  return toQuestion(result.rows[0]);
}

async function assertActiveSkill(database, skillId) {
  const result = await database.query(
    `SELECT s.id FROM skills s
     JOIN skill_categories c ON c.id = s.category_id
     WHERE s.id = $1 AND s.active = true AND c.active = true`,
    [skillId],
  );
  if (!result.rows[0]) throw validationError({ skillId: '找不到可使用的技能節點' });
}

function auditQuestion(database, adminId, action, questionId, metadata = {}) {
  return database.query(
    `INSERT INTO admin_audit_log(admin_id, action, target_type, target_id, metadata)
     VALUES ($1, $2, 'question', $3, $4::jsonb)`,
    [adminId, action, questionId, JSON.stringify(metadata)],
  );
}

adminQuestionsRouter.get('/summary', async (_request, response, next) => {
  try {
    const [totals, categories, recent] = await Promise.all([
      pool.query(
        `SELECT count(*)::int AS total,
                count(*) FILTER (WHERE status = 'published')::int AS "publishedCount",
                count(*) FILTER (WHERE status = 'draft')::int AS "draftCount"
         FROM questions WHERE deleted_at IS NULL`,
      ),
      pool.query(
        `SELECT c.id AS "categoryId", c.name AS category, count(q.id)::int AS count
         FROM skill_categories c
         LEFT JOIN skills s ON s.category_id = c.id AND s.active = true
         LEFT JOIN questions q ON q.skill_id = s.id AND q.deleted_at IS NULL
         WHERE c.active = true
         GROUP BY c.id, c.name, c.sort_order
         ORDER BY c.sort_order, c.name`,
      ),
      pool.query(
        `SELECT q.id::text AS id, q.prompt, q.status, q.updated_at AS "updatedAt",
                c.name AS category
         FROM questions q
         JOIN skills s ON s.id = q.skill_id
         JOIN skill_categories c ON c.id = s.category_id
         WHERE q.deleted_at IS NULL
         ORDER BY q.created_at DESC, q.id DESC
         LIMIT 5`,
      ),
    ]);

    response.json({
      success: true,
      data: {
        ...totals.rows[0],
        categories: categories.rows,
        recent: recent.rows.map((row) => ({ ...row, updatedAt: new Date(row.updatedAt).toISOString() })),
      },
    });
  } catch (error) {
    next(error);
  }
});

adminQuestionsRouter.get('/options', async (_request, response, next) => {
  try {
    const result = await pool.query(
      `SELECT c.id AS "categoryId", c.name AS category, c.sort_order AS "categoryOrder",
              s.id AS "skillId", s.title AS "skillTitle", s.sort_order AS "skillOrder"
       FROM skill_categories c
       LEFT JOIN skills s ON s.category_id = c.id AND s.active = true
       WHERE c.active = true
       ORDER BY c.sort_order, s.sort_order, s.title`,
    );
    const categories = new Map();
    const skills = [];
    for (const row of result.rows) {
      if (!categories.has(row.categoryId)) {
        categories.set(row.categoryId, { id: row.categoryId, name: row.category });
      }
      if (row.skillId) {
        skills.push({ id: row.skillId, title: row.skillTitle, categoryId: row.categoryId, category: row.category });
      }
    }
    response.json({ success: true, data: { categories: [...categories.values()], skills } });
  } catch (error) {
    next(error);
  }
});

adminQuestionsRouter.get('/', async (request, response, next) => {
  const client = await pool.connect();
  try {
    const { keyword, categoryId, status, page, pageSize } = parseListQuery(request.query);
    const offset = (BigInt(page) - 1n) * BigInt(pageSize);
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const where = `q.deleted_at IS NULL
       AND ($1 = '' OR strpos(lower(q.prompt), lower($1)) > 0 OR strpos(q.id::text, $1) > 0)
       AND ($2 = '' OR c.id = $2)
       AND ($3 = '' OR q.status = $3)`;
    const countResult = await client.query(
      `SELECT count(*)::int AS total
       FROM questions q JOIN skills s ON s.id = q.skill_id
       JOIN skill_categories c ON c.id = s.category_id
       WHERE ${where}`,
      [keyword, categoryId, status],
    );
    const total = countResult.rows[0].total;
    const itemsResult = await client.query(
      `SELECT q.id::text AS id, q.skill_id AS "skillId", s.title AS "skillTitle",
              c.id AS "categoryId", c.name AS category, q.prompt, q.status,
              q.difficulty, q.updated_at AS "updatedAt"
       FROM questions q JOIN skills s ON s.id = q.skill_id
       JOIN skill_categories c ON c.id = s.category_id
       WHERE ${where}
       ORDER BY q.updated_at DESC, q.id DESC
       LIMIT $4 OFFSET $5`,
      [keyword, categoryId, status, pageSize, offset.toString()],
    );
    await client.query('COMMIT');
    response.json({ success: true, data: {
      items: itemsResult.rows.map((row) => ({
        ...row,
        updatedAt: new Date(row.updatedAt).toISOString(),
      })),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    } });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
});

adminQuestionsRouter.get('/:id', async (request, response, next) => {
  try {
    const question = await readQuestion(pool, parseQuestionId(request.params.id));
    response.json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
});

adminQuestionsRouter.post('/', async (request, response, next) => {
  const question = parseQuestionBody(request.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await assertActiveSkill(client, question.skillId);
    const inserted = await client.query(
      `INSERT INTO questions(skill_id, prompt, choices, correct_choice, explanation, active, is_demo, difficulty, status)
       VALUES ($1, $2, $3::jsonb, $4, $5, $6, false, $7, $8)
       RETURNING id::text AS id`,
      [question.skillId, question.prompt, JSON.stringify(question.choices), question.correctChoice,
        question.explanation, question.status === 'published', question.difficulty, question.status],
    );
    const questionId = inserted.rows[0].id;
    await auditQuestion(client, request.admin.id, 'question.create', questionId, { status: question.status });
    const created = await readQuestion(client, questionId);
    await client.query('COMMIT');
    response.status(201).json({ success: true, data: created });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error.code === '23505' ? questionConflict() : error);
  } finally {
    client.release();
  }
});

adminQuestionsRouter.put('/:id', async (request, response, next) => {
  const questionId = parseQuestionId(request.params.id);
  const question = parseQuestionBody(request.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query(
      'SELECT id FROM questions WHERE id = $1 AND deleted_at IS NULL FOR UPDATE',
      [questionId],
    );
    if (!existing.rows[0]) throw questionNotFound();
    await assertActiveSkill(client, question.skillId);
    await client.query(
      `UPDATE questions
       SET skill_id = $1, prompt = $2, choices = $3::jsonb, correct_choice = $4,
           explanation = $5, active = $6, difficulty = $7, status = $8, updated_at = now()
       WHERE id = $9`,
      [question.skillId, question.prompt, JSON.stringify(question.choices), question.correctChoice,
        question.explanation, question.status === 'published', question.difficulty, question.status, questionId],
    );
    await auditQuestion(client, request.admin.id, 'question.update', questionId, { status: question.status });
    const updated = await readQuestion(client, questionId);
    await client.query('COMMIT');
    response.json({ success: true, data: updated });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error.code === '23505' ? questionConflict() : error);
  } finally {
    client.release();
  }
});

adminQuestionsRouter.delete('/:id', async (request, response, next) => {
  const questionId = parseQuestionId(request.params.id);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const removed = await client.query(
      `UPDATE questions SET active = false, deleted_at = now(), updated_at = now()
       WHERE id = $1 AND deleted_at IS NULL RETURNING id::text AS id`,
      [questionId],
    );
    if (!removed.rows[0]) throw questionNotFound();
    await auditQuestion(client, request.admin.id, 'question.delete', questionId);
    await client.query('COMMIT');
    response.status(204).end();
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
});
