import { useEffect, useState } from "react";
import { DEMO_LINKS, PROFILE_TEXT, ROUTES } from "./data/profileContent.js";
import { getMe, logout } from "./utils/fakeSessionApi.js";
import SiteHeader from "./components/SiteHeader/SiteHeader.jsx";
import PageStatus from "./components/PageStatus/PageStatus.jsx";
import BasicInfo from "./components/BasicInfo/BasicInfo.jsx";
import GameDataEntry from "./components/GameDataEntry/GameDataEntry.jsx";
// 示範區塊和忘記密碼頁共用
import DemoHint from "../forget_pwd/components/DemoHint/DemoHint.jsx";
import "./ProfilePage.css";

// 依登入狀態決定結果：
// 未登入 → /login；未完成建立角色 → /onboarding；已完成 → 顯示頁面；
// 網路錯誤或 5xx → 顯示「載入失敗」與重試，不導頁。
function resolveSession(result) {
  const { status, body } = result;
  if (status === 401) return { redirect: ROUTES.login };
  if (status === 200 && body?.success) {
    const user = body.data;
    if (!user.onboardingCompleted) return { redirect: ROUTES.onboarding };
    return { user };
  }
  return { error: true };
}

function ProfilePage() {
  const [status, setStatus] = useState("loading"); // loading | error | ready
  const [user, setUser] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);

  // 載入登入狀態；attempt 改變（按重試）時再請求一次
  useEffect(() => {
    let alive = true;
    getMe({ isRetry: attempt > 0 })
      .then(resolveSession)
      .catch(() => ({ error: true }))
      .then((outcome) => {
        if (!alive) return;
        if (outcome.redirect) {
          window.location.replace(outcome.redirect);
        } else if (outcome.user) {
          setUser(outcome.user);
          setStatus("ready");
        } else {
          setStatus("error");
        }
      });
    return () => {
      alive = false;
    };
  }, [attempt]);

  function handleRetry() {
    setStatus("loading");
    setAttempt((n) => n + 1);
  }

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    window.location.assign(ROUTES.home); // 登出後回到歡迎頁
  }

  return (
    <div className="profile-page">
      <SiteHeader />

      <main className="profile-main">
        <div className="profile-card">
          <h1 className="profile-title">{PROFILE_TEXT.title}</h1>

          {status === "ready" ? (
            <>
              <BasicInfo user={user} />
              <GameDataEntry />
            </>
          ) : (
            <PageStatus state={status} onRetry={handleRetry} />
          )}
        </div>

        {status === "ready" && (
          <div className="profile-actions">
            <a className="text-link" href={ROUTES.learn}>
              {PROFILE_TEXT.backToMap}
            </a>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? PROFILE_TEXT.loggingOut : PROFILE_TEXT.logout}
            </button>
          </div>
        )}

        <DemoHint>
          <p className="demo-hint-links">
            {DEMO_LINKS.map((item) => (
              <a key={item.label} className="text-link" href={item.href}>
                {item.label}
              </a>
            ))}
          </p>
        </DemoHint>
      </main>
    </div>
  );
}

export default ProfilePage;
