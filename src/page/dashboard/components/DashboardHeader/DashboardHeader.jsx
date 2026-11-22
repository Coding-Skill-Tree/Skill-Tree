import "./DashboardHeader.css";
import { Bell, Menu } from "iconoir-react";
import ImageExample from "../../../../assets/profile-image-example.png";

const DashboardHeader = ({
  isMobileNavOpen,
  mobileNavToggleRef,
  onOpenMobileNav,
}) => (
  <header className="dashboard-header">
    <button
      type="button"
      className="mobile-nav-toggle"
      ref={mobileNavToggleRef}
      aria-label="開啟主要導覽"
      aria-controls="dashboard-mobile-nav"
      aria-expanded={isMobileNavOpen}
      onClick={onOpenMobileNav}
    >
      <Menu aria-hidden="true" />
    </button>
    <div>
      <h3 className="dashboard-title">學習儀錶板</h3>
      <p className="dashboard-sub-title">把今天的練習，變成明天的能力。</p>
    </div>
    <div className="dashboard-header-actions">
      <div className="header-action" aria-label="通知">
        <Bell aria-hidden="true" />
        <span className="notification-dot" />
      </div>
      <div
        className="header-action profile-action"
        aria-label="個人帳戶"
        aria-hidden="true"
      >
        <img
          className="profile-avatar header-profile"
          src={ImageExample}
          alt="在用筆電的貓"
        />
      </div>
    </div>
  </header>
);

export default DashboardHeader;
