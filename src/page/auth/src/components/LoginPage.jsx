import { useState } from 'react';
import './LoginPage.css';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  function handleSubmit(event) { event.preventDefault(); }
  return (
    <main className="st-login__main">
        <form className="st-login__form" onSubmit={handleSubmit} aria-labelledby="login-title">
          <fieldset className="st-login__panel">
            <legend className="st-login__title" id="login-title">登入</legend>
            {/* Google 登入僅預留 UI，未串接 OAuth。 */}
            <button className="st-login__button st-login__google" type="button">使用 Google 登入</button>
            <div className="st-login__divider">或</div>

            <div className="st-login__field">
              <label className="st-login__label" htmlFor="login-email">Email</label>
              <input className="st-login__input" id="login-email" type="email" name="email" autoComplete="email" />
            </div>

            <div className="st-login__field">
              <label className="st-login__label" htmlFor="login-password">密碼</label>
              <div className="st-login__password">
                <input className="st-login__input" id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" />
                <button className="st-login__button st-login__toggle" type="button" aria-controls="login-password" aria-label={showPassword ? '隱藏密碼' : '顯示密碼'} aria-pressed={showPassword} onClick={() => setShowPassword((previous) => !previous)}>
                  {showPassword ? '隱藏' : '顯示'}
                </button>
              </div>
            </div>

            <button className="st-login__button st-login__submit" type="submit">登入</button>
            <div className="st-login__links">
              <a href="#" onClick={(event) => event.preventDefault()}>忘記密碼？</a>
              <a href="#/register">還沒有帳號？註冊</a>
            </div>
          </fieldset>
        </form>
      </main>
  );
}
