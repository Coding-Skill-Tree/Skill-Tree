import AuthLink from './AuthLink';

export default function AuthHeader({ page, loginPath = '/login', registerPath = '/register', LinkComponent }) {
  return (
    <header className="st-login__header">
        <AuthLink LinkComponent={LinkComponent} className="st-login__brand" to={loginPath} aria-label="Skill Tree 前端學習與實作平台">
          <svg className="st-login__brand-icon" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 11.5 18 3 32 11.5 18 20 4 11.5Z"/>
            <path d="m4 18 14 8.5L32 18M4 24.5 18 33 32 24.5"/>
          </svg>
          <span className="st-login__brand-text">
            <span className="st-login__brand-name">Skill Tree</span>
            <span className="st-login__brand-caption">前端學習與實作平台</span>
          </span>
        </AuthLink>
        <nav className="st-login__nav" aria-label="會員導覽">
          <AuthLink LinkComponent={LinkComponent} to={loginPath} aria-current={page === "login" ? "page" : undefined}>登入</AuthLink>
          <AuthLink LinkComponent={LinkComponent} className="st-login__nav-register" to={registerPath} aria-current={page === "register" ? "page" : undefined}>註冊</AuthLink>
        </nav>
      </header>
  );
}
