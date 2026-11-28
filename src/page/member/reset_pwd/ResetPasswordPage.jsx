import { useCallback, useRef, useState } from "react";
import { RESET_TEXT, ROUTES } from "./data/resetContent.js";
import { validateConfirm, validatePassword } from "./utils/validators.js";
import { normalizeEmail, validateEmail } from "../forget_pwd/utils/validators.js";
import { ApiRequestError } from "../../../services/api.js";
import { resetPassword } from "../../../services/memberAuth.js";
import PasswordField from "./components/PasswordField/PasswordField.jsx";
import AuthHeader from "../forget_pwd/components/AuthHeader/AuthHeader.jsx";
import AuthCard from "../forget_pwd/components/AuthCard/AuthCard.jsx";
import TextField from "../forget_pwd/components/TextField/TextField.jsx";
import FloatingNotice from "../forget_pwd/components/FloatingNotice/FloatingNotice.jsx";

function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({ email: false, code: false, password: false, confirm: false });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [notice, setNotice] = useState(null);
  const codeRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);
  const clearNotice = useCallback(() => setNotice(null), []);

  const normalizedEmail = normalizeEmail(email);
  const emailError = validateEmail(email);
  const localCodeError = touched.code && !/^\d{6}$/u.test(code) ? RESET_TEXT.codeFormat : "";
  const passwordError = validatePassword(password);
  const confirmError = validateConfirm(password, confirm);
  const fieldsDisabled = sending;

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({ email: true, code: true, password: true, confirm: true });
    if (emailError) return;
    if (!/^\d{6}$/u.test(code)) return codeRef.current?.focus();
    if (passwordError) return passwordRef.current?.focus();
    if (confirmError) return confirmRef.current?.focus();

    setSending(true);
    setCodeError("");
    try {
      await resetPassword(normalizedEmail, code, password);
      setDone(true);
      setNotice({ id: Date.now(), text: RESET_TEXT.successNotice });
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === "INVALID_OR_EXPIRED_CODE") {
        setCodeError(RESET_TEXT.invalidCode);
        codeRef.current?.focus();
      } else {
        setNotice({ id: Date.now(), text: RESET_TEXT.genericError });
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="auth-page">
      <AuthHeader />
      <FloatingNotice notice={notice} onDone={clearNotice} />

      <AuthCard
        title={done ? RESET_TEXT.successTitle : RESET_TEXT.title}
        description={done ? RESET_TEXT.successDescription : RESET_TEXT.description}
      >
        {done ? (
          <a className="btn btn-primary btn-large btn-block" href={ROUTES.login}>
            {RESET_TEXT.goLogin}
          </a>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <TextField
              id="reset-email"
              label={RESET_TEXT.emailLabel}
              type="email"
              value={email}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={fieldsDisabled}
              onChange={(value) => { setEmail(value); setCodeError(""); }}
              onBlur={() => setTouched((state) => ({ ...state, email: true }))}
              error={touched.email ? emailError : ""}
            />
            <TextField
              id="reset-code"
              label={RESET_TEXT.codeLabel}
              value={code}
              placeholder="000000"
              autoComplete="one-time-code"
              inputMode="numeric"
              inputRef={codeRef}
              disabled={fieldsDisabled}
              onChange={(value) => { setCode(value.replace(/\D/gu, "").slice(0, 6)); setCodeError(""); }}
              onBlur={() => setTouched((state) => ({ ...state, code: true }))}
              error={codeError || (touched.code ? localCodeError : "")}
              hint={RESET_TEXT.codeHint}
            />
            <PasswordField
              id="new-password"
              label={RESET_TEXT.passwordLabel}
              value={password}
              autoComplete="new-password"
              inputRef={passwordRef}
              disabled={fieldsDisabled}
              onChange={setPassword}
              onBlur={() => setTouched((state) => ({ ...state, password: true }))}
              error={touched.password ? passwordError : ""}
              hint={RESET_TEXT.passwordHint}
            />
            <PasswordField
              id="confirm-password"
              label={RESET_TEXT.confirmLabel}
              value={confirm}
              autoComplete="new-password"
              inputRef={confirmRef}
              disabled={fieldsDisabled}
              onChange={setConfirm}
              onBlur={() => setTouched((state) => ({ ...state, confirm: true }))}
              error={touched.confirm ? confirmError : ""}
            />
            <div className="auth-form-actions">
              <button type="submit" className="btn btn-primary btn-large btn-block" disabled={fieldsDisabled}>
                {sending ? RESET_TEXT.sendingLabel : RESET_TEXT.submitLabel}
              </button>
              <a className="text-link" href={ROUTES.forgotPassword}>{RESET_TEXT.requestNewCode}</a>
            </div>
          </form>
        )}
      </AuthCard>
    </div>
  );
}

export default ResetPasswordPage;
