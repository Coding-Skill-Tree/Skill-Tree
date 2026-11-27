import { useState } from 'react';
import { Eye, EyeClosed } from 'iconoir-react';
import './RegisterPage.css';
import { apiRequest, ApiRequestError } from '../../../../services/api.js';
import {
  getConfirmPasswordError,
  getEmailError,
  getRegisterPasswordError,
  pickErrors,
} from '../utils/validators.js';

function PasswordField({ id, name, label, hint, error, onBlur, fieldClass = '' }) {
  const [visible, setVisible] = useState(false);
  const actionText = `${visible ? '隱藏' : '顯示'}${label}`;
  const Icon = visible ? EyeClosed : Eye;
  return (
    <div className={`st-register-field ${fieldClass}`}>
      <label htmlFor={id}>{label}</label>
      <div className="st-register-password-row">
        <input id={id} name={name} type={visible ? 'text' : 'password'} autoComplete="new-password" aria-describedby={hint ? `${id}-hint` : undefined} aria-invalid={error ? true : undefined} className="st-register-input" />
        <button type="button" className="st-register-toggle" aria-controls={id} aria-label={actionText} title={actionText} onClick={() => setVisible(v => !v)}>
          <Icon className="st-register-toggle-icon" aria-hidden="true" focusable="false" />
        </button>
      </div>
      {hint && <p className="st-register-hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="st-register-error" role="alert">{error}</p>}
    </div>
  );
}

// 讀取目前表單的值；Email 先去除前後空白。
function readValues(form) {
  return {
    email: form.email.value.trim(),
    password: form.password.value,
    confirmPassword: form.confirmPassword.value,
  };
}

// 單一欄位的檢查；確認密碼需要和密碼一起比對。
function validateField(name, values) {
  switch (name) {
    case 'email':
      return getEmailError(values.email);
    case 'password':
      return getRegisterPasswordError(values.password);
    case 'confirmPassword':
      return getConfirmPasswordError(values.password, values.confirmPassword);
    default:
      return '';
  }
}

export default function RegisterPage() {
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState('');
  const [succeeded, setSucceeded] = useState(false);

  // 離開欄位時檢查（focusout 會冒泡到 form）。
  function handleBlur(event) {
    const { name } = event.target;
    if (!['email', 'password', 'confirmPassword'].includes(name)) return;
    const values = readValues(event.currentTarget);
    const error = validateField(name, values);
    setFieldErrors(previous => ({ ...previous, [name]: error || undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = readValues(form);

    // 前端有錯誤時不送出請求
    const errors = pickErrors({
      email: validateField('email', values),
      password: validateField('password', values),
      confirmPassword: validateField('confirmPassword', values),
    });
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setMessage('');
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    setMessage('');
    setSucceeded(false);
    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: values.email, password: values.password }),
      });
      setSucceeded(true);
      setMessage('註冊成功，請至信箱完成驗證後再登入。');
      form.reset();
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.code === 'VALIDATION_ERROR') {
          setFieldErrors(error.details?.fields ?? {});
        } else if (error.code === 'EMAIL_TAKEN') {
          setFieldErrors({ email: error.message });
        } else {
          setMessage(error.message);
        }
      } else {
        setMessage('網路錯誤，請稍後再試。');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="st-register-page">
      <main className="st-register-main">
        <form className="st-register-form" noValidate onBlur={handleBlur} onSubmit={handleSubmit}>
          <fieldset className="st-register-card" disabled={submitting}>
            <legend>註冊</legend>
            <button type="button" className="st-register-button st-register-google">使用 Google 註冊</button>
            <div className="st-register-divider">或</div>
            <div className="st-register-field st-register-email">
              <label htmlFor="register-email">Email</label>
              <input id="register-email" name="email" type="email" autoComplete="email" aria-invalid={fieldErrors.email ? true : undefined} className="st-register-input" />
              {fieldErrors.email && <p className="st-register-error" role="alert">{fieldErrors.email}</p>}
            </div>
            <PasswordField id="register-password" name="password" label="密碼" fieldClass="st-register-password" hint="8 到 25 字，需同時包含英文字母與數字" error={fieldErrors.password} />
            <PasswordField id="register-confirm-password" name="confirmPassword" label="確認密碼" error={fieldErrors.confirmPassword} />
            {message && <p className={succeeded ? 'st-register-success' : 'st-register-error'} role="status">{message}</p>}
            <button type="submit" className="st-register-button st-register-submit">{submitting ? '送出中…' : '註冊'}</button>
            <p className="st-register-login"><a href="#/login">已有帳號？登入</a></p>
          </fieldset>
        </form>
      </main>
    </div>
  );
}
