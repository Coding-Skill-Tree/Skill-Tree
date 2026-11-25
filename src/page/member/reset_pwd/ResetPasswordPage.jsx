import { useCallback, useEffect, useRef, useState } from "react";
import { RESET_TEXT, ROUTES } from "./data/resetContent.js";
import { validateConfirm, validatePassword } from "./utils/validators.js";
import { ApiRequestError } from "../../../services/api.js";
import { resetPassword, verifyResetToken } from "../../../services/memberAuth.js";
import PasswordField from "./components/PasswordField/PasswordField.jsx";
// 頁首、卡片、彈窗和浮動通知元件放在 forget_pwd/components 共用。
import AuthHeader from "../forget_pwd/components/AuthHeader/AuthHeader.jsx";
import AuthCard from "../forget_pwd/components/AuthCard/AuthCard.jsx";
import Modal from "../forget_pwd/components/Modal/Modal.jsx";
import FloatingNotice from "../forget_pwd/components/FloatingNotice/FloatingNotice.jsx";

// 從網址 ?token=... 取得重設 token
const token = new URLSearchParams(window.location.search).get("token");

function ResetPasswordPage() {
  // 連結狀態：checking 確認中 → ready 可填寫／invalid 無效；沒有 token 直接視為無效、不送請求
  const [linkState, setLinkState] = useState(token ? "checking" : "invalid");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({ password: false, confirm: false });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [notice, setNotice] = useState(null);
  const [checkAttempt, setCheckAttempt] = useState(0);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);
  const clearNotice = useCallback(() => setNotice(null), []);

  // 開啟頁面時先確認連結，確認完之前欄位不能填
  useEffect(() => {
    if (!token) return undefined;
    let alive = true;
    verifyResetToken(token).then(() => {
      if (alive) setLinkState("ready");
    }).catch((error) => {
      if (!alive) return;
      if (error instanceof ApiRequestError && error.code === "INVALID_OR_EXPIRED_TOKEN") {
        setLinkState("invalid");
      } else {
        setLinkState("error");
      }
    });
    return () => {
      alive = false;
    };
  }, [checkAttempt]);

  const passwordError = validatePassword(password);
  const confirmError = validateConfirm(password, confirm);
  const fieldsDisabled = linkState !== "ready" || sending;

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({ password: true, confirm: true });
    if (passwordError) return passwordRef.current?.focus();
    if (confirmError) return confirmRef.current?.focus();

    setSending(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setNotice({ id: Date.now(), text: RESET_TEXT.successNotice });
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === "INVALID_OR_EXPIRED_TOKEN") {
        setLinkState("invalid");
      } else {
        setNotice({ id: Date.now(), text: RESET_TEXT.genericError });
      }
    } finally {
      setSending(false);
    }
  }

  function retryTokenCheck() {
    setLinkState("checking");
    setCheckAttempt((attempt) => attempt + 1);
  }

  return (
    <div className="auth-page">
      <AuthHeader />
      <FloatingNotice notice={notice} onDone={clearNotice} />

      <AuthCard
        title={done ? RESET_TEXT.successTitle : RESET_TEXT.title}
        description={
          done ? RESET_TEXT.successDescription : RESET_TEXT.description
        }
      >
        {done ? (
          <a
            className="btn btn-primary btn-large btn-block"
            href={ROUTES.login}
          >
            {RESET_TEXT.goLogin}
          </a>
        ) : (
          <form
            className="auth-form"
            onSubmit={handleSubmit}
            noValidate
            aria-busy={linkState === "checking"}
          >
            {linkState === "checking" && (
              <p className="auth-card-status" role="status">
                {RESET_TEXT.checking}
              </p>
            )}
            {linkState === "error" && (
              <div className="auth-card-status" role="alert">
                <p>{RESET_TEXT.verifyFailed}</p>
                <button type="button" className="text-link" onClick={retryTokenCheck}>
                  {RESET_TEXT.retryVerification}
                </button>
              </div>
            )}

            <PasswordField
              id="new-password"
              label={RESET_TEXT.passwordLabel}
              value={password}
              autoComplete="new-password"
              inputRef={passwordRef}
              disabled={fieldsDisabled}
              onChange={setPassword}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
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
              onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
              error={touched.confirm ? confirmError : ""}
            />

            <div className="auth-form-actions">
              <button
                type="submit"
                className="btn btn-primary btn-large btn-block"
                disabled={fieldsDisabled}
              >
                {sending ? RESET_TEXT.sendingLabel : RESET_TEXT.submitLabel}
              </button>
            </div>
          </form>
        )}
      </AuthCard>

      {/* 連結無效：蓋住表單，不能用 Esc 或點背景關閉，只能按「重新申請」 */}
      <Modal open={linkState === "invalid"} labelId="invalid-message" blocking>
        <div className="modal-body">
          <p id="invalid-message" className="modal-message">
            <span aria-hidden="true">⚠ </span>
            {RESET_TEXT.invalidMessage}
          </p>
          <div className="modal-actions">
            <a
              className="btn btn-primary"
              href={ROUTES.forgotPassword}
              autoFocus
            >
              {RESET_TEXT.invalidAction}
            </a>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ResetPasswordPage;
