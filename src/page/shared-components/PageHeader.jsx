import avatarIcon from "../../assets/avatar-icon.png";

export default function PageHeader({
  title = "選擇前端學習技能",
  description = "挑選一個你想精進的前端技能，展開專屬的學習地圖。",
  eyebrow = "CHOOSE YOUR SKILL",
}) {
  return (
    <header className="page-header">
      {/* 左側：頁面標題 */}
      <div className="page-heading">
        <p>{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {/* 右側：通知與頭像 */}
      <div className="header-actions">
        <button type="button" className="notification-button" aria-label="通知">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
          </svg>

          <span className="notification-dot" />
        </button>

        <button type="button" className="avatar-button" aria-label="使用者頭像">
          <img src={avatarIcon} alt="" className="avatar-image" />
        </button>
      </div>
    </header>
  );
}
