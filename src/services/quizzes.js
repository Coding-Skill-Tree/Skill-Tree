import { apiRequest } from "./api.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export function createQuizIdempotencyKey() {
  if (typeof globalThis.crypto?.randomUUID !== "function") {
    throw new Error("此瀏覽器無法安全產生測驗請求 ID。");
  }
  return globalThis.crypto.randomUUID();
}

export function startQuizAttempt(skillId, idempotencyKey) {
  if (typeof skillId !== "string" || !skillId.trim() || skillId !== skillId.trim()) {
    throw new TypeError("skillId 必須是沒有前後空白的非空字串。");
  }
  if (typeof idempotencyKey !== "string" || !UUID_PATTERN.test(idempotencyKey)) {
    throw new TypeError("請提供 UUID 格式的 Idempotency-Key。");
  }

  return apiRequest("/quizzes/attempts", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ skillId }),
  });
}

export function getQuizAttempt(attemptId) {
  return apiRequest(`/quizzes/attempts/${encodeURIComponent(attemptId)}`);
}
