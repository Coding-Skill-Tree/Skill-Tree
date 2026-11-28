import { useEffect, useState } from "react";
import { getCurrentAdmin, logoutAdmin } from "../../services/adminAuth";
import AdminDashboard from "./AdminDashboard";
import AdminLoginPage from "./AdminLoginPage";
import AdminMembersPage from "./AdminMembersPage";
import AdminMemberDetailPage from "./AdminMemberDetailPage";
import AdminQuestionBankPage from "./AdminQuestionBankPage";
import AdminQuestionDetailPage from "./AdminQuestionDetailPage";
import AdminQuestionFormPage from "./AdminQuestionFormPage";
import AdminPlaceholderPage from "./AdminPlaceholderPage";
import AdminTeamPage from "./AdminTeamPage";
import "./Admin.css";

function AdminLoading() {
  return <main className="admin-auth-page"><p role="status">正在確認管理員登入狀態…</p></main>;
}

function AdminConnectionError({ onRetry }) {
  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card">
        <span className="page-eyebrow">SKILL TREE <i>/</i> ADMIN</span>
        <h1>目前無法連線到後端</h1>
        <p>請確認 API 與資料庫已啟動，再重新檢查登入狀態。</p>
        <button className="admin-primary-button" type="button" onClick={onRetry}>重新連線</button>
      </section>
    </main>
  );
}

export default function AdminApp() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/admin";
  const [admin, setAdmin] = useState(null);
  const [sessionState, setSessionState] = useState("loading");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    getCurrentAdmin()
      .then((currentAdmin) => {
        if (!active) return;
        setAdmin(currentAdmin);
        setSessionState("authenticated");
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401) {
          setAdmin(null);
          setSessionState("unauthenticated");
        } else {
          setSessionState("unavailable");
        }
      });
    return () => { active = false; };
  }, [retryKey]);

  async function handleLogout() {
    try {
      await logoutAdmin();
      setAdmin(null);
      setSessionState("unauthenticated");
    } catch {
      setSessionState("unavailable");
    }
  }

  function handleLogin(currentAdmin) {
    setAdmin(currentAdmin);
    setSessionState("authenticated");
  }

  if (sessionState === "loading") return <AdminLoading />;
  if (sessionState === "unavailable") {
    return <AdminConnectionError onRetry={() => { setSessionState("loading"); setRetryKey((key) => key + 1); }} />;
  }
  if (!admin) return <AdminLoginPage onLogin={handleLogin} />;

  const sharedProps = { admin, onLogout: handleLogout };
  if (path === "/admin/team") {
    if (admin.role !== "owner") {
      return <main className="admin-auth-page"><section className="admin-auth-card"><h1>沒有組員管理權限</h1><p>只有專案最高管理者可以檢視或停用組員帳號。</p><a className="admin-primary-button" href="/admin">返回後台</a></section></main>;
    }
    return <AdminTeamPage {...sharedProps} />;
  }
  if (path === "/admin" || path === "/admin/login") return <AdminDashboard {...sharedProps} />;
  if (path === "/admin/members") return <AdminMembersPage {...sharedProps} />;
  if (/^\/admin\/members\/[^/]+$/.test(path)) return <AdminMemberDetailPage {...sharedProps} />;
  if (path === "/admin/questions") return <AdminQuestionBankPage {...sharedProps} />;
  if (path === "/admin/questions/new" || /^\/admin\/questions\/[^/]+\/edit$/.test(path)) {
    return <AdminQuestionFormPage {...sharedProps} />;
  }
  if (/^\/admin\/questions\/[^/]+$/.test(path)) return <AdminQuestionDetailPage {...sharedProps} />;

  return <AdminPlaceholderPage {...sharedProps} path={path} />;
}
