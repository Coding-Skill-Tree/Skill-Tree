import "./Sidebar.css";

import {
  BookStack,
  Map,
  TaskList,
  StatsUpSquare,
  Medal,
  User,
} from "iconoir-react";

import { NavLink, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Xmark } from "iconoir-react";

const navItems = [
  {
    label: "學習地圖",
    path: "/skill-tree",
    icon: Map,
  },
  {
    label: "任務清單",
    path: "/tasks",
    icon: TaskList,
  },
  {
    label: "練習紀錄",
    path: "/practice",
    icon: StatsUpSquare,
  },
  {
    label: "成就徽章",
    path: "/achievements",
    icon: Medal,
  },
  {
    label: "我的角色",
    path: "/profile",
    icon: User,
  },
];

const Sidebar = ({
  isMobileNavOpen = false,
  onCloseMobileNav = () => {},
  user = {
    name: "前端學習者",
    avatar: "ST",
    level: 1,
    xp: 100,
  },
}) => {
  const { pathname } = useLocation();
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
          className="sidebar-backdrop"
          aria-label="關閉主要導覽"
          onClick={onCloseMobileNav}
        />
      )}
      <aside
        id="dashboard-mobile-nav"
        className={`sidebar-container${isMobileNavOpen ? " is-mobile-open" : ""}`}
        aria-label="主要導覽"
      >
        <button
          type="button"
          className="sidebar-close mobile-nav-close"
          aria-label="關閉主要導覽"
          onClick={onCloseMobileNav}
        >
          <Xmark aria-hidden="true" />
        </button>
      {/* Logo */}
      <div className="sidebar-brand">
        <BookStack className="brand-icon" />

        <div>
          <h2>Skill Tree</h2>
          <p>前端學習與實作平台</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobileNav}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive || (pathname === "/" && item.path === "/skill-tree") ? "active" : ""}`
              }
            >
              <Icon />

              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Information */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">{user.avatar}</div>

        <div className="sidebar-user-info">
          <strong>{user.name}</strong>

          <span>Lv. {user.level}</span>

          <small>累積經驗值：{user.xp} XP</small>
        </div>
      </div>

      {/* Quote Card */}
      <div className="sidebar-quote">
        <span className="quote-icon">❞</span>

        <p>今天學一點，明天的你會更強！</p>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
