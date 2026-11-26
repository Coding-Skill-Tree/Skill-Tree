import { useEffect, useSyncExternalStore } from 'react';
import AuthHeader from './components/AuthHeader';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';

// Hash routing: native links, browser history and direct opening, no extra dependencies.
function subscribe(callback) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}
function getPage() {
  return window.location.hash === '#/register' ? 'register' : 'login';
}
export default function App() {
  const page = useSyncExternalStore(subscribe, getPage);
  useEffect(() => {
    document.title = `${page === 'register' ? '註冊' : '登入'}｜技能樹學習站`;
    window.scrollTo(0, 0);
  }, [page]);
  return (
    <div className="st-login">
      <AuthHeader page={page} />
      {page === 'register' ? <RegisterPage /> : <LoginPage />}
    </div>
  );
}
