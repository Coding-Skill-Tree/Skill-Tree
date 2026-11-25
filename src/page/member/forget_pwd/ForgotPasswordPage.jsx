import { useCallback, useRef, useState } from "react";
import { FORGOT_TEXT, ROUTES } from "./data/authContent.js";
import { normalizeEmail, validateEmail } from "./utils/validators.js";
import { ApiRequestError } from "../../../services/api.js";
import { requestPasswordReset } from "../../../services/memberAuth.js";
import AuthHeader from "./components/AuthHeader/AuthHeader.jsx";
import AuthCard from "./components/AuthCard/AuthCard.jsx";
import TextField from "./components/TextField/TextField.jsx";
import Modal from "./components/Modal/Modal.jsx";
import FloatingNotice from "./components/FloatingNotice/FloatingNotice.jsx";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState(null); // { code, message }
  const [sending, setSending] = useState(false);
  const [sentOpen, setSentOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const inputRef = useRef(null);
  const submitRef = useRef(null);
  const clearNotice = useCallback(() => setNotice(null), []);

  const emailError = validateEmail(email);
  const visibleError = serverError?.message || (touched ? emailError : "");
  function handleEmailChange(value) {
    setEmail(value);
    setServerError(null); // 改了 Email 就清掉上一次的查詢結果
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched(true);
    if (emailError) {
      inputRef.current?.focus();
      return;
    }

    setSending(true);
    setServerError(null);
    try {
      await requestPasswordReset(normalizeEmail(email));
      setSentOpen(true);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status < 500) {
        setServerError({ message: error.message });
        inputRef.current?.focus();
      } else {
        setNotice({ id: Date.now(), text: FORGOT_TEXT.genericError });
      }
    } finally {
      setSending(false);
    }
  }

  // 關閉後焦點回到送出按鈕（由 Modal 的 returnFocusRef 處理），Email 保留
  function closeSentDialog() {
    setSentOpen(false);
  }

  return (
    <div className="auth-page">
      <AuthHeader />
      <FloatingNotice notice={notice} onDone={clearNotice} />

      <AuthCard
        title={FORGOT_TEXT.title}
        description={FORGOT_TEXT.description}
      >
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <TextField
            id="email"
            label={FORGOT_TEXT.emailLabel}
            type="email"
            value={email}
            placeholder={FORGOT_TEXT.emailPlaceholder}
            autoComplete="email"
            inputRef={inputRef}
            onChange={handleEmailChange}
            onBlur={() => setTouched(true)}
            error={visibleError}
          />

          <div className="auth-form-actions">
            <button
              ref={submitRef}
              type="submit"
              className="btn btn-primary btn-large btn-block"
              disabled={sending}
            >
              {sending ? FORGOT_TEXT.sendingLabel : FORGOT_TEXT.submitLabel}
            </button>
            <a className="text-link" href={ROUTES.login}>
              {FORGOT_TEXT.backToLogin}
            </a>
          </div>
        </form>
      </AuthCard>

      <Modal open={sentOpen} labelId="sent-message" onClose={closeSentDialog} returnFocusRef={submitRef}>
        <div className="modal-body">
          <p id="sent-message" className="modal-message">
            <span aria-hidden="true">✉ </span>
            {FORGOT_TEXT.sentMessage}
          </p>
          <div className="modal-actions">
            <button type="button" className="btn btn-primary" onClick={closeSentDialog} autoFocus>
              {FORGOT_TEXT.sentConfirm}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ForgotPasswordPage;
