import { useEffect } from 'react';
import AuthHeader from './AuthHeader';
import './AuthLayout.css';

export default function AuthLayout({ page, loginPath, registerPath, LinkComponent, children }) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${page === 'register' ? '註冊' : '登入'}｜技能樹學習站`;
    window.scrollTo(0, 0);
    return () => { document.title = previousTitle; };
  }, [page]);

  return (
    <div className="st-login">
      <AuthHeader page={page} loginPath={loginPath} registerPath={registerPath} LinkComponent={LinkComponent} />
      {children}
    </div>
  );
}
