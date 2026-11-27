import React from "react";
import Icon from "./Icon.jsx";
// 導覽項目：key 同時當作 icon 名稱，activePage 傳入對應的 key 來標示目前頁面
const NAV_ITEMS = [
  { key: "map", label: "學習地圖", href: "#main-content" },
  { key: "tasks", label: "任務清單" },
  { key: "history", label: "練習紀錄" },
  { key: "badge", label: "成就徽章" },
  { key: "user", label: "個人檔案", href: "/profile" },
];

// avatar：角色資料 { image, name }，沒有時顯示 ST 字樣的預設圓圈
export default function Sidebar({ stats, activePage = "map", nickname = "前端學習者", avatar = null }) {
  return (
    <aside className="sidebar" aria-label="側邊欄">
      <header className="brand">
        <a href="#main-content">
          <Icon name="brand" className="brand-icon" />
          Skill Tree
        </a>
        <p>前端學習與實作平台</p>
      </header>
      <nav className="sidebar-nav" aria-label="主導覽">
        <ul>
          {NAV_ITEMS.map(({ key, label, href }) => {
            const current = key === activePage ? "page" : undefined;
            return href ? (
              <li key={key}>
                <a href={href} aria-current={current}>
                  <Icon name={key} />
                  {label}
                </a>
              </li>
            ) : (
              <li key={key}>
                <button
                  type="button"
                  disabled
                  title="尚未開發"
                  aria-label={label}
                  aria-current={current}
                >
                  <Icon name={key} />
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <section className="user-profile">
        <div className="user-profile-avatar">
          {avatar ? <img src={avatar.image} alt="" /> : "ST"}
        </div>
        <h2>{nickname}</h2>
        <p>Lv. {stats.level}</p>
        <p>累積經驗值：{stats.xp.toLocaleString()} XP</p>
      </section>
      <blockquote className="daily-quote">
        <p>今天學一點，明天的你會更強！</p>
      </blockquote>
    </aside>
  );
}
