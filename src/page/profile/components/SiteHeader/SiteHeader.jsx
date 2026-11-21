import { NAV_LINKS, ROUTES, SITE_NAME } from "../../data/profileContent.js";
import "./SiteHeader.css";

// 登入後的頁首：品牌＋主要導覽（目前所在頁用 aria-current 標示，外觀加底色）。
function SiteHeader() {
  return (
    <header className="profile-header">
      <a className="profile-brand" href={ROUTES.home}>
        {SITE_NAME}
      </a>
      <nav aria-label="主要導覽">
        <ul className="profile-header-nav">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                className="profile-header-link"
                href={link.href}
                aria-current={link.current ? "page" : undefined}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export default SiteHeader;
