import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import { pool } from '../db/pool.js';
import { sendSuccess } from '../lib/api-response.js';
import { HttpError, validationError } from '../lib/http-error.js';
import { requireMember } from '../middleware/require-member.js';
import { listPublishedQuestionsForSkill } from '../services/question-bank.js';
import { readActiveCatalogVersion } from '../services/progress-service.js';
import { selectQuestions } from '../lib/quiz-utils.js';

const QUIZ_QUESTION_COUNT = 5;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export const quizzesRouter = Router();

function readCreateRequest(request) {
  const body = request.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw validationError({ body: '本文必須是 JSON 物件' });
  }
  if (Object.keys(body).some((key) => key !== 'skillId')) {
    throw validationError({ body: '本文只接受 skillId' });
  }
  if (
    typeof body.skillId !== 'string'
    || body.skillId.length === 0
    || body.skillId.length > 80
    || body.skillId !== body.skillId.trim()
  ) {
    throw validationError({ skillId: '技能 ID 必須是 1 到 80 個字元，且不可包含前後空白' });
  }

  const idempotencyKey = request.get('Idempotency-Key');
  if (typeof idempotencyKey !== 'string' || !UUID_PATTERN.test(idempotencyKey)) {
    throw validationError({ idempotencyKey: '必須提供 UUID 格式的 Idempotency-Key header' });
  }

  const fingerprint = createHash('sha256')
    .update(JSON.stringify({ skillId: body.skillId }), 'utf8')
    .digest();
  return { skillId: body.skillId, idempotencyKey, fingerprint };
}

function isUsableQuestion(question) {
  if (
    typeof question.prompt !== 'string'
    || !question.prompt.trim()
    || !Array.isArray(question.choices)
    || question.choices.length < 2
    || question.choices.length > 10
    || !question.choices.every((choice) => typeof choice === 'string' && choice.trim())
    || !['single', 'multiple'].includes(question.answerMode)
    || !Array.isArray(question.correctChoices)
    || !Array.isArray(question.choiceExplanations)
    || question.choiceExplanations.length !== question.choices.length
    || !question.choiceExplanations.every((explanation) => typeof explanation === 'string' && explanation.trim())
    || typeof question.explanation !== 'string'
    || !question.explanation.trim()
  ) {
    return false;
  }

  const correctChoices = question.correctChoices;
  const requiredAnswerCount = question.answerMode === 'single' ? 1 : 2;
  return correctChoices.length >= requiredAnswerCount
    && correctChoices.length <= question.choices.length
    && correctChoices.every((index) => Number.isSafeInteger(index) && index >= 0 && index < question.choices.length)
    && new Set(correctChoices).size === correctChoices.length;
}

async function loadAttempt(database, { attemptId, userId }) {
  const attemptResult = await database.query(
    `SELECT id::text AS "attemptId", skill_id AS "skillId",
            skill_title_snapshot AS "skillTitle", catalog_version AS "catalogVersion",
            status, total_questions AS "totalQuestions", started_at AS "startedAt"
     FROM quiz_attempts
     WHERE id = $1 AND user_id = $2`,
    [attemptId, userId],
  );
  const attempt = attemptResult.rows[0];
  if (!attempt) throw new HttpError(404, 'ATTEMPT_NOT_FOUND', '找不到此測驗');
  if (attempt.status === 'cancelled') {
    throw new HttpError(409, 'ATTEMPT_CANCELLED', '此測驗已取消');
  }

  // Keep correct-answer and explanation columns out of this query entirely.
  const questionResult = await database.query(
    `SELECT ordinal, prompt_snapshot AS prompt, choices_snapshot AS choices,
            answer_mode_snapshot AS "answerMode", selected_choices AS "selectedChoices",
            answered_at AS "answeredAt"
     FROM quiz_attempt_questions
     WHERE attempt_id = $1
     ORDER BY ordinal`,
    [attempt.attemptId],
  );
  if (
    questionResult.rows.length !== attempt.totalQuestions
    || questionResult.rows.some((question, index) => question.ordinal !== index + 1)
  ) {
    throw new HttpError(500, 'ATTEMPT_INTEGRITY_ERROR', '測驗題目快照資料不完整');
  }

  return {
    attemptId: attempt.attemptId,
    skillId: attempt.skillId,
    skillTitle: attempt.skillTitle,
    catalogVersion: attempt.catalogVersion,
    status: attempt.status,
    totalQuestions: attempt.totalQuestions,
    startedAt: attempt.startedAt.toISOString(),
    questions: questionResult.rows.map((question) => ({
      ordinal: question.ordinal,
      prompt: question.prompt,
      choices: question.choices,
      answerMode: question.answerMode,
      selectedChoices: question.selectedChoices,
      answeredAt: question.answeredAt?.toISOString() ?? null,
    })),
  };
}

quizzesRouter.post('/quizzes/attempts', requireMember, async (request, response, next) => {
  let client;
  let transactionStarted = false;
  try {
    const { skillId, idempotencyKey, fingerprint } = readCreateRequest(request);
    const userId = request.member.id;
    client = await pool.connect();
    await client.query('BEGIN ISOLATION LEVEL READ COMMITTED');
    transactionStarted = true;

    const memberResult = await client.query(
      `SELECT id FROM users
       WHERE id = $1 AND suspended_at IS NULL
       FOR UPDATE`,
      [userId],
    );
    if (!memberResult.rowCount) throw new HttpError(401, 'UNAUTHENTICATED', '尚未登入');

    const existingResult = await client.query(
      `SELECT id::text AS "attemptId", idempotency_fingerprint AS fingerprint
       FROM quiz_attempts
       WHERE user_id = $1 AND idempotency_key = $2`,
      [userId, idempotencyKey],
    );
    const existing = existingResult.rows[0];
    if (existing) {
      const existingFingerprint = Buffer.from(existing.fingerprint);
      if (existingFingerprint.length !== fingerprint.length || !timingSafeEqual(existingFingerprint, fingerprint)) {
        throw new HttpError(409, 'IDEMPOTENCY_KEY_REUSED', '此 Idempotency-Key 已用於不同請求');
      }

      const attempt = await loadAttempt(client, { attemptId: existing.attemptId, userId });
      await client.query('COMMIT');
      transactionStarted = false;
      return sendSuccess(response, attempt);
    }

    const skillResult = await client.query(
      `SELECT s.id AS "skillId",
              COALESCE(NULLIF(btrim(s.title), ''), s.id) AS "skillTitle",
              s.active AS "skillActive", c.active AS "categoryActive"
       FROM skills s
       JOIN skill_categories c ON c.id = s.category_id
       WHERE s.id = $1`,
      [skillId],
    );
    const skill = skillResult.rows[0];
    if (!skill || !skill.skillActive || !skill.categoryActive) {
      throw new HttpError(404, 'SKILL_NOT_FOUND', '技能不存在或已停用');
    }

    const prerequisiteResult = await client.query(
      `SELECT prerequisite.skill_id AS "skillId"
       FROM skill_prerequisites prerequisite
       LEFT JOIN user_skill_completions completion
         ON completion.user_id = $1
        AND completion.skill_id = prerequisite.prerequisite_skill_id
       WHERE prerequisite.skill_id = $2
         AND completion.skill_id IS NULL
       ORDER BY prerequisite.prerequisite_skill_id`,
      [userId, skillId],
    );
    if (prerequisiteResult.rowCount) {
      throw new HttpError(403, 'SKILL_LOCKED', '尚未完成所有先修技能');
    }

    const questionRows = await listPublishedQuestionsForSkill(client, skillId);
    const eligibleQuestions = questionRows.filter(isUsableQuestion);
    if (eligibleQuestions.length < QUIZ_QUESTION_COUNT) {
      throw new HttpError(409, 'INSUFFICIENT_QUESTIONS', '有效題目數量不足');
    }

    const selectedQuestions = selectQuestions(eligibleQuestions, QUIZ_QUESTION_COUNT);
    const catalogVersion = await readActiveCatalogVersion(client);
    const attemptId = randomUUID();
    await client.query(
      `INSERT INTO quiz_attempts (
         id, user_id, skill_id, skill_title_snapshot, catalog_version, status,
         total_questions, idempotency_key, idempotency_fingerprint
       ) VALUES ($1, $2, $3, $4, $5, 'in_progress', $6, $7, $8)`,
      [
        attemptId,
        userId,
        skillId,
        skill.skillTitle,
        catalogVersion,
        QUIZ_QUESTION_COUNT,
        idempotencyKey,
        fingerprint,
      ],
    );

    for (const [index, question] of selectedQuestions.entries()) {
      await client.query(
        `INSERT INTO quiz_attempt_questions (
           attempt_id, question_id, ordinal, prompt_snapshot, choices_snapshot,
           correct_choice_snapshot, explanation_snapshot, answer_mode_snapshot,
           correct_choices_snapshot, choice_explanations_snapshot
         ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9::jsonb, $10::jsonb)`,
        [
          attemptId,
          question.id,
          index + 1,
          question.prompt,
          JSON.stringify(question.choices),
          question.correctChoices[0],
          question.explanation,
          question.answerMode,
          JSON.stringify(question.correctChoices),
          JSON.stringify(question.choiceExplanations),
        ],
      );
    }

    const attempt = await loadAttempt(client, { attemptId, userId });
    await client.query('COMMIT');
    transactionStarted = false;
    return sendSuccess(response, attempt, 201);
  } catch (error) {
    if (transactionStarted) await client.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally {
    client?.release();
  }
});

quizzesRouter.get('/quizzes/attempts/:attemptId', requireMember, async (request, response, next) => {
  const { attemptId } = request.params;
  if (!UUID_PATTERN.test(attemptId)) {
    return next(validationError({ attemptId: '必須是有效的 UUID' }));
  }

  let client;
  let transactionStarted = false;
  try {
    client = await pool.connect();
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    transactionStarted = true;
    const attempt = await loadAttempt(client, { attemptId, userId: request.member.id });
    await client.query('COMMIT');
    transactionStarted = false;
    return sendSuccess(response, attempt);
  } catch (error) {
    if (transactionStarted) await client.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally {
    client?.release();
  }
});
