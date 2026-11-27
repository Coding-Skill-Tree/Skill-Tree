import { useCallback, useEffect, useState } from "react";
import { DEMO_LINKS, DEMO_TAKEN_NICKNAMES, PROFILE_TEXT, ROUTES } from "./data/profileContent.js";
import { getMe, logout } from "./utils/fakeSessionApi.js";
import SiteHeader from "./components/SiteHeader/SiteHeader.jsx";
import PageStatus from "./components/PageStatus/PageStatus.jsx";
import BasicInfo from "./components/BasicInfo/BasicInfo.jsx";
import Sidebar from "../../shared-components/sidebar/Sidebar.jsx";
import { AVATARS } from "../onboarding/data/characterOptions.js";
import "../../shared-components/sidebar/style.css";
// 示範區塊與浮動通知和忘記密碼頁共用
import DemoHint from "../forget_pwd/components/DemoHint/DemoHint.jsx";
import FloatingNotice from "../forget_pwd/components/FloatingNotice/FloatingNotice.jsx";
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
  const [notice, setNotice] = useState(null); // { id, text }，同樣文字再出現時換新 id 重新計時

  const showNotice = useCallback((text) => setNotice({ id: Date.now(), text }), []);
  const clearNotice = useCallback(() => setNotice(null), []);

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
      <FloatingNotice notice={notice} onDone={clearNotice} />
      <SiteHeader />
      <div className="profile-body">
        <Sidebar
          stats={{ level: 1, xp: 0 }}
          activePage="user"
          nickname={user?.username || "前端學習者"}
          avatar={AVATARS.find((a) => a.id === user?.avatarId) ?? null}
        />

        <main className="profile-main">
        <div className="profile-card">
          <h1 className="profile-title">{PROFILE_TEXT.title}</h1>

          {status === "ready" ? (
            <>
              {/* 儲存成功後更新登入資料（正式版改成呼叫登入狀態 context 的 setUser，頁首也會跟著更新） */}
              <BasicInfo user={user} onSaved={setUser} onNotice={showNotice} />
            </>
          ) : (
            <PageStatus state={status} onRetry={handleRetry} />
          )}
        </div>

        {status === "ready" && (
          <div className="profile-actions">
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
          <p>編輯時把暱稱改成 {DEMO_TAKEN_NICKNAMES.join("、")}，儲存會顯示「此暱稱已被使用」。</p>
        </DemoHint>
        </main>
      </div>
    </div>
  );
}

export default ProfilePage;
