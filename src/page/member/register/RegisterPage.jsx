import { useState } from "react";
import { useNavigate } from "react-router";
import AuthHeader from "../forget_pwd/components/AuthHeader/AuthHeader.jsx";
import AuthCard from "../forget_pwd/components/AuthCard/AuthCard.jsx";
import TextField from "../forget_pwd/components/TextField/TextField.jsx";
import PasswordField from "../reset_pwd/components/PasswordField/PasswordField.jsx";
import FloatingNotice from "../forget_pwd/components/FloatingNotice/FloatingNotice.jsx";
import { ApiRequestError } from "../../../services/api.js";
import { registerMember } from "../../../services/memberAuth.js";
import { normalizeEmail, validateEmail } from "../forget_pwd/utils/validators.js";
import { validateConfirm, validatePassword } from "../reset_pwd/utils/validators.js";
import { ROUTES } from "../forget_pwd/data/authContent.js";

const TEXT = {
  title: "建立會員帳號",
  description: "建立成功後會直接登入，接著建立你的角色，不需要先驗證信箱。",
  passwordHint: "8 到 25 個英文字母與數字，且至少各包含一個。",
  submit: "建立帳號並繼續",
  submitting: "建立中…",
  genericError: "目前無法建立帳號，請稍後再試。",
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false, confirm: false });
  const [serverErrors, setServerErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const emailError = serverErrors.email || (touched.email ? validateEmail(email) : "");
  const passwordError = serverErrors.password || (touched.password ? validatePassword(password) : "");
  const confirmError = touched.confirm ? validateConfirm(password, confirmPassword) : "";

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({ email: true, password: true, confirm: true });
    const nextErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
      confirm: validateConfirm(password, confirmPassword),
    };
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    setServerErrors({});
    setNotice(null);
    try {
      await registerMember({ email: normalizeEmail(email), password });
      navigate(ROUTES.onboarding, { replace: true });
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === "EMAIL_TAKEN") {
        setServerErrors({ email: error.message });
      } else if (error instanceof ApiRequestError && error.fields) {
        setServerErrors(error.fields);
      } else {
        setNotice({ id: Date.now(), text: TEXT.genericError });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <AuthHeader />
      <FloatingNotice notice={notice} onDone={() => setNotice(null)} />
      <AuthCard title={TEXT.title} description={TEXT.description}>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <TextField
            id="register-email"
            label="Email"
            type="email"
            value={email}
            placeholder="you@example.com"
            autoComplete="email"
            onChange={(value) => { setEmail(value); setServerErrors((current) => ({ ...current, email: "" })); }}
            onBlur={() => setTouched((current) => ({ ...current, email: true }))}
            error={emailError}
            disabled={submitting}
          />
          <PasswordField
            id="register-password"
            label="密碼"
            value={password}
            autoComplete="new-password"
            hint={TEXT.passwordHint}
            onChange={(value) => { setPassword(value); setServerErrors((current) => ({ ...current, password: "" })); }}
            onBlur={() => setTouched((current) => ({ ...current, password: true }))}
            error={passwordError}
            disabled={submitting}
          />
          <PasswordField
            id="register-confirm-password"
            label="確認密碼"
            value={confirmPassword}
            autoComplete="new-password"
            onChange={setConfirmPassword}
            onBlur={() => setTouched((current) => ({ ...current, confirm: true }))}
            error={confirmError}
            disabled={submitting}
          />
          <div className="auth-form-actions">
            <button type="submit" className="btn btn-primary btn-large btn-block" disabled={submitting}>
              {submitting ? TEXT.submitting : TEXT.submit}
            </button>
          </div>
        </form>
      </AuthCard>
    </div>
  );
}
