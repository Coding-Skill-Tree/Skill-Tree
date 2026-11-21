import { useCallback, useEffect, useRef, useState } from "react";
import { ADMIN_ROUTES, COMMON_TEXT } from "../BE_member/shared/adminContent.js";
import { adminLogin, getAdminMe } from "../BE_member/shared/fakeAdminApi.js";
import AdminHeader from "../BE_member/shared/AdminHeader/AdminHeader.jsx";
// 卡片、文字欄位、密碼欄位（眼睛圖示）、浮動通知、示範區塊沿用前台會員頁的元件
import AuthCard from "../forget_pwd/components/AuthCard/AuthCard.jsx";
import TextField from "../forget_pwd/components/TextField/TextField.jsx";
import PasswordField from "../reset_pwd/components/PasswordField/PasswordField.jsx";
import FloatingNotice from "../forget_pwd/components/FloatingNotice/FloatingNotice.jsx";
import DemoHint from "../forget_pwd/components/DemoHint/DemoHint.jsx";
import "./AdminLoginPage.css";

const TEXT = {
  title: "後台登入",
  description: "僅限管理員使用。",
  usernameLabel: "帳號",
  passwordLabel: "密碼",
  usernameEmpty: "請輸入帳號",
  passwordEmpty: "請輸入密碼",
  submit: "登入",
  submitting: "登入中…",
};

// 後台登入頁：沒有註冊、會員登入、忘記密碼、Google 登入的連結。
function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ username: false, password: false });
  const [formError, setFormError] = useState(""); // 401／429 訊息，顯示在登入按鈕正上方
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState(null);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const clearNotice = useCallback(() => setNotice(null), []);

  // 已經登入後台的管理員打開登入頁：直接到會員列表（確認失敗時照常顯示登入頁）
  useEffect(() => {
    let alive = true;
    getAdminMe()
      .then(({ status }) => {
        if (alive && status === 200) window.location.replace(ADMIN_ROUTES.members);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const usernameError = username.trim() ? "" : TEXT.usernameEmpty;
  const passwordError = password ? "" : TEXT.passwordEmpty;

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({ username: true, password: true });
    // 有欄位是空的就不送出
    if (usernameError) return usernameRef.current?.focus();
    if (passwordError) return passwordRef.current?.focus();

    setSending(true);
    setFormError("");
    const result = await adminLogin(username, password).catch(() => ({ status: 0 }));
    setSending(false);

    if (result.status === 200) {
      window.location.assign(ADMIN_ROUTES.members);
    } else if (result.status === 401 || result.status === 429) {
      setFormError(result.body.error.message); // 帳號保留，密碼清空重新輸入
      setPassword("");
      setTouched((t) => ({ ...t, password: false }));
      passwordRef.current?.focus();
    } else {
      setNotice({ id: Date.now(), text: COMMON_TEXT.actionFailed });
    }
  }

  return (
    <div className="auth-page">
      <AdminHeader />
      <FloatingNotice notice={notice} onDone={clearNotice} />

      <AuthCard
        title={TEXT.title}
        description={TEXT.description}
        footer={
          <DemoHint>
            <ul className="demo-hint-list">
              <li>
                正確帳密：<code>site_admin</code> ／ <code>backoffice2026</code>
              </li>
              <li>錯誤密碼 → 帳號或密碼錯誤；同帳號錯 5 次後 → 嘗試次數過多</li>
              <li>
                帳號 <code>error</code> → 伺服器錯誤的浮動通知
              </li>
            </ul>
          </DemoHint>
        }
      >
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <TextField
            id="admin-username"
            label={TEXT.usernameLabel}
            value={username}
            autoComplete="username"
            inputRef={usernameRef}
            onChange={setUsername}
            onBlur={() => setTouched((t) => ({ ...t, username: true }))}
            error={touched.username ? usernameError : ""}
          />
          <PasswordField
            id="admin-password"
            label={TEXT.passwordLabel}
            value={password}
            autoComplete="current-password"
            inputRef={passwordRef}
            onChange={setPassword}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            error={touched.password ? passwordError : ""}
          />

          <div className="auth-form-actions">
            {formError && (
              <p className="admin-login-error" role="alert">
                <span aria-hidden="true">⚠</span>
                {formError}
              </p>
            )}
            <button type="submit" className="btn btn-primary btn-large btn-block" disabled={sending}>
              {sending ? TEXT.submitting : TEXT.submit}
            </button>
          </div>
        </form>
      </AuthCard>
    </div>
  );
}

export default AdminLoginPage;
