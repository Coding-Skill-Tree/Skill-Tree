import { useEffect, useRef, useState } from "react";
import { getAdminMember, restoreAdminMember, suspendAdminMember } from "../../services/adminMembers";
import { AVATARS } from "../member/onboarding/data/characterOptions";
import AdminIcon from "./AdminIcon";
import AdminLayout from "./AdminLayout";

function formatDate(value, withTime = false) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("zh-TW", withTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { dateStyle: "medium" }).format(new Date(value));
}

function readMemberIdFromPath() {
  const encodedId = window.location.pathname.split("/").filter(Boolean).at(-1) || "";
  try { return decodeURIComponent(encodedId); }
  catch { return encodedId; }
}

function formatXp(value) {
  if (value === null || value === undefined || value === "") return "尚無資料";
  try {
    return `${BigInt(value).toLocaleString("zh-TW")} XP`;
  } catch {
    return "資料格式錯誤";
  }
}

function Avatar({ avatarId, username }) {
  const avatar = AVATARS.find((item) => item.id === avatarId);
  if (avatar) return <img className="member-detail-avatar" src={avatar.image} alt={`${avatar.name}角色`} width="64" height="64"/>;
  return <span className="member-detail-avatar member-detail-avatar-empty" aria-hidden="true">{(username || "?").slice(0, 1)}</span>;
}

function MemberStatus({ suspended }) {
  return <span className={`member-status${suspended ? " is-suspended" : ""}`}><span aria-hidden="true"/>{suspended ? "已停權" : "正常"}</span>;
}

function DataRow({ label, children }) {
  return <div className="member-data-row"><dt>{label}</dt><dd>{children}</dd></div>;
}

export default function AdminMemberDetailPage({ admin, onLogout }) {
  const userId = readMemberIdFromPath();
  const query = new URLSearchParams(window.location.search);
  const from = query.get("from") || "";
  const backHref = from.startsWith("?") ? `/admin/members${from}` : "/admin/members";
  const [state, setState] = useState({ status: "loading", member: null, error: null });
  const [reloadKey, setReloadKey] = useState(0);
  const [action, setAction] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const dialogRef = useRef(null);
  const actionButtonRef = useRef(null);

  useEffect(() => {
    let active = true;
    getAdminMember(userId)
      .then((member) => {
        if (active) setState({ status: "ready", member, error: null });
      })
      .catch((error) => {
        if (active) setState({ status: error.status === 404 ? "not-found" : "error", member: null, error });
      });
    return () => { active = false; };
  }, [userId, reloadKey]);

  function retryLoad() {
    setState({ status: "loading", member: null, error: null });
    setReloadKey((value) => value + 1);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (action && !dialog.open) dialog.showModal();
    else if (!action && dialog.open) dialog.close();
  }, [action]);

  const member = state.member;
  const actionName = member?.suspended ? "restore" : "suspend";
  const actionCopy = actionName === "suspend"
    ? { title: "停權這位會員？", message: "停權後，會員將無法登入；目前有效的會員 sessions 也會立即撤銷。", confirm: "確認停權", done: "會員已停權" }
    : { title: "恢復這位會員？", message: "恢復後，會員可以重新登入 Skill Tree。", confirm: "確認恢復", done: "會員已恢復" };

  async function confirmStatusChange() {
    if (!member || saving) return;
    setSaving(true);
    setNotice(null);
    try {
      const updated = actionName === "suspend"
        ? await suspendAdminMember(member.userId)
        : await restoreAdminMember(member.userId);
      setState({ status: "ready", member: updated, error: null });
      setAction(null);
      setNotice({ type: "success", text: actionCopy.done });
    } catch (error) {
      setAction(null);
      setNotice({ type: "error", text: error.status === 401 ? "管理員登入已逾時，請重新登入。" : error.message || "狀態更新失敗，請稍後重試。" });
    } finally {
      setSaving(false);
    }
  }

  const avatarName = AVATARS.find((item) => item.id === member?.avatarId)?.name;
  const roleLabel = member?.role === "member" ? "一般會員" : member?.role || "—";

  return (
    <AdminLayout activePage="members" breadcrumb="會員詳情" admin={admin} onLogout={onLogout}>
      <main className="admin-content member-detail-content">
        <a className="question-editor-back member-detail-back" href={backHref}><AdminIcon name="chevron-left" size={16}/>回到會員列表</a>

        {notice && <div className={`member-notice is-${notice.type}`} role={notice.type === "error" ? "alert" : "status"}><span>{notice.text}</span>{notice.text.includes("重新登入") && <a href="/admin/login">重新登入</a>}</div>}

        {state.status === "loading" && <section className="admin-panel member-detail-state" role="status"><span className="member-state-indicator"/>正在載入會員資料…</section>}
        {state.status === "error" && <section className="admin-panel member-detail-state"><span className="page-eyebrow">MEMBER PROFILE <i>/</i> A-10</span><h1>無法載入會員資料</h1><p>{state.error?.status === 401 ? "管理員登入已逾時，請重新登入。" : state.error?.message || "請檢查後端連線後重試。"}</p><button className="admin-secondary-button" type="button" onClick={retryLoad}>重試</button>{state.error?.status === 401 && <a className="admin-secondary-button" href="/admin/login">重新登入</a>}</section>}
        {state.status === "not-found" && <section className="admin-panel member-detail-state"><span className="page-eyebrow">MEMBER PROFILE <i>/</i> A-10</span><h1>找不到這位會員</h1><p>會員可能已不存在，或網址中的會員編號有誤。</p><a className="admin-primary-button" href={backHref}>返回會員列表</a></section>}

        {state.status === "ready" && member && <>
          <section className="admin-page-heading member-detail-heading">
            <div><span className="page-eyebrow">MEMBER PROFILE <i>/</i> A-10</span><h1>會員詳情</h1><p>檢視會員基本資料、帳號狀態與學習進度。</p></div>
            <button ref={actionButtonRef} className={member.suspended ? "admin-secondary-button" : "member-suspend-button"} type="button" onClick={() => setAction(actionName)}>
              {member.suspended ? "恢復會員" : "停權會員"}
            </button>
          </section>

          <section className="admin-panel member-profile-card" aria-label="會員摘要">
            <Avatar avatarId={member.avatarId} username={member.username}/>
            <div className="member-profile-copy"><span className="panel-kicker">MEMBER ID {member.userId}</span><h2>{member.username || "（尚未設定暱稱）"}</h2><p>{member.email}</p></div>
            <MemberStatus suspended={member.suspended}/>
          </section>

          <div className="member-detail-grid">
            <section className="admin-panel member-data-panel" aria-labelledby="member-basic-heading">
              <div className="member-section-heading"><span className="member-section-icon"><AdminIcon name="users" size={18}/></span><div><span className="panel-kicker">ACCOUNT</span><h2 id="member-basic-heading">基本資料</h2></div></div>
              <dl className="member-data-list">
                <DataRow label="角色">{roleLabel}</DataRow>
                <DataRow label="暱稱">{member.username || "尚未設定"}</DataRow>
                <DataRow label="Email">{member.email}</DataRow>
                <DataRow label="加入日期"><time dateTime={member.createdAt}>{formatDate(member.createdAt, true)}</time></DataRow>
                <DataRow label="建立角色">{member.onboardingCompleted ? "已完成" : "未完成"}{avatarName ? ` · ${avatarName}` : ""}</DataRow>
                <DataRow label="Google 登入">{member.googleLinked ? "已連結" : "未連結"}</DataRow>
                <DataRow label="帳號狀態"><MemberStatus suspended={member.suspended}/>{member.suspendedAt && <small className="member-suspended-at">停權於 {formatDate(member.suspendedAt, true)}</small>}</DataRow>
              </dl>
            </section>

            <section className="admin-panel member-data-panel member-game-panel" aria-labelledby="member-game-heading">
              <div className="member-section-heading"><span className="member-section-icon is-xp"><AdminIcon name="check" size={18}/></span><div><span className="panel-kicker">LEARNING SUMMARY</span><h2 id="member-game-heading">遊戲數據</h2></div></div>
              <div className="member-game-stats"><div><span>累積 XP</span><strong>{formatXp(member.xp)}</strong></div><div><span>目前等級</span><strong>{member.level ? `Lv. ${member.level}` : "尚無資料"}</strong></div></div>
              <div className="member-progress-heading"><strong>技能進度</strong><span>{member.courseProgress?.length || 0} 個分類</span></div>
              {member.courseProgress?.length ? <ul className="member-course-progress">
                {member.courseProgress.map((course) => {
                  const total = Number(course.totalLevels) || 0;
                  const complete = Number(course.currentLevel) || 0;
                  const percentage = total ? Math.min(100, Math.round((complete / total) * 100)) : 0;
                  return <li key={course.courseName}><div><strong>{course.courseName}</strong><span>{complete} / {total} 關</span></div><div className="member-progress-track" role="progressbar" aria-label={`${course.courseName}完成進度`} aria-valuemin={0} aria-valuemax={total} aria-valuenow={complete}><span style={{ width: `${percentage}%` }}/></div></li>;
                })}
              </ul> : <p className="member-no-progress">尚無學習進度資料。</p>}
            </section>
          </div>
        </>}
      </main>

      <dialog ref={dialogRef} className="member-confirm-dialog" onCancel={(event) => { event.preventDefault(); if (!saving) setAction(null); }}>
        <div className="member-confirm-icon"><AdminIcon name={actionName === "suspend" ? "users" : "check"} size={20}/></div>
        <h2>{actionCopy.title}</h2>
        <p>{actionCopy.message}</p>
        <div className="member-confirm-actions">
          <button className="admin-secondary-button" type="button" onClick={() => setAction(null)} disabled={saving}>取消</button>
          <button className={actionName === "suspend" ? "member-suspend-button" : "admin-primary-button"} type="button" onClick={confirmStatusChange} disabled={saving}>{saving ? "處理中…" : actionCopy.confirm}</button>
        </div>
      </dialog>
    </AdminLayout>
  );
}
