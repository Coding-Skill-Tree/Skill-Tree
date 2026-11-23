import AdminIcon from "./AdminIcon";
function Brand({ compact = false }) {
    return (<a className={`admin-brand${compact ? " admin-brand-compact" : ""}`} href="/admin" aria-label="Skill Tree 管理後台總覽">
      <span className="admin-brand-mark" aria-hidden="true"><span /><span /><span /></span>
      <span className="admin-brand-copy">Skill Tree<small>ADMIN CONSOLE</small></span>
    </a>);
}
export default function AdminLayout({ children, activePage, breadcrumb, questionCount, admin, onLogout }) {
    return (<div className="admin-app">
      <aside className="admin-sidebar">
        <Brand />
        <nav className="admin-nav" aria-label="管理後台導覽">
          <span className="admin-nav-label">工作區</span>
          <a className={`admin-nav-link${activePage === "overview" ? " is-active" : ""}`} href="/admin" aria-current={activePage === "overview" ? "page" : undefined}><AdminIcon name="grid"/>後台總覽</a>
          <a className={`admin-nav-link${activePage === "questions" ? " is-active" : ""}`} href="/admin/questions" aria-current={activePage === "questions" ? "page" : undefined}><AdminIcon name="stack"/>題庫管理{questionCount !== undefined && <span className="admin-nav-count">{questionCount}</span>}</a>
          <span className="admin-nav-label admin-nav-label-spaced">內容管理</span>
          <a className="admin-nav-link" href="/admin/questions/new"><AdminIcon name="plus"/>新增題目</a>
          <span className="admin-nav-link is-disabled" aria-disabled="true"><AdminIcon name="users"/>會員管理<span className="soon-label">規劃中</span></span>
        </nav>
        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-user"><span className="admin-avatar">{admin?.username?.slice(0, 1)?.toUpperCase() || "A"}</span><span><strong>{admin?.username || "管理員"}</strong><small>管理員帳號</small></span></div>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <Brand compact/>
          <div className="admin-breadcrumb"><span>管理後台</span><AdminIcon name="chevron-right" size={14}/><strong>{breadcrumb}</strong></div>
          <div className="admin-topbar-right"><div className="topbar-account"><span className="admin-avatar admin-avatar-small">{admin?.username?.slice(0, 1)?.toUpperCase() || "A"}</span><span><strong>{admin?.username || "管理員"}</strong><small>Administrator</small></span></div><button className="admin-logout-button" type="button" onClick={onLogout}>登出</button></div>
        </header>
        {children}
      </div>

      <nav className="admin-mobile-nav" aria-label="快速導覽">
        <a className={activePage === "overview" ? "is-active" : ""} href="/admin" aria-current={activePage === "overview" ? "page" : undefined}><AdminIcon name="grid" size={19}/><span>總覽</span></a>
        <a className={activePage === "questions" ? "is-active" : ""} href="/admin/questions" aria-current={activePage === "questions" ? "page" : undefined}><AdminIcon name="stack" size={19}/><span>題庫</span></a>
        <a href="/admin/questions/new"><AdminIcon name="plus" size={19}/><span>新增</span></a>
      </nav>
    </div>);
}
