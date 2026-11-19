import "./DashboardSidebar.css";

const DashboardSidebar = () => (
  <aside className="dashboard-sidebar" aria-label="主要導覽">
    <div className="dashboard-brand"><span className="brand-mark">S</span><span>Skill Tree<small>LEARNING SPACE</small></span></div>
    <p className="sidebar-label">學習空間</p>
    <nav className="dashboard-nav" aria-label="學習空間導覽">
      <div className="is-active" aria-current="page"><span aria-hidden="true">⌂</span>學習總覽</div>
      <div><span aria-hidden="true">⌘</span>技能地圖</div>
      <div><span aria-hidden="true">▤</span>學習紀錄</div>
      <div><span aria-hidden="true">✦</span>成就徽章</div>
    </nav>
    <div className="sidebar-user"><span className="sidebar-avatar">N</span><span><strong>Nini</strong><small>Lv. 03 學習者</small></span><span className="sidebar-status" aria-hidden="true">●</span></div>
  </aside>
);

export default DashboardSidebar;
