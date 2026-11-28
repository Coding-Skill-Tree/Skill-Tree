import { useMemo, useRef, useState } from "react";
import "./AcceptanceLab.css";

const AUTOMATED_RECORD = {
  date: "2026-11-26",
  database: "PostgreSQL 17 獨立測試資料庫",
  migrations: "001–010；全新套用後再重跑一次",
  passed: 20,
  total: 20,
};

async function requestJson(url, options = {}) {
  const startedAt = performance.now();
  const response = await fetch(url, {
    credentials: "include",
    ...options,
  });
  const rawBody = await response.text();
  let body = null;
  if (rawBody) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = { raw: rawBody.slice(0, 4000) };
    }
  }
  return {
    response,
    body,
    durationMs: Math.round(performance.now() - startedAt),
  };
}

function isErrorEnvelope(body, code) {
  return body?.success === false
    && body?.error?.code === code
    && typeof body.error.message === "string"
    && typeof body.error.requestId === "string"
    && body.error.requestId.length > 0;
}

function validateStatus(response, body, code) {
  return response.status === 401
    && isErrorEnvelope(body, code);
}

function checkFromResponse({
  response,
  body,
  durationMs,
  expected,
  summary,
  path,
}) {
  const databaseUnavailable = body?.error?.code === "DATABASE_UNAVAILABLE";
  const serviceUnavailable = response.status === 502 || response.status === 503;
  const blocked = databaseUnavailable || serviceUnavailable;
  return {
    ok: expected && !blocked,
    blocked,
    blocker: databaseUnavailable ? "database" : serviceUnavailable ? "service" : null,
    status: response.status,
    durationMs,
    summary: databaseUnavailable
      ? "API 有回應，但 PostgreSQL 尚未連線；先啟動資料庫再重試。"
      : serviceUnavailable
        ? `健康檢查未就緒（HTTP ${response.status}）；請確認後端服務已啟動。`
        : summary,
    path,
    body,
  };
}

const STEPS = [
  {
    id: "e01",
    issue: "P2-E-01",
    title: "服務與環境",
    description: "確認 API 可啟動、資料庫連得上，瀏覽器可通過題庫 PUT 的 CORS 預檢。",
    checks: [
      {
        id: "health",
        title: "API 健康檢查",
        method: "GET",
        path: "/api/health",
        expected: "HTTP 200；success=true，資料庫 connected。",
        run: async () => {
          const result = await requestJson("/api/health");
          const ok = result.response.status === 200
            && result.body?.success === true
            && result.body?.data?.status === "ok"
            && result.body?.data?.database === "connected";
          return checkFromResponse({
            ...result,
            expected: ok,
            summary: ok ? "API 正常回應，PostgreSQL 連線成功。" : "健康檢查未符合預期。",
            path: "/api/health",
          });
        },
      },
      {
        id: "cors-put",
        title: "題庫 PUT 跨來源預檢",
        method: "OPTIONS → PUT",
        path: "http://<host>:3000/api/admin/questions/0",
        expected: "瀏覽器預檢允許 PUT；實際請求只探測不存在的 ID，不會寫入資料。",
        run: async () => {
          const apiOrigin = `${window.location.protocol}//${window.location.hostname}:3000`;
          const path = "/api/admin/questions/0";
          try {
            const result = await requestJson(`${apiOrigin}${path}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: "{}",
            });
            const validProbeResponse = (result.response.status === 401
              && isErrorEnvelope(result.body, "ADMIN_UNAUTHENTICATED"))
              || (result.response.status === 404
                && isErrorEnvelope(result.body, "QUESTION_NOT_FOUND"));
            return checkFromResponse({
              ...result,
              expected: validProbeResponse,
              summary: validProbeResponse
                ? `PUT 預檢已通過；探測請求由 API 安全拒絕（${result.body.error.code}），沒有修改題目。`
                : "瀏覽器成功送出請求，但 API 回應不符合安全探測的預期。",
              path: `${apiOrigin}${path}`,
            });
          } catch {
            return {
              ok: false,
              blocked: true,
              status: null,
              durationMs: 0,
              path,
              summary: `CORS 預檢沒有完成。請確認 API 已啟動，且 APP_ORIGINS 包含 ${window.location.origin}。`,
              body: null,
            };
          }
        },
      },
    ],
  },
  {
    id: "e06",
    issue: "P2-E-06",
    title: "API 格式與欄位驗證",
    description: "送出不合法註冊資料，確認錯誤 envelope、HTTP 狀態、欄位說明和 requestId。",
    checks: [
      {
        id: "validation",
        title: "欄位錯誤契約",
        method: "POST",
        path: "/api/auth/register",
        expected: "HTTP 400；VALIDATION_ERROR 含 email、password 欄位及 requestId。",
        run: async () => {
          const result = await requestJson("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "not-an-email", password: "weak" }),
          });
          const fields = result.body?.error?.fields;
          const ok = result.response.status === 400
            && isErrorEnvelope(result.body, "VALIDATION_ERROR")
            && typeof fields?.email === "string"
            && typeof fields?.password === "string";
          return checkFromResponse({
            ...result,
            expected: ok,
            summary: ok ? "欄位錯誤符合共用 API 契約；無效資料在寫入前被拒絕。" : "驗證錯誤格式與預期不符。",
            path: "/api/auth/register",
          });
        },
      },
    ],
  },
  {
    id: "e02",
    issue: "P2-E-02",
    title: "PostgreSQL 與 Schema",
    description: "檢視獨立測試資料庫的 migrations、checksum、核心資料約束及 API 整合測試證據。",
    evidence: true,
    checks: [],
  },
  {
    id: "e03",
    issue: "P2-E-03",
    title: "會員驗證與 Session",
    description: "驗證會員與管理員身份由 HttpOnly Session cookie 決定，並檢查重設驗證碼錯誤回應。",
    checks: [
      {
        id: "member-session",
        title: "會員身份端點",
        method: "GET",
        path: "/api/me",
        expected: "有會員 Session 時回傳會員資料；未登入時為 401 UNAUTHENTICATED。",
        run: async () => {
          const result = await requestJson("/api/me");
          const ok = result.response.status === 200
            ? result.body?.success === true && typeof result.body?.data?.userId === "string"
            : validateStatus(result.response, result.body, "UNAUTHENTICATED");
          return checkFromResponse({
            ...result,
            expected: ok,
            summary: result.response.status === 200
              ? "會員 Session 有效，回傳身份由伺服器確認。"
              : ok ? "目前沒有會員 Session；API 正確拒絕匿名讀取。" : "會員身份端點回應不符合預期。",
            path: "/api/me",
          });
        },
      },
      {
        id: "reset-code",
        title: "重設驗證碼",
        method: "POST",
        path: "/api/auth/reset-password/verify",
        expected: "無效六位數驗證碼回 HTTP 400 INVALID_OR_EXPIRED_CODE。",
        run: async () => {
          const result = await requestJson("/api/auth/reset-password/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "acceptance@example.test", code: "000000" }),
          });
          const ok = result.response.status === 400
            && isErrorEnvelope(result.body, "INVALID_OR_EXPIRED_CODE");
          return checkFromResponse({
            ...result,
            expected: ok,
            summary: ok ? "無效驗證碼以通用錯誤回覆；驗收只使用不存在的測試 Email。" : "重設驗證碼回應不符合預期。",
            path: "/api/auth/reset-password/verify",
          });
        },
      },
      {
        id: "admin-session",
        title: "管理員身份端點",
        method: "GET",
        path: "/api/admin/me",
        expected: "有管理員 Session 時回傳管理員資料；未登入時為 401 ADMIN_UNAUTHENTICATED。",
        run: async () => {
          const result = await requestJson("/api/admin/me");
          const ok = result.response.status === 200
            ? result.body?.success === true && typeof result.body?.data?.adminId === "string"
            : validateStatus(result.response, result.body, "ADMIN_UNAUTHENTICATED");
          return checkFromResponse({
            ...result,
            expected: ok,
            summary: result.response.status === 200
              ? "管理員 Session 有效，身份由伺服器確認。"
              : ok ? "目前沒有管理員 Session；API 正確拒絕匿名存取。" : "管理員身份端點回應不符合預期。",
            path: "/api/admin/me",
          });
        },
      },
    ],
  },
  {
    id: "e04",
    issue: "P2-E-04",
    title: "技能目錄與會員進度",
    description: "比對技能目錄、會員進度與學習歷史 API 的識別欄位、版本和分頁契約。",
    checks: [
      {
        id: "catalog",
        title: "技能目錄識別欄位",
        method: "GET",
        path: "/api/skills",
        expected: "成功回應含 catalogVersion、categories、skills；每個技能有 skillId。",
        run: async (context) => {
          const result = await requestJson("/api/skills");
          const data = result.body?.data;
          const ok = result.response.status === 200
            && result.body?.success === true
            && (typeof data?.catalogVersion === "number" || typeof data?.catalogVersion === "string")
            && Array.isArray(data?.categories)
            && Array.isArray(data?.skills)
            && data.skills.every((skill) => typeof skill.skillId === "string" && skill.skillId.length > 0);
          if (ok) context.catalogVersion = data.catalogVersion;
          return checkFromResponse({
            ...result,
            expected: ok,
            summary: ok
              ? `目錄契約正確；${data.skills.length} 個技能節點，版本 ${data.catalogVersion}。`
              : "技能目錄結構與預期不符。",
            path: "/api/skills",
          });
        },
      },
      {
        id: "progress",
        title: "會員進度版本與 revision",
        method: "GET",
        path: "/api/progress",
        expected: "有會員 Session 時版本與目錄相同，完成清單使用 skillId；否則驗證 401 保護。",
        run: async (context) => {
          const result = await requestJson("/api/progress");
          const data = result.body?.data;
          const ok = result.response.status === 200
            ? result.body?.success === true
              && data?.catalogVersion === context.catalogVersion
              && typeof data?.revision === "string"
              && Array.isArray(data?.completedSkillIds)
              && data.completedSkillIds.every((skillId) => typeof skillId === "string")
            : validateStatus(result.response, result.body, "UNAUTHENTICATED");
          return checkFromResponse({
            ...result,
            expected: ok,
            summary: result.response.status === 200
              ? ok ? "會員進度版本與目錄一致，revision 和 skillId 格式正確。" : "會員進度與技能目錄契約不一致。"
              : ok ? "目前沒有會員 Session；進度資料正確受到身份保護。" : "會員進度端點回應不符合預期。",
            path: "/api/progress",
          });
        },
      },
      {
        id: "history",
        title: "會員學習歷史",
        method: "GET",
        path: "/api/progress/history",
        expected: "登入時回傳 items 與 nextCursor；未登入時以 401 保護。",
        run: async () => {
          const result = await requestJson("/api/progress/history");
          const data = result.body?.data;
          const validItems = Array.isArray(data?.items)
            && data.items.every((item) => typeof item.activityId === "string"
              && typeof item.skillId === "string"
              && typeof item.skillTitle === "string"
              && typeof item.completedAt === "string"
              && Number.isInteger(item.result?.correctCount)
              && Number.isInteger(item.result?.totalQuestions)
              && typeof item.result?.passed === "boolean");
          const ok = result.response.status === 200
            ? result.body?.success === true
              && validItems
              && (data.nextCursor === null || typeof data.nextCursor === "string")
            : validateStatus(result.response, result.body, "UNAUTHENTICATED");
          return checkFromResponse({
            ...result,
            expected: ok,
            summary: result.response.status === 200
              ? ok ? `學習歷史契約正確；目前回傳 ${data.items.length} 筆活動。` : "學習歷史回應格式不符合契約。"
              : ok ? "目前沒有會員 Session；學習歷史正確受到身份保護。" : "學習歷史端點回應不符合預期。",
            path: "/api/progress/history",
          });
        },
      },
    ],
    pending: [
      "這個隔離驗收資料庫尚未載入正式技能資料，目前 0 個技能節點；需載入 B/C 確認的目錄後驗收內容與完成進度。",
    ],
  },
  {
    id: "e05",
    issue: "P2-E-05",
    title: "題庫管理與 C 端使用",
    description: "確認題庫管理端點受管理員身份保護；正式題數和正解不外洩須配合正式內容與 C 測驗服務驗收。",
    checks: [
      {
        id: "question-summary",
        title: "管理題庫摘要權限",
        method: "GET",
        path: "/api/admin/questions/summary",
        expected: "管理員登入時回題庫統計；未登入時為 401 ADMIN_UNAUTHENTICATED。",
        run: async () => {
          const result = await requestJson("/api/admin/questions/summary");
          const data = result.body?.data;
          const ok = result.response.status === 200
            ? result.body?.success === true
              && Number.isInteger(data?.total)
              && Array.isArray(data?.categories)
              && Array.isArray(data?.recent)
            : validateStatus(result.response, result.body, "ADMIN_UNAUTHENTICATED");
          return checkFromResponse({
            ...result,
            expected: ok,
            summary: result.response.status === 200
              ? "題庫摘要格式正確；此管理端點不會用作 C 端題目 API。"
              : ok ? "目前沒有管理員 Session；管理題庫摘要正確拒絕匿名存取。" : "題庫摘要端點回應不符合預期。",
            path: "/api/admin/questions/summary",
          });
        },
      },
    ],
    pending: [
      "正式題目由 B/C 確認；每個啟用技能至少 5 題，需在正式內容資料上執行 npm run db:question-coverage。",
      "C 測驗服務尚未接入；需再驗證題目快照、作答、計分、歷史與正解不出現在瀏覽器回應。",
    ],
  },
  {
    id: "e07",
    issue: "P2-E-07",
    title: "跨模組整合",
    description: "目前可驗收 E 的 API 與契約；真實 B/C/D 服務尚未接入，因此跨模組端對端仍待確認。",
    checks: [],
    pending: [
      "以 B/C/D 真實服務取代契約替身，跑會員登入、技能進度、測驗作答和管理後台的跨模組流程。",
      "實際驗證成功、驗證錯誤、未登入、權限不足、資料庫錯誤及重複請求。",
    ],
  },
];

function safeOutput(value) {
  if (Array.isArray(value)) return value.map(safeOutput);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    if (/password|token|secret|cookie|authorization|session/iu.test(key)) return [key, "[已遮蔽]"];
    if (key.toLowerCase() === "email" && typeof item === "string") {
      const [name = "", domain = ""] = item.split("@");
      return [key, `${name.slice(0, 1)}***@${domain}`];
    }
    return [key, safeOutput(item)];
  }));
}

function statusText(status, blocker) {
  if (status === "pass") return "通過";
  if (status === "fail") return "未通過";
  if (status === "blocked" && blocker === "database") return "資料庫未就緒";
  if (status === "blocked" && blocker === "service") return "服務未就緒";
  if (status === "blocked") return "無法連線";
  if (status === "running") return "執行中";
  return "尚未執行";
}

function normalizeCheckResult(result, check) {
  return {
    ...result,
    body: safeOutput(result.body),
    blocker: result.blocker ?? null,
    state: result.blocked ? "blocked" : result.ok ? "pass" : "fail",
    title: check.title,
    method: check.method,
    expected: check.expected,
  };
}

function thrownCheckResult(error, check) {
  const isNetworkError = error instanceof TypeError && /fetch|network/iu.test(error.message);
  return {
    state: isNetworkError ? "blocked" : "fail",
    blocker: isNetworkError ? "network" : null,
    status: null,
    durationMs: 0,
    title: check.title,
    method: check.method,
    path: check.path,
    expected: check.expected,
    summary: isNetworkError
      ? "連不到本機 API；這項尚未驗收。先啟動 PostgreSQL 和後端，再重試。"
      : error.message,
    body: null,
  };
}

function skippedCheckResult(check, blocker) {
  const summary = blocker === "database"
    ? "API 健康檢查發現 PostgreSQL 尚未連線，因此先略過此請求。"
    : blocker === "service"
      ? "API 健康檢查未就緒，因此先略過此請求。"
      : "健康檢查未收到 API 回應，因此先略過此請求。";
  return {
    state: "blocked",
    blocker: blocker ?? "network",
    status: null,
    durationMs: 0,
    title: check.title,
    method: check.method,
    path: check.path,
    expected: check.expected,
    summary,
    body: null,
  };
}

function AcceptanceLab() {
  const [activeStep, setActiveStep] = useState(0);
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState("");
  const contextRef = useRef({});
  const step = STEPS[activeStep];
  const executableChecks = useMemo(() => STEPS.flatMap((item) => item.checks), []);
  const completeCount = executableChecks.filter((check) => results[check.id]?.state === "pass").length;
  const failedCount = executableChecks.filter((check) => results[check.id]?.state === "fail").length;
  const blockedCount = executableChecks.filter((check) => results[check.id]?.state === "blocked").length;
  const databaseBlockedCount = executableChecks.filter((check) => results[check.id]?.blocker === "database").length;
  const serviceBlockedCount = executableChecks.filter((check) => results[check.id]?.blocker === "service").length;
  const networkBlockedCount = Math.max(0, blockedCount - databaseBlockedCount - serviceBlockedCount);
  const progress = executableChecks.length
    ? Math.round(((completeCount + failedCount) / executableChecks.length) * 100)
    : 0;

  async function runStep(stepIndex = activeStep) {
    const selected = STEPS[stepIndex];
    if (!selected.checks.length || running) return;
    setRunning(true);
    setNotice("");
    let apiUnavailable = null;
    for (const check of selected.checks) {
      if (apiUnavailable) {
        setResults((current) => ({ ...current, [check.id]: skippedCheckResult(check, apiUnavailable) }));
        continue;
      }
      setResults((current) => ({
        ...current,
        [check.id]: { state: "running", title: check.title },
      }));
      try {
        const result = await check.run(contextRef.current);
        const normalized = normalizeCheckResult(result, check);
        setResults((current) => ({ ...current, [check.id]: normalized }));
        if (normalized.state === "blocked" && check.id !== "cors-put") apiUnavailable = normalized.blocker ?? "network";
      } catch (error) {
        const normalized = thrownCheckResult(error, check);
        setResults((current) => ({ ...current, [check.id]: normalized }));
        if (normalized.state === "blocked" && check.id !== "cors-put") apiUnavailable = normalized.blocker ?? "network";
      }
    }
    setRunning(false);
    if (apiUnavailable === "database") setNotice("API 已回應，但 PostgreSQL 尚未就緒；其他 API 請求已略過，啟動資料庫後可重試。");
    else if (apiUnavailable === "service") setNotice("API 健康檢查未就緒；其他請求已略過，請檢查後端啟動紀錄。");
    else if (apiUnavailable) setNotice("目前無法連線到後端；其他請求已略過，啟動服務後可重試。");
  }

  async function runAll() {
    if (running) return;
    setResults({});
    contextRef.current = {};
    setRunning(true);
    setNotice("");
    let apiUnavailable = null;
    for (const selected of STEPS) {
      for (const check of selected.checks) {
        if (apiUnavailable) {
          setResults((current) => ({ ...current, [check.id]: skippedCheckResult(check, apiUnavailable) }));
          continue;
        }
        setResults((current) => ({
          ...current,
          [check.id]: { state: "running", title: check.title },
        }));
        try {
          const result = await check.run(contextRef.current);
          const normalized = normalizeCheckResult(result, check);
          setResults((current) => ({ ...current, [check.id]: normalized }));
          if (normalized.state === "blocked" && check.id !== "cors-put") apiUnavailable = normalized.blocker ?? "network";
        } catch (error) {
          const normalized = thrownCheckResult(error, check);
          setResults((current) => ({ ...current, [check.id]: normalized }));
          if (normalized.state === "blocked" && check.id !== "cors-put") apiUnavailable = normalized.blocker ?? "network";
        }
      }
    }
    setRunning(false);
    setNotice(apiUnavailable === "database"
      ? "API 已回應，但 PostgreSQL 尚未就緒；依賴資料庫的檢查已略過。啟動資料庫後請重試。"
      : apiUnavailable === "service"
        ? "API 健康檢查未就緒；剩餘檢查已略過，請檢查後端啟動紀錄。"
        : apiUnavailable
          ? "後端 API 沒有回應；剩餘檢查已略過，啟動服務後請重試。"
          : "可執行項目已逐項完成；仍待接入項目已另外標示。");
  }

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText("npm run test:api");
      setNotice("已複製 npm run test:api；執行前請確認 TEST_DATABASE_URL 指向獨立測試資料庫。");
    } catch {
      setNotice("請在專案終端機執行 npm run test:api，並先設定獨立 TEST_DATABASE_URL。");
    }
  }

  return (
    <main className="acceptance-lab">
      <header className="acceptance-header">
        <div>
          <p className="acceptance-eyebrow">SKILL TREE · BACKEND QA</p>
          <h1>共用後端驗收實驗室</h1>
          <p className="acceptance-lead">按步驟跑 API 檢查。每一步都會顯示實際 HTTP 狀態、回應內容和驗收判定。</p>
        </div>
        <div className="acceptance-header-meta">
          <span className="acceptance-dev-badge">本機開發工具</span>
          <a href="/workbench">查看前後端資料流工作台 ↗</a>
          <a href="#acceptance-automated">查看資料庫測試紀錄 ↓</a>
        </div>
      </header>

      <section className="acceptance-overview" aria-label="驗收總覽">
        <div className="acceptance-progress-copy">
          <div>
            <strong>即時 API 檢查</strong>
            <span>
              {completeCount} / {executableChecks.length} 通過
              {failedCount ? ` · ${failedCount} 驗收未通過` : ""}
              {databaseBlockedCount ? ` · ${databaseBlockedCount} 資料庫未就緒` : ""}
              {serviceBlockedCount ? ` · ${serviceBlockedCount} 服務未就緒` : ""}
              {networkBlockedCount ? ` · ${networkBlockedCount} 無法連線` : ""}
            </span>
          </div>
          <div className="acceptance-progress-track" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress} role="progressbar">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
        <button className="acceptance-run-all" type="button" onClick={runAll} disabled={running}>
          {running ? "逐項執行中…" : blockedCount ? "重新檢查 API" : "執行所有可跑檢查"}
        </button>
      </section>

      {blockedCount > 0 && (
        <aside className="acceptance-connection-notice" role="status">
          <span className="acceptance-connection-icon">i</span>
          <div>
            <strong>{databaseBlockedCount
              ? "API 已回應，但資料庫尚未就緒；這些項目尚未驗收。"
              : serviceBlockedCount
                ? "API 健康檢查未就緒；這些項目尚未驗收。"
                : "後端目前無法連線，這些項目尚未驗收。"}</strong>
            <p>{databaseBlockedCount
              ? <>先啟動 PostgreSQL，再於專案根目錄執行 <code>npm run dev:api</code>；回到這頁按「重新檢查 API」。</>
              : serviceBlockedCount
                ? <>先確認 PostgreSQL 已啟動，再於專案根目錄執行 <code>npm run dev:api</code>；如果仍未就緒，檢查後端啟動紀錄。</>
                : <>先確認 PostgreSQL 已啟動，再於專案根目錄執行 <code>npm run dev:api</code>；回到這頁按「重新檢查 API」。</>}</p>
          </div>
        </aside>
      )}

      <div className="acceptance-workspace">
        <nav className="acceptance-steps" aria-label="驗收步驟">
          <p className="acceptance-section-label">驗收順序</p>
          {STEPS.map((item, index) => {
            const itemChecks = (item.checks ?? []).map((check) => results[check.id]);
            const blocker = itemChecks.find((result) => result?.state === "blocked")?.blocker;
            const status = itemChecks.some((result) => result?.state === "fail")
              ? "fail"
              : itemChecks.some((result) => result?.state === "blocked")
                ? "blocked"
              : item.pending?.length && itemChecks.length && itemChecks.every((result) => result?.state === "pass")
                ? "partial"
              : itemChecks.length && itemChecks.every((result) => result?.state === "pass")
                ? "pass"
                : item.evidence ? "evidence"
                : item.pending?.length ? "pending" : "idle";
            return (
              <button
                className={`acceptance-step ${activeStep === index ? "is-active" : ""}`}
                key={item.id}
                onClick={() => setActiveStep(index)}
                type="button"
                aria-current={activeStep === index ? "step" : undefined}
              >
                <span className={`acceptance-step-number state-${status}`}>{status === "pass" ? "✓" : status === "fail" ? "!" : String(index + 1).padStart(2, "0")}</span>
                <span className="acceptance-step-copy">
                  <small>{item.issue}</small>
                  <strong>{item.title}</strong>
                </span>
                <span className={`acceptance-step-status state-${status}`}>{status === "pending" ? "待接入" : status === "partial" ? "部分完成" : status === "evidence" ? "有測試紀錄" : statusText(status, blocker)}</span>
              </button>
            );
          })}
        </nav>

        <section className="acceptance-detail" aria-live="polite">
          <div className="acceptance-detail-heading">
            <div>
              <p className="acceptance-eyebrow">{step.issue} · STEP {String(activeStep + 1).padStart(2, "0")}</p>
              <h2>{step.title}</h2>
              <p>{step.description}</p>
            </div>
            {step.checks.length > 0 && (
              <button className="acceptance-run-step" type="button" onClick={() => runStep()} disabled={running}>
                {running ? "執行中…" : "驗收這一步"}
              </button>
            )}
          </div>

          {step.checks.length > 0 && (
            <div className="acceptance-check-list">
              {step.checks.map((check) => {
                const result = results[check.id];
                const status = result?.state || "idle";
                return (
                  <article className={`acceptance-check state-${status}`} key={check.id}>
                    <div className="acceptance-check-topline">
                      <div className="acceptance-check-title">
                        <span className={`acceptance-check-mark state-${status}`}>{status === "pass" ? "✓" : status === "fail" ? "!" : status === "blocked" ? "↻" : status === "running" ? "…" : "○"}</span>
                        <h3>{check.title}</h3>
                      </div>
                      <span className={`acceptance-pill state-${status}`}>{statusText(status, result?.blocker)}</span>
                    </div>
                    <div className="acceptance-request-line">
                      <code>{check.method}</code>
                      <code>{result?.path || check.path}</code>
                      {result && result.state !== "running" && <span>{typeof result.status === "number" ? `HTTP ${result.status} · ${result.durationMs ?? 0} ms` : "尚未收到 HTTP 回應"}</span>}
                    </div>
                    <p className="acceptance-expected"><b>預期</b>{check.expected}</p>
                    {result?.summary && <p className={`acceptance-result-summary state-${status}`}>{result.summary}</p>}
                    {result?.body && (
                      <details className="acceptance-response">
                        <summary>展開實際 API 回應</summary>
                        <pre>{JSON.stringify(result.body, null, 2)}</pre>
                      </details>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {step.id === "e02" && (
            <section className="acceptance-record" id="acceptance-automated">
              <div className="acceptance-record-heading">
                <span className="acceptance-record-check">✓</span>
                <div>
                  <p className="acceptance-eyebrow">自動化驗收紀錄 · {AUTOMATED_RECORD.date}</p>
                  <h3>PostgreSQL migrations 與 API 測試</h3>
                </div>
              </div>
              <div className="acceptance-record-stats">
                <div><strong>{AUTOMATED_RECORD.passed}/{AUTOMATED_RECORD.total}</strong><span>測試通過</span></div>
                <div><strong>{AUTOMATED_RECORD.migrations}</strong><span>migration 套用與 checksum</span></div>
                <div><strong>{AUTOMATED_RECORD.database}</strong><span>測試環境</span></div>
              </div>
              <p className="acceptance-record-note">這筆 20/20 紀錄是在 2026-11-26 以本機獨立資料庫執行；它不會自動對應之後的 Git commit。合併前請在 PR head 重新執行一次。</p>
              <button className="acceptance-copy-command" type="button" onClick={copyCommand}>複製重新執行指令</button>
              <p className="acceptance-command-note">專案終端機執行 <code>npm run test:api</code>。runner 只接受資料庫名稱含 test 的獨立資料庫，不會 drop 資料庫。</p>
            </section>
          )}

          {step.evidence && (
            <section className="acceptance-evidence-list">
              <p className="acceptance-section-label">這份紀錄涵蓋</p>
              <ul>
                <li>migration 全新套用與重跑、checksum 一致性</li>
                <li>API 成功／錯誤格式、CORS、會員與管理員 Session</li>
                <li>忘記密碼防 Email 探測、重設 token、登出與停權</li>
                <li>目錄版本、進度 revision 冪等性、題庫資料篩選與題數門檻</li>
                <li>啟動、健康檢查、SIGTERM 關閉及測試資料庫安全檢查</li>
              </ul>
            </section>
          )}

          {step.pending?.length > 0 && (
            <section className="acceptance-pending">
              <div className="acceptance-pending-heading"><span>待接入</span><strong>此 Issue 尚有真實資料或服務未到位</strong></div>
              <ul>{step.pending.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          )}

          <footer className="acceptance-detail-footer">
            <button type="button" className="acceptance-previous" onClick={() => setActiveStep((index) => Math.max(0, index - 1))} disabled={activeStep === 0 || running}>上一步</button>
            <span>{activeStep + 1} / {STEPS.length}</span>
            <button type="button" className="acceptance-next" onClick={() => setActiveStep((index) => Math.min(STEPS.length - 1, index + 1))} disabled={activeStep === STEPS.length - 1 || running}>下一步 →</button>
          </footer>
          {notice && <p className="acceptance-notice" role="status">{notice}</p>}
        </section>
      </div>
      <p className="acceptance-safety-note">安全說明：頁面只使用目前瀏覽器的 Session cookie；不會要求或顯示密碼、真實重設 token，也不會建立、修改或刪除資料。</p>
    </main>
  );
}

export default AcceptanceLab;
