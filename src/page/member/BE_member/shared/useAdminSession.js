import { useEffect, useState } from "react";
import { getAdminMe } from "./fakeAdminApi.js";
import { ADMIN_ROUTES } from "./adminContent.js";

// 後台受保護頁面（會員列表、會員詳情）共用：確認後台登入狀態。
// - 確認中：status = "loading"，不導頁
// - 沒有後台登入：導向後台登入頁
// - 網路錯誤或 5xx：status = "error"，可呼叫 retry() 重試
// - 已登入：status = "ready"，admin = { adminId, username }
// 會員（前台）的登入狀態不影響結果。
export function useAdminSession() {
  const [status, setStatus] = useState("loading");
  const [admin, setAdmin] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    getAdminMe({ isRetry: attempt > 0 })
      .catch(() => ({ status: 0 }))
      .then(({ status: code, body }) => {
        if (!alive) return;
        if (code === 200 && body?.success) {
          setAdmin(body.data);
          setStatus("ready");
        } else if (code === 401) {
          window.location.replace(ADMIN_ROUTES.login);
        } else {
          setStatus("error");
        }
      });
    return () => {
      alive = false;
    };
  }, [attempt]);

  function retry() {
    setStatus("loading");
    setAttempt((n) => n + 1);
  }

  return { status, admin, retry };
}

// 任何後台 API 回 401 ADMIN_UNAUTHENTICATED（例如登入過期）時呼叫：回到後台登入頁
export function isAdminUnauthenticated(result) {
  if (result?.status === 401 && result.body?.error?.code === "ADMIN_UNAUTHENTICATED") {
    window.location.replace(ADMIN_ROUTES.login);
    return true;
  }
  return false;
}
