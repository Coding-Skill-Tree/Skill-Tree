import { ROUTES, SITE_NAME, SITE_TAGLINE } from "../data/welcomeContent.js";
import { BrandLogo } from "./Decorations.jsx";

function SiteHeader() {
  return (
    <header className="site-header">
      <a className="site-brand" href="/introduce/">
        <BrandLogo />
        <span className="site-brand-text">
          <span className="site-brand-name">{SITE_NAME}</span>
          <span className="site-brand-tagline">{SITE_TAGLINE}</span>
        </span>
      </a>
      <nav className="site-header-nav" aria-label="會員">
        <a className="btn btn-secondary" href={ROUTES.login}>
          登入
        </a>
        <a className="btn btn-primary" href={ROUTES.register}>
          註冊
        </a>
      </nav>
    </header>
  );
}

export default SiteHeader;
