import { Router } from "express";
import { sendSuccess } from "../lib/api-response.js";
import { requireMember } from "../middleware/require-member.js";
import { validationError, HttpError } from "../lib/http-error.js";
import { pool } from "../db/pool.js";
import { isTutorialReady } from "../data/tutorials.js";
import { selectQuestions } from "../lib/quiz-utils.js";
import { randomUUID, createHash } from "node:crypto";

export const quizzesRouter = Router();

// ===========================================================================
// API 01 建立測驗

quizzesRouter.post(
  "/quizzes/attempts",
  requireMember,
  async (request, response, next) => {
    let client;
    let transactionStarted = false;
    let discardClient = false;

    try {
      const body = request.body ?? {};
      const skillId = body.skillId;
      const idempotencyKey = request.get("Idempotency-Key");
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (
        typeof idempotencyKey !== "string" ||
        idempotencyKey.length !== 36 ||
        !uuidPattern.test(idempotencyKey)
      ) {
        throw validationError({
          idempotencyKey: "Idempotency-Key 格式不正確",
        });
      }

      if (
        typeof skillId !== "string" ||
        skillId.trim().length === 0 ||
        skillId.length > 80
      ) {
        throw validationError({
          skillId: "技能ID必須為非空字串，且不得超過80個字元",
        });
      }
      const idempotencyFingerprint = createHash("sha256")
        .update(JSON.stringify({ skillId }))
        .digest();

      const userId = request.member.id;
      client = await pool.connect();

      await client.query("BEGIN ISOLATION LEVEL READ COMMITTED");
      transactionStarted = true;

      const memberLockResult = await client.query(
        `SELECT id
   FROM users
   WHERE id = $1
     AND suspended_at IS NULL
   FOR UPDATE`,
        [userId],
      );

      if (!memberLockResult.rows[0]) {
        throw new HttpError(401, "UNAUTHENTICATED", "尚未登入");
      }

      const existingAttemptResult = await client.query(
        `SELECT id AS "attemptId",
        skill_id AS "skillId",
        total_questions AS "totalCount",
        status,
        started_at AS "createdAt",
        idempotency_fingerprint AS "idempotencyFingerprint"
        FROM quiz_attempts
        WHERE user_id = $1
        AND idempotency_key = $2`,
        [userId, idempotencyKey],
      );
      const existingAttempt = existingAttemptResult.rows[0];
      if (existingAttempt) {
        if (
          !existingAttempt.idempotencyFingerprint.equals(idempotencyFingerprint)
        ) {
          throw new HttpError(
            409,
            "IDEMPOTENCY_KEY_CONFLICT",
            "相同 Idempotency-key 不可用於不同請求",
          );
        }
        await client.query("COMMIT");
        transactionStarted = false;
        return sendSuccess(
          response,
          {
            attemptId: existingAttempt.attemptId,
            skillId: existingAttempt.skillId,
            totalCount: existingAttempt.totalCount,
            passingScore: 80,
            status: existingAttempt.status,
            createdAt: existingAttempt.createdAt,
          },
          200,
        );
      }

      const skillResult = await client.query(
        `SELECT s.id AS "skillId",
        s.title,
        s.active AS "skillActive",
        c.active AS "categoryActive"
        FROM skills s
        JOIN skill_categories c ON c.id = s.category_id
        WHERE s.id = $1`,
        [skillId],
      );

      const skill = skillResult.rows[0];

      if (!skill || !skill.skillActive || !skill.categoryActive) {
        throw new HttpError(404, "SKILL_NOT_FOUND", "技能不存在或已停用");
      }

      const prerequisiteResult = await client.query(
        `SELECT prerequisite_skill_id AS "prerequisiteSkillId"
        FROM skill_prerequisites
        WHERE skill_id = $1`,
        [skillId],
      );
      const completionResult = await client.query(
        `SELECT skill_id AS "skillId"
    FROM user_skill_completions
    WHERE user_id = $1`,
        [userId],
      );

      const prerequisiteSkillIds = prerequisiteResult.rows.map(
        (row) => row.prerequisiteSkillId,
      );
      const completedSkillIds = completionResult.rows.map((row) => row.skillId);
      const missingPrerequisiteSkillIds = prerequisiteSkillIds.filter(
        (skill) => !completedSkillIds.includes(skill),
      );
      if (missingPrerequisiteSkillIds.length > 0) {
        throw new HttpError(403, "SKILL_LOCKED", "尚未完成所有先修技能", {
          missingPrerequisiteSkillIds,
        });
      }
      if (!isTutorialReady(skillId)) {
        throw new HttpError(409, "TUTORIAL_NOT_READY", "教材尚未準備完成");
      }

      const questionResult = await client.query(
        `SELECT id::text AS "questionId",
          prompt,
          choices,
          answer_mode AS "answerMode",
          correct_choice AS "correctChoice",
          correct_choices AS "correctChoices",
          explanation,
          choice_explanations AS "choiceExplanations"
   FROM questions
   WHERE skill_id = $1
     AND active = true
     AND status = 'published'
     AND deleted_at IS NULL
     AND is_demo = false
     AND answer_mode = 'single'
     AND jsonb_array_length(choices) = 3
     AND correct_choices IN (
       '[0]'::jsonb,
       '[1]'::jsonb,
       '[2]'::jsonb
     )
     AND jsonb_array_length(choice_explanations) = 3
     AND btrim(prompt) <> ''
     AND btrim(explanation) <> ''
     AND NOT EXISTS (
       SELECT 1
       FROM jsonb_array_elements(
         choices || choice_explanations
       ) AS item(value)
       WHERE jsonb_typeof(item.value) <> 'string'
          OR btrim(item.value #>> '{}') = ''
     )`,
        [skillId],
      );

      const availableCount = questionResult.rows.length;
      if (availableCount < 5) {
        throw new HttpError(409, "INSUFFICIENT_QUESTIONS", "有效題目數量不足", {
          availableCount,
          requiredCount: 5,
        });
      }
      const selectedQuestions = selectQuestions(questionResult.rows, 5);

      const catalogResult = await client.query(
        `SELECT COALESCE(MAX(s.catalog_version), 1)::int AS "catalogVersion"
   FROM skills s
   JOIN skill_categories c ON c.id = s.category_id
   WHERE s.active = true
     AND c.active = true`,
      );

      const catalogVersion = catalogResult.rows[0].catalogVersion;
      await client.query(
        `UPDATE quiz_attempts
        SET status = 'cancelled'
        WHERE user_id = $1
        AND skill_id = $2
        AND status = 'in_progress'`,
        [userId, skillId],
      );

      const attemptId = randomUUID();
      const attemptResult = await client.query(
        `INSERT INTO quiz_attempts (id, user_id, skill_id, catalog_version, status, total_questions, skill_title_snapshot, idempotency_key, idempotency_fingerprint)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id AS "attemptId", started_at AS "createdAt"`,
        [
          attemptId,
          userId,
          skillId,
          catalogVersion,
          "in_progress",
          selectedQuestions.length,
          skill.title,
          idempotencyKey,
          idempotencyFingerprint,
        ],
      );

      for (let i = 0; i < selectedQuestions.length; i++) {
        const question = selectedQuestions[i];
        await client.query(
          `INSERT INTO quiz_attempt_questions (
        attempt_id, question_id, ordinal, prompt_snapshot, choices_snapshot, correct_choice_snapshot, explanation_snapshot, answer_mode_snapshot, correct_choices_snapshot, choice_explanations_snapshot)
        VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9::jsonb, $10::jsonb)`,
          [
            attemptId,
            question.questionId,
            i + 1,
            question.prompt,
            JSON.stringify(question.choices),
            question.correctChoice,
            question.explanation,
            question.answerMode,
            JSON.stringify(question.correctChoices),
            JSON.stringify(question.choiceExplanations),
          ],
        );
      }

      await client.query("COMMIT");
      transactionStarted = false;

      sendSuccess(
        response,
        {
          attemptId: attemptResult.rows[0].attemptId,
          skillId: skillId,
          totalCount: selectedQuestions.length,
          passingScore: 80,
          status: "in_progress",
          createdAt: attemptResult.rows[0].createdAt,
        },
        201,
      );
    } catch (error) {
      if (client && transactionStarted) {
        try {
          await client.query("ROLLBACK");
          transactionStarted = false;
        } catch (rollbackError) {
          console.error("Quiz transaction rollback failed:", rollbackError);
          discardClient = true;
        }
      } else if (client) {
        discardClient = true;
      }
      next(error);
    } finally {
      client?.release(discardClient);
    }
  },
);

// ===========================================================================
// API 02 取得題目
quizzesRouter.get(
  "/quizzes/attempts/:attemptId",
  requireMember,

  async (request, response, next) => {
    let client;
    let transactionStarted = false;
    let discardClient = false;

    try {
      const attemptId = request.params.attemptId;
      const userId = request.member.id;
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(attemptId)) {
        throw validationError({
          attemptId: "attemptId 格式不正確",
        });
      }

      client = await pool.connect();
      await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
      transactionStarted = true;

      const attemptResult = await client.query(
        `SELECT id AS "attemptId",
        skill_id AS "skillId",
        total_questions AS "totalCount",
        status
        FROM quiz_attempts
        WHERE id = $1
        AND user_id = $2`,
        [attemptId, userId],
      );

      if (attemptResult.rows.length === 0) {
        throw new HttpError(404, "ATTEMPT_NOT_FOUND", "找不到此測驗");
      }
      const attempt = attemptResult.rows[0];
      if (attempt.status === "cancelled") {
        throw new HttpError(404, "ATTEMPT_NOT_FOUND", "找不到此測驗");
      }

      const questionResult = await client.query(
        `SELECT question_id::text AS "questionId",
        ordinal,
        prompt_snapshot AS "prompt",
        choices_snapshot AS "choices",
        answer_mode_snapshot AS "answerMode",
        selected_choices AS "selectedChoices",
        correct_choices_snapshot AS "correctChoices",
        choice_explanations_snapshot AS "choiceExplanations",
        explanation_snapshot AS "explanation",
        answered_at AS "answeredAt"
        FROM quiz_attempt_questions
        WHERE attempt_id = $1
        ORDER BY ordinal ASC`,
        [attemptId],
      );
      const isOrdinalValid = questionResult.rows.every(
        (question, index) => question.ordinal === index + 1,
      );
      if (
        questionResult.rows.length !== attempt.totalCount ||
        attempt.totalCount !== 5 ||
        !isOrdinalValid
      ) {
        throw new HttpError(500, "INTERNAL_ERROR", "暫時無法取得測驗資料");
      }

      await client.query("COMMIT");
      transactionStarted = false;

      const questions = questionResult.rows.map((question) => {
        const isAnswered = question.answeredAt != null;
        let answer = null;

        if (isAnswered) {
          const isSelectedValid =
            Array.isArray(question.selectedChoices) &&
            question.selectedChoices.length === 1 &&
            [0, 1, 2].includes(question.selectedChoices[0]);
          const isCorrectValid =
            Array.isArray(question.correctChoices) &&
            question.correctChoices.length === 1 &&
            [0, 1, 2].includes(question.correctChoices[0]);
          if (!isSelectedValid || !isCorrectValid) {
            throw new HttpError(500, "INTERNAL_ERROR", "暫時無法取得測驗資料");
          }
          const isCorrect =
            question.selectedChoices[0] === question.correctChoices[0];

          answer = {
            selectedChoices: question.selectedChoices,
            isCorrect: isCorrect,
          };
        }
        return {
          ordinal: question.ordinal,
          prompt: question.prompt,
          answerMode: question.answerMode,
          choices: question.choices,
          answer,
        };
      });
      const answeredCount = questions.filter(
        (question) => question.answer !== null,
      ).length;
      sendSuccess(response, {
        attemptId: attempt.attemptId,
        skillId: attempt.skillId,
        totalCount: attempt.totalCount,
        passingScore: 80,
        status: attempt.status,
        answeredCount: answeredCount,
        questions: questions,
      });
    } catch (error) {
      if (client && transactionStarted) {
        try {
          await client.query("ROLLBACK");
          transactionStarted = false;
        } catch (rollbackError) {
          console.error("Quiz transaction rollback failed:", rollbackError);
          discardClient = true;
        }
      } else if (client) {
        discardClient = true;
      }
      next(error);
    } finally {
      client?.release(discardClient);
    }
  },
);

// ===========================================================================
// API 03 提交單題答案

quizzesRouter.post(
  "/quizzes/attempts/:attemptId/answers",
  requireMember,

  async (request, response, next) => {
    let client;
    let transactionStarted = false;
    let discardClient = false;
    try {
      const attemptId = request.params.attemptId;
      const body = request.body ?? {};
      const ordinal = body.ordinal;
      const selectedChoices = body.selectedChoices;
      const userId = request.member.id;

      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (
        typeof attemptId !== "string" ||
        attemptId.length !== 36 ||
        !uuidPattern.test(attemptId)
      ) {
        throw validationError({
          attemptId: "測驗 Id 格式不正確",
        });
      }
      if (!Number.isInteger(ordinal) || ordinal < 1 || ordinal > 5) {
        throw validationError({
          ordinal: "題號必須為 1 至 5 的整數",
        });
      }
      if (
        !Array.isArray(selectedChoices) ||
        selectedChoices.length !== 1 ||
        !Number.isInteger(selectedChoices[0]) ||
        selectedChoices[0] < 0 ||
        selectedChoices[0] > 2
      ) {
        throw validationError({
          selectedChoices: "必須提供一個介於0至2的選項索引",
        });
      }

      client = await pool.connect();
      await client.query("BEGIN ISOLATION LEVEL READ COMMITTED");
      transactionStarted = true;

      const memberLockResult = await client.query(
        `SELECT id
        FROM users
        WHERE id = $1
        AND suspended_at IS NULL
        FOR UPDATE`,
        [userId],
      );

      if (!memberLockResult.rows[0]) {
        throw new HttpError(401, "UNAUTHENTICATED", "尚未登入");
      }

      const attemptResult = await client.query(
        `SELECT id AS "attemptId",
        skill_id AS "skillId",
        status,
        total_questions AS "totalCount"
        FROM quiz_attempts
        WHERE id = $1
        AND user_id = $2
        FOR UPDATE`,
        [attemptId, userId],
      );
      const attempt = attemptResult.rows[0];
      if (!attempt || attempt.status === "cancelled") {
        throw new HttpError(404, "ATTEMPT_NOT_FOUND", "找不到測驗");
      }

      const questionResult = await client.query(
        `SELECT ordinal AS "ordinal",
        choices_snapshot AS "choices",
        answer_mode_snapshot AS "answerMode",
        correct_choices_snapshot AS "correctChoices",
        selected_choices AS "selectedChoices",
        answered_at AS "answeredAt"
        FROM quiz_attempt_questions
        WHERE attempt_id = $1
        ORDER BY ordinal ASC
        FOR UPDATE`,
        [attemptId],
      );
      const questions = questionResult.rows;
      if (
        attempt.totalCount !== 5 ||
        questions.length !== attempt.totalCount ||
        !questions.every((question, index) => question.ordinal === index + 1)
      ) {
        throw new Error("Invalid quiz question snapshots");
      }

      const question = questions.find((item) => item.ordinal === ordinal);
      if (!question) {
        throw new Error("Quiz question snapshot not found");
      }

      if (
        question.answerMode !== "single" ||
        !Array.isArray(question.choices) ||
        question.choices.length !== 3 ||
        !Array.isArray(question.correctChoices) ||
        question.correctChoices.length !== 1 ||
        !Number.isInteger(question.correctChoices[0]) ||
        question.correctChoices[0] < 0 ||
        question.correctChoices[0] > 2
      ) {
        throw new Error("Invalid quiz question snapshot format");
      }

      const validAnswerStates = questions.every((item) => {
        if (!Array.isArray(item.selectedChoices)) {
          return false;
        }
        if (item.answeredAt === null) {
          return item.selectedChoices.length === 0;
        }

        return (
          item.answeredAt !== undefined &&
          item.selectedChoices.length === 1 &&
          Number.isInteger(item.selectedChoices[0]) &&
          item.selectedChoices[0] >= 0 &&
          item.selectedChoices[0] <= 2
        );
      });
      if (!validAnswerStates) {
        throw new Error("Invalid quiz answer states");
      }

      const answeredCount = questions.filter(
        (item) => item.answeredAt !== null,
      ).length;

      const validAnswerOrder = questions.every((item) => {
        const isAnswered = item.answeredAt !== null;
        const shouldBeAnswered = item.ordinal <= answeredCount;

        return isAnswered === shouldBeAnswered;
      });
      if (!validAnswerOrder) {
        throw new Error("Invalid quiz answer order");
      }

      if (question.answeredAt !== null) {
        const sameAnswer = question.selectedChoices[0] === selectedChoices[0];
        if (!sameAnswer) {
          throw new HttpError(
            409,
            "ANSWER_ALREADY_SUBMITTED",
            "此題已提交答案，不可修改",
          );
        }
        const isCorrect =
          question.selectedChoices[0] === question.correctChoices[0];

        await client.query("COMMIT");
        transactionStarted = false;
        return sendSuccess(
          response,
          {
            attemptId: attempt.attemptId,
            ordinal: question.ordinal,
            answer: { selectedChoices: question.selectedChoices, isCorrect },
            answeredCount,
            totalCount: attempt.totalCount,
            status: attempt.status,
          },
          200,
        );
      }
      if (attempt.status === "completed") {
        throw new HttpError(409, "ATTEMPT_ALREADY_COMPLETED", "測驗已完成");
      }
      const nextOrdinal = answeredCount + 1;
      if (nextOrdinal !== ordinal) {
        throw new HttpError(
          409,
          "INVALID_QUESTION_ORDER",
          "請依照題目順序作答",
        );
      }
      if (ordinal === attempt.totalCount) {
        throw new HttpError(
          501,
          "QUIZ_SETTLEMENT_NOT_IMPLEMENTED",
          "測驗結算功能尚未完成",
        );
      }

      const isCorrect = selectedChoices[0] === question.correctChoices[0];

      const updateResult = await client.query(
        `UPDATE quiz_attempt_questions
          SET selected_choice = $3,
          selected_choices = $4::jsonb,
          answered_at = NOW()
          WHERE attempt_id = $1
          AND ordinal = $2
          AND answered_at IS NULL
          RETURNING ordinal,
          selected_choices AS "selectedChoices",
          answered_at AS "answeredAt"`,
        [
          attemptId,
          ordinal,
          selectedChoices[0],
          JSON.stringify(selectedChoices),
        ],
      );
      if (updateResult.rowCount !== 1) {
        throw new Error("Failed to save quiz answer");
      }
      const updatedQuestion = updateResult.rows[0];
      const nextAnsweredCount = answeredCount + 1;
      const responseData = {
        attemptId: attempt.attemptId,
        ordinal: updatedQuestion.ordinal,
        answer: { selectedChoices: updatedQuestion.selectedChoices, isCorrect },
        answeredCount: nextAnsweredCount,
        totalCount: attempt.totalCount,
        status: attempt.status,
      };
      await client.query("COMMIT");
      transactionStarted = false;
      return sendSuccess(response, responseData, 200);
    } catch (error) {
      if (client && transactionStarted) {
        try {
          await client.query("ROLLBACK");
          transactionStarted = false;
        } catch (rollbackError) {
          console.error("Quiz transaction rollback failed:", rollbackError);
          discardClient = true;
        }
      } else if (client) {
        discardClient = true;
      }
      next(error);
    } finally {
      client?.release(discardClient);
    }
  },
);
