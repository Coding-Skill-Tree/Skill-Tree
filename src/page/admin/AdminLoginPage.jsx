import { useState } from "react";
import { loginAdmin } from "../../services/adminAuth";

export default function AdminLoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      onLogin(await loginAdmin({ username, password }));
    } catch (requestError) {
      setError(requestError.status === 401
        ? "管理員帳號或密碼錯誤。"
        : requestError.message || "登入失敗，請稍後再試。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card">
        <a className="admin-brand" href="/admin" aria-label="Skill Tree 管理後台">
          <span className="admin-brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span className="admin-brand-copy">Skill Tree<small>ADMIN CONSOLE</small></span>
        </a>
        <span className="page-eyebrow">SECURE ADMIN ACCESS</span>
        <h1>管理員登入</h1>
        <p>使用管理員帳號進入題庫管理工作區。</p>
        <form className="admin-auth-form" onSubmit={handleSubmit}>
          <label className="question-form-field" htmlFor="admin-username">
            <span className="question-form-label">管理員帳號</span>
            <input className="question-form-control" id="admin-username" name="username" autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label className="question-form-field" htmlFor="admin-password">
            <span className="question-form-label">密碼</span>
            <input className="question-form-control" id="admin-password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error && <p className="question-field-error" role="alert">{error}</p>}
          <button className="admin-primary-button" type="submit" disabled={submitting}>
            {submitting ? "登入中…" : "登入管理後台"}
          </button>
        </form>
      </section>
    </main>
  );
}
