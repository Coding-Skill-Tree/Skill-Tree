export default function AdminPlaceholderPage() {
    const page = { issue: "404", title: "找不到頁面", description: "請從管理員後台總覽重新選擇功能。", note: "請從管理員後台總覽重新選擇功能。" };
    return (<main className="admin-placeholder-page">
      <section className="admin-placeholder-card">
        <a className="admin-brand" href="/admin" aria-label="返回管理員後台總覽">
          <span className="admin-brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span className="admin-brand-copy">Skill Tree<small>ADMIN CONSOLE</small></span>
        </a>
        <span className="placeholder-issue">{page.issue} · 頁面入口</span>
        <h1>{page.title}</h1>
        <p>{page.description}</p>
        <p className="placeholder-note">{page.note}</p>
        <a className="admin-primary-button" href="/admin">返回後台總覽</a>
      </section>
    </main>);
}
