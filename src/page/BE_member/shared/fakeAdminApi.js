// 第一階段的假 API：模擬後台 API 的回應格式（團隊 API 信封 success / data / error）。
// 之後串 API 時，把這些函式換成 fetch，回傳一樣的 { status, body } 即可，頁面不用改。
// 示範用的登入狀態、登入失敗次數、停權變更存在 sessionStorage（關掉分頁就清空）。

const DELAY_MS = 500;
const PAGE_SIZE = 20;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 網址 ?demo=... 可模擬各種狀態（示範用）
export const demo = new URLSearchParams(window.location.search).get("demo");

const ok = (data) => ({ status: 200, body: { success: true, data } });
const fail = (status, code, message, fields) => ({
  status,
  body: { success: false, error: { code, message, ...(fields ? { fields } : {}) } },
});
const ADMIN_UNAUTHENTICATED = () => fail(401, "ADMIN_UNAUTHENTICATED", "請先登入後台");
const MEMBER_NOT_FOUND = () => fail(404, "MEMBER_NOT_FOUND", "找不到這位會員");
const SERVER_ERROR = () => ({ status: 503, body: null });

// ---------- sessionStorage（讀寫失敗時當作沒有資料） ----------
function load(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 無法儲存時忽略（例如無痕模式）
  }
}
const SESSION_KEY = "demo-admin-session";
const FAILURES_KEY = "demo-admin-failures";
const OVERRIDES_KEY = "demo-member-overrides";

// ---------- 示範會員資料（45 位） ----------
const DEMO_ADMIN = { username: "site_admin", password: "backoffice2026" };
const BASE_TIME = Date.parse("2026-11-15T03:00:00.000Z");
const HOUR = 60 * 60 * 1000;

function buildMembers() {
  const members = [];
  for (let id = 1; id <= 45; id += 1) {
    const createdAt = new Date(BASE_TIME - (45 - id) * 31 * HOUR).toISOString();
    const notOnboarded = id === 43 || id === 20;
    const suspended = id % 11 === 0;
    members.push({
      userId: String(id),
      username: notOnboarded ? null : `學員${String(id).padStart(2, "0")}`,
      avatarId: notOnboarded ? null : `avatar-0${(id % 6) + 1}`,
      email: `user${String(id).padStart(2, "0")}@example.com`,
      createdAt,
      onboardingCompleted: !notOnboarded,
      googleLinked: id === 43 || id % 4 === 0,
      suspended,
      suspendedAt: suspended ? new Date(Date.parse(createdAt) + 30 * HOUR).toISOString() : null,
    });
  }
  // 規格範例中的兩位會員
  Object.assign(members[44], { username: "小明", avatarId: "avatar-03", email: "amy@example.com" });
  Object.assign(members[43], { username: "Coder_01", avatarId: "avatar-05", email: "bob@test.io" });
  return members;
}

function allMembers() {
  const overrides = load(OVERRIDES_KEY, {});
  return buildMembers().map((m) => ({ ...m, ...overrides[m.userId] }));
}

function toDetail(m) {
  const withGame = demo === "game-data";
  return {
    ...m,
    xp: withGame ? 1250 : null,
    level: withGame ? 3 : null,
    courseProgress: withGame
      ? [
          { courseName: "HTML", currentLevel: 8, totalLevels: 100 },
          { courseName: "CSS", currentLevel: 0, totalLevels: 80 },
        ]
      : [],
  };
}

function currentAdmin() {
  if (demo === "expired") return null; // 模擬後台登入已過期
  return load(SESSION_KEY, null);
}

// ---------- 後台登入 ----------

// POST /api/admin/auth/login
export async function adminLogin(username, password) {
  await wait(DELAY_MS);
  const key = username.trim().toLowerCase();
  if (key === "error") return SERVER_ERROR(); // 示範：伺服器錯誤

  const fields = {};
  if (!key) fields.username = "請輸入帳號";
  if (!password) fields.password = "請輸入密碼";
  if (Object.keys(fields).length) return fail(422, "VALIDATION_ERROR", "資料格式不正確", fields);

  // 同一個帳號 15 分鐘內失敗 5 次就鎖住（不論帳號是否存在）
  const failures = load(FAILURES_KEY, {});
  const record = failures[key];
  const now = Date.now();
  const active = record && now - record.first < 15 * 60 * 1000;
  if (active && record.count >= 5) {
    return fail(429, "TOO_MANY_ATTEMPTS", "嘗試次數過多，請 15 分鐘後再試");
  }

  if (key === DEMO_ADMIN.username && password === DEMO_ADMIN.password) {
    delete failures[key];
    save(FAILURES_KEY, failures);
    const admin = { adminId: "1", username: key };
    save(SESSION_KEY, admin);
    return { status: 200, body: { success: true, data: admin } };
  }

  failures[key] = active ? { ...record, count: record.count + 1 } : { first: now, count: 1 };
  save(FAILURES_KEY, failures);
  return fail(401, "INVALID_CREDENTIALS", "帳號或密碼錯誤");
}

// POST /api/admin/auth/logout
export async function adminLogout() {
  await wait(DELAY_MS);
  save(SESSION_KEY, null);
  return { status: 204, body: null };
}

// GET /api/admin/me
// isRetry 只給示範用（?demo=error 時按過「重試」才成功），正式版的 fetch 不需要這個參數
export async function getAdminMe({ isRetry = false } = {}) {
  if (demo === "loading") return new Promise(() => {});
  await wait(DELAY_MS);
  if (demo === "error" && !isRetry) return SERVER_ERROR();
  const admin = currentAdmin();
  return admin ? ok(admin) : ADMIN_UNAUTHENTICATED();
}

// ---------- 會員管理 ----------

// GET /api/admin/members?keyword=&page=
export async function getMembers({ keyword = "", page = 1 } = {}) {
  await wait(DELAY_MS);
  if (!currentAdmin()) return ADMIN_UNAUTHENTICATED();
  if (demo === "list-error") return SERVER_ERROR();

  const kw = keyword.trim().toLowerCase();
  if (kw.length > 100) return fail(422, "VALIDATION_ERROR", "資料格式不正確", { keyword: "關鍵字最多 100 個字" });
  if (!Number.isInteger(page) || page < 1) return fail(422, "VALIDATION_ERROR", "資料格式不正確", { page: "頁碼不正確" });

  // 關鍵字出現在暱稱或 Email 任何位置即符合，英文不分大小寫；includes 會把 % _ 當成一般字元
  const matched = allMembers()
    .filter((m) => !kw || (m.username ?? "").toLowerCase().includes(kw) || m.email.toLowerCase().includes(kw))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || Number(b.userId) - Number(a.userId));

  const total = matched.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const items = matched
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    .map(({ userId, username, avatarId, email, createdAt, suspended }) => ({
      userId,
      username,
      avatarId,
      email,
      createdAt,
      suspended,
    }));
  return ok({ items, page, pageSize: PAGE_SIZE, total, totalPages });
}

// GET /api/admin/members/:id
export async function getMember(id) {
  await wait(DELAY_MS);
  if (!currentAdmin()) return ADMIN_UNAUTHENTICATED();
  const member = allMembers().find((m) => m.userId === String(id));
  return member ? ok(toDetail(member)) : MEMBER_NOT_FOUND();
}

// POST /api/admin/members/:id/suspend 與 /restore（重複呼叫結果相同，不會改變原本的停權時間）
async function setSuspended(id, suspended) {
  await wait(DELAY_MS);
  if (!currentAdmin()) return ADMIN_UNAUTHENTICATED();
  if (demo === "action-error") return SERVER_ERROR();
  const member = allMembers().find((m) => m.userId === String(id));
  if (!member) return MEMBER_NOT_FOUND();

  if (member.suspended !== suspended) {
    const overrides = load(OVERRIDES_KEY, {});
    overrides[member.userId] = {
      suspended,
      suspendedAt: suspended ? new Date().toISOString() : null,
    };
    save(OVERRIDES_KEY, overrides);
  }
  const updated = allMembers().find((m) => m.userId === String(id));
  return ok(toDetail(updated));
}

export const suspendMember = (id) => setSuspended(id, true);
export const restoreMember = (id) => setSuspended(id, false);
