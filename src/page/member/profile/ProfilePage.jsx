import { useEffect, useState } from "react";
import { PROFILE_TEXT, ROUTES } from "./data/profileContent.js";
import { ApiRequestError } from "../../../services/api.js";
import { getMe, logout } from "../../../services/memberAuth.js";
import SiteHeader from "./components/SiteHeader/SiteHeader.jsx";
import PageStatus from "./components/PageStatus/PageStatus.jsx";
import BasicInfo from "./components/BasicInfo/BasicInfo.jsx";
import GameDataEntry from "./components/GameDataEntry/GameDataEntry.jsx";
import "./ProfilePage.css";

function ProfilePage() {
  const [status, setStatus] = useState("loading"); // loading | error | ready
  const [user, setUser] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);

  // 載入登入狀態；attempt 改變（按重試）時再請求一次
  useEffect(() => {
    let alive = true;
    getMe()
      .then((member) => {
        if (!alive) return;
        if (!member.onboardingCompleted) {
          window.location.replace(ROUTES.onboarding);
        } else {
          setUser(member);
          setStatus("ready");
        }
      })
      .catch((error) => {
        if (!alive) return;
        if (error instanceof ApiRequestError && error.status === 401) {
          window.location.replace(ROUTES.login);
          return;
        }
        setStatus("error");
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
    setLogoutError(false);
    try {
      await logout();
      window.location.assign(ROUTES.home);
    } catch {
      setLogoutError(true);
      setLoggingOut(false);
    }
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
            {logoutError && <p className="profile-logout-error" role="alert">{PROFILE_TEXT.logoutFailed}</p>}
          </div>
        )}
      </main>
    </div>
  );
}

export default ProfilePage;
