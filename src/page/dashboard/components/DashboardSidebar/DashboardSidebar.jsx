import "./DashboardSidebar.css";
import { Map, DashboardSpeed, Settings, Xmark } from "iconoir-react";
import { useEffect } from "react";

const DashboardSidebar = ({ isMobileNavOpen, onCloseMobileNav }) => {
  useEffect(() => {
    if (!isMobileNavOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCloseMobileNav();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileNavOpen, onCloseMobileNav]);

  return (
    <>
      {isMobileNavOpen && (
        <button
          type="button"
          className="mobile-nav-backdrop"
          aria-label="關閉主要導覽"
          onClick={onCloseMobileNav}
        />
      )}
      <aside
        id="dashboard-mobile-nav"
        className={`dashboard-sidebar${isMobileNavOpen ? " is-mobile-open" : ""}`}
        aria-label="主要導覽"
      >
        <button
          type="button"
          className="mobile-nav-close"
          aria-label="關閉主要導覽"
          onClick={onCloseMobileNav}
        >
          <Xmark aria-hidden="true" />
        </button>
    <div className="dashboard-brand">
      <span className="brand-mark">S</span>
      <span>
        Skill Tree<small>前端技能樹</small>
      </span>
    </div>
    <nav className="dashboard-nav" aria-label="學習空間導覽">
      <div aria-current="page">
        <span aria-hidden="true">
          <Map />
        </span>
        技能地圖
      </div>
      <div>
        <span aria-hidden="true">
          <DashboardSpeed />
        </span>
        學習儀錶板
      </div>
    </nav>
    <div className="sidebar-user">
      <span className="sidebar-avatar">N</span>
      <span>
        <strong>Nini</strong>
        <small>Lv. 03 學習者</small>
      </span>
      <span className="sidebar-status" aria-hidden="true">
        <Settings />
      </span>
    </div>
    {/* <button className="hide-sidebar">
      <FastArrowLeft />
    </button> */}
      </aside>
    </>
  );
};

export default DashboardSidebar;
