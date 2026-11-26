import "./AuthCard.css";

// 頁面外框：頁首下方置中的一張卡片，標題用 h1。
function AuthCard({ title, description, children, footer }) {
  return (
    <main className="auth-main">
      <section className="auth-card" aria-labelledby="auth-card-title">
        <div className="auth-card-heading">
          <h1 id="auth-card-title" className="auth-card-title">
            {title}
          </h1>
          {description && <p className="auth-card-description">{description}</p>}
        </div>
        {children}
      </section>
      {footer}
    </main>
  );
}

export default AuthCard;
