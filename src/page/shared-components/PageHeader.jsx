import avatarIcon from "../../assets/avatar-icon.png";
import "./PageHeader.css";

export default function PageHeader({
  title = "選擇前端學習技能",
  description = "",
  eyebrow = "",
  onOpenMobileNav,
  mobileNavToggleRef,
  onNotificationClick,
  onAvatarClick,
}) {
  return (
    <header className="st-page-header">
      {/* 左側：標題 */}
      <div className="st-page-heading">
        {eyebrow && <p className="st-page-eyebrow">{eyebrow}</p>}

        <h1>{title}</h1>

        {description && <p className="st-page-description">{description}</p>}
      </div>

      {/* 右側：選單、通知、頭像 */}
      <div className="st-header-actions">
        {onOpenMobileNav && (
          <button
            type="button"
            ref={mobileNavToggleRef}
            className="st-mobile-nav-toggle"
            onClick={onOpenMobileNav}
            aria-label="開啟導覽選單"
            aria-controls="dashboard-mobile-nav"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* 通知鈴鐺 */}
        <button
          type="button"
          className="st-notification-button"
          aria-label="通知"
          onClick={onNotificationClick}
          disabled={!onNotificationClick}
        >
          <svg
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

          <span className="st-notification-dot" aria-hidden="true" />
        </button>

        {/* 圓形頭像 */}
        <button
          type="button"
          className="st-avatar-button"
          aria-label="使用者頭像"
          onClick={onAvatarClick}
          disabled={!onAvatarClick}
        >
          <img src={avatarIcon} alt="" className="st-avatar-image" />
        </button>
      </div>
    </header>
  );
}
