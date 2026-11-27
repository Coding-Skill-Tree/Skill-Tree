import { useState } from 'react';
import { Eye, EyeClosed } from 'iconoir-react';
import AuthLayout from './components/AuthLayout';
import AuthLink from './components/AuthLink';
import './LoginPage.css';
import { getEmailError, getLoginPasswordError, pickErrors } from '../utils/validators.js';
import { apiRequest, ApiRequestError } from '../../../../services/api.js';

// 讀取目前表單的值；Email 先去除前後空白。
function readValues(form) {
  return {
    email: form.email.value.trim(),
    password: form.password.value,
  };
}

// 單一欄位的檢查。
function validateField(name, values) {
  switch (name) {
    case 'email':
      return getEmailError(values.email);
    case 'password':
      return getLoginPasswordError(values.password);
    default:
      return '';
  }
}

export default function LoginPage({ loginPath = '/login', registerPath = '/register', LinkComponent } = {}) {
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formMessage, setFormMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toggleText = showPassword ? '隱藏密碼' : '顯示密碼';
  const ToggleIcon = showPassword ? EyeClosed : Eye;

  // 離開欄位時檢查（focusout 會冒泡到 form）。
  function handleBlur(event) {
    const { name } = event.target;
    if (!['email', 'password'].includes(name)) return;
    const values = readValues(event.currentTarget);
    const error = validateField(name, values);
    setFieldErrors(previous => ({ ...previous, [name]: error || undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const values = readValues(event.currentTarget);

    // 前端有錯誤時不送出登入請求
    const errors = pickErrors({
      email: validateField('email', values),
      password: validateField('password', values),
    });
    setFieldErrors(errors);
    setFormMessage('');
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    try {
      await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: values.email, password: values.password }),
      });
      // 登入成功，交給首頁依引導狀態導向 /onboarding 或 /learn
      window.location.assign('/');
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === 'VALIDATION_ERROR') {
        setFieldErrors(error.details?.fields ?? {});
      } else if (error instanceof ApiRequestError && error.status < 500) {
        // 401 INVALID_CREDENTIALS、403 ACCOUNT_SUSPENDED、429 TOO_MANY_ATTEMPTS
        setFormMessage(error.message);
      } else {
        setFormMessage('操作失敗，請再試一次');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout page="login" loginPath={loginPath} registerPath={registerPath} LinkComponent={LinkComponent}>
      <main className="st-login__main">
        <form className="st-login__form" noValidate onBlur={handleBlur} onSubmit={handleSubmit} aria-labelledby="login-title">
          <fieldset className="st-login__panel" disabled={submitting}>
            <legend className="st-login__title" id="login-title">登入</legend>
            {/* Google 登入僅預留 UI，未串接 OAuth。 */}
            <button className="st-login__button st-login__google" type="button">使用 Google 登入</button>
            <div className="st-login__divider">或</div>

            <div className="st-login__field">
              <label className="st-login__label" htmlFor="login-email">Email</label>
              <input className="st-login__input" id="login-email" type="email" name="email" autoComplete="email" aria-invalid={fieldErrors.email ? true : undefined} />
              {fieldErrors.email && <p className="st-login__error" role="alert">{fieldErrors.email}</p>}
            </div>

            <div className="st-login__field">
              <label className="st-login__label" htmlFor="login-password">密碼</label>
              <div className="st-login__password">
                <input className="st-login__input" id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" aria-invalid={fieldErrors.password ? true : undefined} />
                <button className="st-login__button st-login__toggle" type="button" aria-controls="login-password" aria-label={toggleText} title={toggleText} onClick={() => setShowPassword((previous) => !previous)}>
                  <ToggleIcon className="st-login__toggle-icon" aria-hidden="true" focusable="false" />
                </button>
              </div>
              {fieldErrors.password && <p className="st-login__error" role="alert">{fieldErrors.password}</p>}
            </div>

            {formMessage && <p className="st-login__error" role="alert">{formMessage}</p>}
            <button className="st-login__button st-login__submit" type="submit">{submitting ? '登入中…' : '登入'}</button>
            <div className="st-login__links">
              <a href="#" onClick={(event) => event.preventDefault()}>忘記密碼？</a>
              <AuthLink to={registerPath} LinkComponent={LinkComponent}>還沒有帳號？註冊</AuthLink>
            </div>
          </fieldset>
        </form>
      </main>
    </AuthLayout>
  );
}
