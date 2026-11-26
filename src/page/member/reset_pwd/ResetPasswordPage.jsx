import { useCallback, useEffect, useRef, useState } from "react";
import { DEMO_LINKS, RESET_TEXT, ROUTES } from "./data/resetContent.js";
import { validateConfirm, validatePassword } from "./utils/validators.js";
import { resetPassword, verifyResetToken } from "./utils/fakeResetApi.js";
import PasswordField from "./components/PasswordField/PasswordField.jsx";
// 頁首、卡片、彈窗、浮動通知、示範區塊和忘記密碼頁共用，放在 forget_pwd/components
import AuthHeader from "../forget_pwd/components/AuthHeader/AuthHeader.jsx";
import AuthCard from "../forget_pwd/components/AuthCard/AuthCard.jsx";
import Modal from "../forget_pwd/components/Modal/Modal.jsx";
import FloatingNotice from "../forget_pwd/components/FloatingNotice/FloatingNotice.jsx";
import DemoHint from "../forget_pwd/components/DemoHint/DemoHint.jsx";

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
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);
  const clearNotice = useCallback(() => setNotice(null), []);

  // 開啟頁面時先確認連結，確認完之前欄位不能填
  useEffect(() => {
    if (!token) return undefined;
    let alive = true;
    verifyResetToken(token).then(({ status }) => {
      if (alive) setLinkState(status === 204 ? "ready" : "invalid");
    });
    return () => {
      alive = false;
    };
  }, []);

  const passwordError = validatePassword(password);
  const confirmError = validateConfirm(password, confirm);
  const fieldsDisabled = linkState !== "ready" || sending;

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({ password: true, confirm: true });
    if (passwordError) return passwordRef.current?.focus();
    if (confirmError) return confirmRef.current?.focus();

    setSending(true);
    const { status, body } = await resetPassword(token, password);
    setSending(false);

    if (status === 204) {
      // 正式版：導向 /login 並顯示浮動通知；第一階段先在本頁顯示完成畫面
      setDone(true);
      setNotice({ id: Date.now(), text: RESET_TEXT.successNotice });
    } else if (body?.error?.code === "INVALID_TOKEN") {
      setLinkState("invalid"); // 開啟後才過期，一樣跳出無效彈窗
    } else {
      setNotice({ id: Date.now(), text: RESET_TEXT.genericError });
    }
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
        footer={
          <DemoHint>
            <p className="demo-hint-links">
              {DEMO_LINKS.map((item) => (
                <a key={item.label} className="text-link" href={item.href}>
                  {item.label}
                </a>
              ))}
            </p>
          </DemoHint>
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
