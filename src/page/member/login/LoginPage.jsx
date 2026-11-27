import { useState } from "react";
import { useNavigate } from "react-router";
import AuthHeader from "../forget_pwd/components/AuthHeader/AuthHeader.jsx";
import AuthCard from "../forget_pwd/components/AuthCard/AuthCard.jsx";
import TextField from "../forget_pwd/components/TextField/TextField.jsx";
import PasswordField from "../reset_pwd/components/PasswordField/PasswordField.jsx";
import FloatingNotice from "../forget_pwd/components/FloatingNotice/FloatingNotice.jsx";
import { ApiRequestError } from "../../../services/api.js";
import { loginMember } from "../../../services/memberAuth.js";
import { normalizeEmail, validateEmail } from "../forget_pwd/utils/validators.js";
import { ROUTES } from "../forget_pwd/data/authContent.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched(true);
    setPasswordTouched(true);
    setEmailError("");
    if (validateEmail(email)) return;
    if (!password) return;

    setSubmitting(true);
    setNotice(null);
    try {
      const member = await loginMember({ email: normalizeEmail(email), password });
      navigate(member.onboardingCompleted ? ROUTES.learn : ROUTES.onboarding, { replace: true });
    } catch (error) {
      if (error instanceof ApiRequestError && error.fields?.email) {
        setEmailError(error.fields.email);
      } else {
        setNotice({ id: Date.now(), text: "Email 或密碼錯誤，或目前無法登入。" });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <AuthHeader />
      <FloatingNotice notice={notice} onDone={() => setNotice(null)} />
      <AuthCard title="會員登入" description="登入後繼續建立角色或回到你的學習進度。">
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <TextField
            id="login-email"
            label="Email"
            type="email"
            value={email}
            placeholder="you@example.com"
            autoComplete="email"
            onChange={(value) => { setEmail(value); setEmailError(""); }}
            onBlur={() => setTouched(true)}
            error={emailError || (touched ? validateEmail(email) : "")}
            disabled={submitting}
          />
          <PasswordField
            id="login-password"
            label="密碼"
            value={password}
            autoComplete="current-password"
            onChange={setPassword}
            onBlur={() => setPasswordTouched(true)}
            error={passwordTouched && !password ? "請輸入密碼" : ""}
            disabled={submitting}
          />
          <div className="auth-form-actions">
            <button type="submit" className="btn btn-primary btn-large btn-block" disabled={submitting}>
              {submitting ? "登入中…" : "登入"}
            </button>
            <a className="text-link" href={ROUTES.forgotPassword}>忘記密碼？</a>
          </div>
        </form>
      </AuthCard>
    </div>
  );
}
