import { useState } from 'react';
import AuthLayout from './components/AuthLayout';
import AuthLink from './components/AuthLink';
import './RegisterPage.css';

function PasswordField({ id, name, label, hint, fieldClass = '' }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={`st-register-field ${fieldClass}`}>
      <label htmlFor={id}>{label}</label>
      <div className="st-register-password-row">
        <input id={id} name={name} type={visible ? 'text' : 'password'} autoComplete="new-password" aria-describedby={hint ? `${id}-hint` : undefined} className="st-register-input" />
        <button type="button" className="st-register-toggle" aria-controls={id} aria-label={`${visible ? '隱藏' : '顯示'}${label}`} aria-pressed={visible} onClick={() => setVisible(v => !v)}>{visible ? '隱藏' : '顯示'}</button>
      </div>
      {hint && <p className="st-register-hint" id={`${id}-hint`}>{hint}</p>}
    </div>
  );
}

export default function RegisterPage({ loginPath = '/login', registerPath = '/register', LinkComponent } = {}) {
  return (
    <AuthLayout page="register" loginPath={loginPath} registerPath={registerPath} LinkComponent={LinkComponent}>
      <div className="st-register-page">
        <main className="st-register-main">
          <form className="st-register-form" noValidate onSubmit={event => event.preventDefault()}>
            <fieldset className="st-register-card">
              <legend>註冊</legend>
              <button type="button" className="st-register-button st-register-google">使用 Google 註冊</button>
              <div className="st-register-divider">或</div>
              <div className="st-register-field st-register-email">
                <label htmlFor="register-email">Email</label>
                <input id="register-email" name="email" type="email" autoComplete="email" className="st-register-input" />
              </div>
              <PasswordField id="register-password" name="password" label="密碼" fieldClass="st-register-password" hint="僅接受英文大小寫、數字" />
              <PasswordField id="register-confirm-password" name="confirmPassword" label="確認密碼" />
              <button type="submit" className="st-register-button st-register-submit">註冊</button>
              <p className="st-register-login"><AuthLink to={loginPath} LinkComponent={LinkComponent}>已有帳號？登入</AuthLink></p>
            </fieldset>
          </form>
        </main>
      </div>
    </AuthLayout>
  );
}
