import "./DashboardHeader.css";

const DashboardHeader = () => (
  <header className="dashboard-header"><div><p className="breadcrumb">學習空間 <span>/</span> <strong>學習總覽</strong></p><p className="dashboard-date">把今天的練習，變成明天的能力。</p></div><div className="dashboard-header-actions"><div className="header-action" aria-label="通知"><span aria-hidden="true">♧</span><span className="notification-dot" /></div><div className="header-action profile-action" aria-label="個人帳戶" aria-hidden="true">◉</div></div></header>
);

export default DashboardHeader;
