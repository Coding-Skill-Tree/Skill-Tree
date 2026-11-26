import { ROUTES, SITE_NAME } from "../../data/authContent.js";
import "./AuthHeader.css";

function AuthHeader() {
  return (
    <header className="auth-header">
      <a className="auth-brand" href={ROUTES.home}>
        {SITE_NAME}
      </a>
      <nav className="auth-header-nav" aria-label="會員">
        <a className="btn btn-secondary btn-small" href={ROUTES.login}>
          登入
        </a>
        <a className="btn btn-primary btn-small" href={ROUTES.register}>
          註冊
        </a>
      </nav>
    </header>
  );
}

export default AuthHeader;
