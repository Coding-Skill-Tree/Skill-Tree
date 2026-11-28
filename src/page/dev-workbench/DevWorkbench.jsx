import { useEffect, useMemo, useState } from "react";
import "./DevWorkbench.css";

const FLOW_STEPS = [
  {
    number: "01",
    title: "前端畫面",
    description: "會員、技能地圖與測驗前端介面",
    sourceIds: ["frontend-register-page", "frontend-login-page", "frontend-workbench", "auth-flow-doc"],
    firstSourceId: "frontend-register-page",
  },
  {
    number: "02",
    title: "前端 API adapter",
    description: "會員 Session、共用請求與 C 測驗冪等鍵 adapter",
    sourceIds: ["frontend-api", "frontend-auth-api", "frontend-quiz-api"],
    firstSourceId: "frontend-auth-api",
  },
  {
    number: "03",
    title: "共用 Express",
    description: "安全 headers、rate limit、身份與錯誤處理",
    sourceIds: ["backend-app", "member-auth-routes", "member-session-service"],
    firstSourceId: "backend-app",
  },
  {
    number: "04",
    title: "模組 routes 與 services",
    description: "會員、管理、題庫、技能與歷史資料橋接",
    sourceIds: ["email-code-service", "admin-routes", "question-bank", "learning-history", "xp-event-producer"],
    firstSourceId: "question-bank",
  },
  {
    number: "05",
    title: "PostgreSQL 與契約",
    description: "Schema migration、資料責任與操作文件",
    sourceIds: ["migration-010", "migration-011", "migration-012", "api-contract", "integration-guide-index", "integration-guide-d"],
    firstSourceId: "migration-012",
  },
];

const METHOD_ORDER = ["get", "post", "put", "patch", "delete"];
const API_GROUPS = [
  { id: "all", label: "全部" },
  { id: "member", label: "會員" },
  { id: "learning", label: "目錄與歷史" },
  { id: "quiz", label: "測驗（C PR #93 未合併）" },
  { id: "admin", label: "管理後台" },
];

function belongsToApiGroup(operation, groupId) {
  if (groupId === "all") return true;
  if (groupId === "member") return operation.path.startsWith("/api/auth/") || operation.path.startsWith("/api/me");
  if (groupId === "learning") return operation.path.startsWith("/api/skills") || operation.path.startsWith("/api/progress");
  if (groupId === "quiz") return operation.path.startsWith("/api/quizzes/");
  if (groupId === "admin") return operation.path.startsWith("/api/admin/");
  return false;
}

async function getJson(path) {
  const response = await fetch(path, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message || `HTTP ${response.status}`);
  }
  return payload?.data ?? payload;
}

function getOperations(document) {
  return Object.entries(document?.paths ?? {}).flatMap(([path, pathItem]) =>
    METHOD_ORDER.flatMap((method) => {
      const operation = pathItem[method];
      if (!operation) return [];
      return [{
        method: method.toUpperCase(),
        path,
        summary: operation.summary || "尚未補上說明",
        tags: operation.tags || [],
        auth: operation.security?.length ? "需登入" : "公開",
        operationId: operation.operationId || `${method}-${path}`,
      }];
    }),
  );
}

function statusLabel(result, readyLabel) {
  if (result.loading) return "讀取中";
  if (result.error) return "未連線";
  return readyLabel;
}

function DevWorkbench() {
  const [snapshot, setSnapshot] = useState({ loading: true, error: null });
  const [sourceList, setSourceList] = useState([]);
  const [selectedSourceId, setSelectedSourceId] = useState("question-bank");
  const [source, setSource] = useState({ loading: true, error: null });
  const [refreshKey, setRefreshKey] = useState(0);
  const [apiGroup, setApiGroup] = useState("quiz");

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      getJson("/api/health"),
      getJson("/api/openapi.json"),
      getJson("/api/dev/workbench/status"),
      getJson("/api/dev/workbench/sources"),
    ]).then(([healthResult, openApiResult, statusResult, sourcesResult]) => {
      if (cancelled) return;
      const messages = [healthResult, openApiResult, statusResult, sourcesResult]
        .filter((result) => result.status === "rejected")
        .map((result) => result.reason.message);
      setSnapshot({
        loading: false,
        error: messages.length ? [...new Set(messages)].join("；") : null,
        health: healthResult.status === "fulfilled" ? healthResult.value : null,
        openApi: openApiResult.status === "fulfilled" ? openApiResult.value : null,
        status: statusResult.status === "fulfilled" ? statusResult.value : null,
      });
      if (sourcesResult.status === "fulfilled") setSourceList(sourcesResult.value);
    });
    return () => { cancelled = true; };
  }, [refreshKey]);

  useEffect(() => {
    if (!selectedSourceId) return undefined;
    let cancelled = false;
    getJson(`/api/dev/workbench/sources/${encodeURIComponent(selectedSourceId)}`)
      .then((result) => {
        if (!cancelled) setSource({ loading: false, error: null, ...result });
      })
      .catch((error) => {
        if (!cancelled) setSource({ loading: false, error: error.message });
      });
    return () => { cancelled = true; };
  }, [selectedSourceId]);

  const operations = useMemo(() => getOperations(snapshot.openApi), [snapshot.openApi]);
  const selectedOperations = operations.filter((operation) => belongsToApiGroup(operation, apiGroup));
  const latestMigration = snapshot.status?.migrations?.at(-1);

  function chooseStep(step) {
    selectSource(step.firstSourceId);
    document.querySelector("#workbench-source")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function selectSource(sourceId) {
    if (sourceId === selectedSourceId) return;
    setSource({ loading: true, error: null });
    setSelectedSourceId(sourceId);
  }

  function refreshSnapshot() {
    setSnapshot((current) => ({ ...current, loading: true, error: null }));
    setRefreshKey((value) => value + 1);
  }

  return (
    <main className="dev-workbench">
      <header className="workbench-header">
        <div>
          <p className="workbench-eyebrow">SKILL TREE · LOCAL DEVELOPMENT</p>
          <h1>前後端開發工作台</h1>
          <p className="workbench-lead">
            用一張流程圖連起畫面、API、Express、資料服務和資料庫；選節點可檢視白名單內的實際程式碼。
          </p>
        </div>
        <div className="workbench-header-actions">
          <span className="workbench-dev-badge">只供本機開發</span>
          <a href="/acceptance">開啟驗收實驗室</a>
        </div>
      </header>

      <section className="workbench-overview" aria-label="目前服務狀態">
        <div className="workbench-overview-copy">
          <p className="workbench-section-label">即時狀態</p>
          <h2>先確認服務，再看資料流</h2>
          <p>此區只讀取健康狀態、OpenAPI 規格、migration 名稱和套用時間，不讀取會員資料或環境變數。</p>
        </div>
        <div className="workbench-status-grid">
          <div className={`workbench-status-card ${snapshot.health?.database === "connected" ? "is-ready" : ""}`}>
            <span>API / PostgreSQL</span>
            <strong>{snapshot.loading ? "檢查中" : snapshot.error ? "未連線" : snapshot.health?.database === "connected" ? "已連線" : "未就緒"}</strong>
          </div>
          <div className="workbench-status-card">
            <span>OpenAPI routes</span>
            <strong>{snapshot.openApi ? `${operations.length} 支` : statusLabel(snapshot, "可讀取")}</strong>
          </div>
          <div className="workbench-status-card">
            <span>最近 migration</span>
            <strong>{latestMigration?.name ?? statusLabel(snapshot, "尚無紀錄")}</strong>
          </div>
          <button className="workbench-refresh" type="button" onClick={refreshSnapshot} disabled={snapshot.loading}>
            重新檢查
          </button>
        </div>
        {snapshot.error && <p className="workbench-alert" role="status">{snapshot.error}。請先啟動本機 API 和 PostgreSQL。</p>}
      </section>

      <section className="workbench-flow-section" aria-labelledby="workbench-flow-title">
        <div className="workbench-section-heading">
          <div>
            <p className="workbench-section-label">一筆請求會經過這些層</p>
            <h2 id="workbench-flow-title">從畫面一路追到資料表</h2>
          </div>
          <a className="workbench-doc-link" href="/api/docs">開啟互動式 API 文件 ↗</a>
        </div>
        <ol className="workbench-flow">
          {FLOW_STEPS.map((step, index) => (
            <li className="workbench-flow-item" key={step.number}>
              <button type="button" className="workbench-flow-card" onClick={() => chooseStep(step)}>
                <span className="workbench-flow-number">{step.number}</span>
                <strong>{step.title}</strong>
                <span>{step.description}</span>
                <small>{step.sourceIds.length} 個相關來源檔</small>
              </button>
              {index < FLOW_STEPS.length - 1 && <span className="workbench-flow-arrow" aria-hidden="true">→</span>}
            </li>
          ))}
        </ol>
      </section>

      <section className="workbench-grid">
        <div className="workbench-panel workbench-api-panel">
          <div className="workbench-panel-heading">
            <div>
              <p className="workbench-section-label">前後端 API 清單</p>
            <h2>依模組查看 API 端點</h2>
            </div>
            <span className="workbench-count">{selectedOperations.length} 支</span>
          </div>
          <div className="workbench-api-filters" role="group" aria-label="選擇 API 模組">
            {API_GROUPS.map((group) => {
              const count = operations.filter((operation) => belongsToApiGroup(operation, group.id)).length;
              return (
                <button
                  type="button"
                  key={group.id}
                  className={apiGroup === group.id ? "is-active" : ""}
                  aria-pressed={apiGroup === group.id}
                  onClick={() => setApiGroup(group.id)}
                >
                  {group.label}<span>{count}</span>
                </button>
              );
            })}
          </div>
          {selectedOperations.length ? (
            <ul className="workbench-endpoint-list">
              {selectedOperations.map((operation) => (
                <li key={operation.operationId}>
                  <span className={`workbench-method method-${operation.method.toLowerCase()}`}>{operation.method}</span>
                  <code>{operation.path}</code>
                  <p>{operation.summary}</p>
                  <small>{operation.auth} · {operation.tags.join(" / ")}</small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="workbench-empty">
              {snapshot.error
                ? "OpenAPI 尚未載入。"
                : !snapshot.openApi
                  ? "目前讀取中；請確認 OpenAPI 已載入。"
                  : apiGroup === "quiz"
                    ? "目前 E app 只有會員測驗可用性與學習歷史 API；C 的建立與讀題 API 在 PR #93，尚未掛載。答案提交與結算也尚未完成，請先看 C 串接指南。"
                    : "此模組目前沒有已掛載的 API 端點。"}
            </p>
          )}
          <p className="workbench-note">工作台不會送出建立、修改或刪除請求。請到 API 文件檢查 Cookie 驗證和實際回應；寫入測試只連本機測試資料。</p>
        </div>

        <div className="workbench-panel workbench-migration-panel">
          <div className="workbench-panel-heading">
            <div>
              <p className="workbench-section-label">資料庫流程</p>
              <h2>Migration 執行狀態</h2>
            </div>
            <span className="workbench-count">{snapshot.status?.migrations?.length ?? 0}</span>
          </div>
          {snapshot.status?.migrations?.length ? (
            <ol className="workbench-migration-list">
              {snapshot.status.migrations.map((migration) => (
                <li key={migration.name}>
                  <code>{migration.name}</code>
                  <time dateTime={migration.appliedAt}>{new Date(migration.appliedAt).toLocaleString()}</time>
                </li>
              ))}
            </ol>
          ) : (
            <p className="workbench-empty">{snapshot.error ? "無法讀取 migration 紀錄。" : "尚未載入 migration 紀錄。"}</p>
          )}
        </div>
      </section>

      <section className="workbench-panel workbench-source-panel" id="workbench-source">
        <div className="workbench-panel-heading workbench-source-heading">
          <div>
            <p className="workbench-section-label">程式碼導覽</p>
            <h2>選一層看實際實作</h2>
          </div>
          <label className="workbench-source-select">
            <span>來源檔</span>
            <select value={selectedSourceId} onChange={(event) => selectSource(event.target.value)}>
              {sourceList.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
            </select>
          </label>
        </div>
        {source.loading ? <p className="workbench-empty">讀取白名單程式檔中…</p> : source.error ? (
          <p className="workbench-alert" role="status">{source.error}</p>
        ) : (
          <div className="workbench-source-meta">
            <div><strong>{source.label}</strong><code>{source.path}</code></div>
            <pre aria-label={`${source.path} 原始碼`}><code>{source.content}</code></pre>
          </div>
        )}
      </section>

      <footer className="workbench-safety-note">
        <strong>安全範圍</strong>
        <span>此頁僅在 Vite 開發模式註冊；後端讀檔 API 僅接受固定 source ID 白名單，並限制單檔大小。全部是 GET 唯讀請求，不提供任意路徑、SQL、會員資料、密碼、Cookie 或環境設定檢視。</span>
      </footer>
    </main>
  );
}

export default DevWorkbench;
