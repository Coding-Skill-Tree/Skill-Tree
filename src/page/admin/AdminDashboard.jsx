import { useEffect, useState } from "react";
import { getAdminQuestionSummary } from "../../services/adminQuestions";
import AdminIcon from "./AdminIcon";
import AdminLayout from "./AdminLayout";

const categoryColors = ["mint", "blue", "violet", "amber", "coral", "teal"];

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

function StatCard({ icon, label, value, helper, tone }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon stat-icon-${tone}`}><AdminIcon name={icon} size={19}/></div>
      <div className="stat-label-row"><span>{label}</span><span className="stat-period">目前</span></div>
      <strong className="stat-value">{value}</strong>
      <span className="stat-helper">{helper}</span>
    </article>
  );
}

function CategoryPanel({ categories, total }) {
  const maxCount = Math.max(1, ...categories.map((category) => category.count));
  return (
    <section className="admin-panel category-panel" aria-labelledby="category-heading">
      <div className="panel-heading">
        <div><span className="panel-kicker">QUESTION LIBRARY</span><h2 id="category-heading">分類題目分布</h2></div>
        <a className="panel-link" href="/admin/questions">查看題庫<AdminIcon name="chevron-right" size={15}/></a>
      </div>
      {categories.length === 0 ? <div className="admin-panel-empty">目前沒有啟用中的技能分類。</div> : (
        <div className="category-list">
          {categories.map((category, index) => {
            const color = categoryColors[index % categoryColors.length];
            const percentage = total > 0 ? Math.round((category.count / total) * 100) : 0;
            return (
              <div className="category-row" key={category.categoryId}>
                <div className="category-meta"><span className="category-name"><span className={`category-dot dot-${color}`}/>{category.category}</span><span className="category-count">{category.count}<small> 題</small></span></div>
                <div className="category-track" role="progressbar" aria-label={`${category.category}題目數量占比`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
                  <span className={`category-fill fill-${color}`} style={{ width: `${Math.round((category.count / maxCount) * 100)}%` }}/>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="category-panel-foot"><span>共 {categories.length} 個技能分類</span><span>資料來自題庫</span></div>
    </section>
  );
}

function RecentQuestionsPanel({ questions }) {
  return (
    <section className="admin-panel recent-panel" aria-labelledby="recent-heading">
      <div className="panel-heading">
        <div><span className="panel-kicker">LATEST UPDATES</span><h2 id="recent-heading">最近新增題目</h2></div>
        <a className="panel-link" href="/admin/questions">全部題目<AdminIcon name="chevron-right" size={15}/></a>
      </div>
      {questions.length === 0 ? <div className="admin-panel-empty">目前還沒有題目，新增後會顯示在這裡。</div> : (
        <ul className="recent-list">
          {questions.map((question, index) => (
            <li className="recent-item" key={question.id}>
              <span className={`recent-index recent-index-${(index % 3) + 1}`}>{String(index + 1).padStart(2, "0")}</span>
              <div className="recent-copy"><span className="recent-id">#{question.id} <i>·</i> {question.category}</span><strong>{question.prompt}</strong><small><AdminIcon name="clock" size={13}/>{formatDate(question.updatedAt)}</small></div>
              <span className={`question-status${question.status === "draft" ? " is-draft" : ""}`}><span />{question.status === "draft" ? "草稿" : "已發布"}</span>
            </li>
          ))}
        </ul>
      )}
      <a className="recent-add-link" href="/admin/questions/new"><span className="recent-add-icon"><AdminIcon name="plus" size={17}/></span><span><strong>新增題目</strong><small>建立新的技能題目與解析</small></span><AdminIcon name="arrow" size={16}/></a>
    </section>
  );
}

export default function AdminDashboard({ admin, onLogout }) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    getAdminQuestionSummary()
      .then((data) => { if (active) { setSummary(data); setError(""); } })
      .catch((requestError) => { if (active) setError(requestError.message || "載入題庫統計失敗。"); });
    return () => { active = false; };
  }, [retryKey]);

  const categories = summary?.categories ?? [];
  const recent = summary?.recent ?? [];
  const total = summary?.total ?? 0;
  return (
    <AdminLayout activePage="overview" breadcrumb="總覽" questionCount={summary?.total} admin={admin} onLogout={onLogout}>
      <main className="admin-content">
        <section className="admin-page-heading">
          <div><span className="page-eyebrow">SKILL TREE <i>/</i> ADMIN</span><h1>管理員後台</h1><p>掌握題庫內容、分類分布與最近更新。</p></div>
          <a className="admin-primary-button" href="/admin/questions/new"><AdminIcon name="plus" size={17}/>新增題目</a>
        </section>

        {error && <div className="admin-inline-error" role="alert"><span>{error}</span><button className="admin-secondary-button" type="button" onClick={() => { setError(""); setRetryKey((key) => key + 1); }}>重試</button></div>}
        <section className="stats-grid" aria-label="題庫統計" aria-busy={!summary && !error}>
          <StatCard icon="book" label="題目總數" value={summary ? total : "—"} helper="題庫內所有題目" tone="lime"/>
          <StatCard icon="stack" label="技能分類" value={summary ? String(categories.length).padStart(2, "0") : "—"} helper="啟用中的技能分類" tone="blue"/>
          <StatCard icon="check" label="已發布題目" value={summary ? summary.publishedCount : "—"} helper="目前可供學習使用" tone="violet"/>
          <StatCard icon="clock" label="待整理草稿" value={summary ? summary.draftCount : "—"} helper="尚未發布的題目" tone="amber"/>
        </section>

        <div className="dashboard-grid">
          <CategoryPanel categories={categories} total={total}/>
          <RecentQuestionsPanel questions={recent}/>
        </div>
      </main>
    </AdminLayout>
  );
}
