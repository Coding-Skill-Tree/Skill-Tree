import { useEffect, useState } from "react";
import { listAdminTeam, setAdminTeamDisabled } from "../../services/adminTeam";
import AdminIcon from "./AdminIcon";
import AdminLayout from "./AdminLayout";
import "./AdminTeamPage.css";

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium" }).format(new Date(value));
}

export default function AdminTeamPage({ admin, onLogout }) {
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    let active = true;
    listAdminTeam()
      .then((result) => { if (active) { setAccounts(result); setError(""); } })
      .catch((requestError) => { if (active) setError(requestError.message || "無法載入組員清單。"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function toggleDisabled(account) {
    setBusyId(account.id);
    setError("");
    try {
      const updated = await setAdminTeamDisabled(account.id, !account.disabledAt);
      setAccounts((previous) => previous.map((item) => item.id === updated.id ? updated : item));
    } catch (requestError) {
      setError(requestError.message || "無法更新組員權限。");
    } finally {
      setBusyId("");
    }
  }

  return (
    <AdminLayout activePage="team" breadcrumb="組員權限" admin={admin} onLogout={onLogout}>
      <main className="admin-content">
        <section className="admin-page-heading">
          <div>
            <span className="page-eyebrow">ACCESS CONTROL <i>/</i> OWNER</span>
            <h1>組員權限</h1>
            <p>組員帳號由可信任的專案管理者建立；停用會立即撤銷該帳號的管理員 session。</p>
          </div>
          <span className="admin-primary-button team-role-indicator"><AdminIcon name="users" size={17}/>最高管理者</span>
        </section>

        {error && <div className="admin-inline-error" role="alert">{error}</div>}
        <section className="admin-panel team-panel" aria-busy={loading} aria-label="組員帳號清單">
          {loading ? <p className="team-empty" role="status">正在載入組員清單…</p> : accounts.length === 0 ? <p className="team-empty">目前沒有管理員帳號。</p> : (
            <div className="team-table-wrap">
              <table className="team-table">
                <thead><tr><th scope="col">帳號</th><th scope="col">角色</th><th scope="col">狀態</th><th scope="col">建立日期</th><th scope="col">管理</th></tr></thead>
                <tbody>
                  {accounts.map((account) => {
                    const isOwner = account.role === "owner";
                    const disabled = Boolean(account.disabledAt);
                    return <tr key={account.id}>
                      <td><strong>{account.username}</strong><small>管理員 ID {account.id}</small></td>
                      <td>{isOwner ? "專案最高管理者" : "組員（瀏覽／編輯）"}</td>
                      <td><span className={`team-status${disabled ? " is-disabled" : ""}`}>{disabled ? "已停用" : "使用中"}</span></td>
                      <td>{formatDate(account.createdAt)}</td>
                      <td>{isOwner ? <span className="team-owner-note">目前最高管理者</span> : <button className="admin-secondary-button team-action" type="button" disabled={busyId === account.id} onClick={() => toggleDisabled(account)}>{busyId === account.id ? "更新中…" : disabled ? "恢復權限" : "停用帳號"}</button>}</td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <p className="team-create-note">新增組員請在可信任的管理主機執行 <code>npm run admin:create -- &lt;帳號&gt; editor</code>，密碼會以隱藏輸入方式設定。角色變更請執行 <code>npm run admin:transfer-owner -- &lt;組員帳號&gt;</code>。不要透過公開註冊頁建立管理員。</p>
      </main>
    </AdminLayout>
  );
}
